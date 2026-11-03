const { POST_SORT_FIELDS, CONTENT_STATUS } = require("../utils/constants");
const Model = require("./model");

module.exports = class DbPost extends Model {
  static table = 'posts';

  static async findByTitle(title) {
    return await this.findOneBy({ title });
  }

  static async findAll({
    page,
    limit,
    offset,
    sortBy = POST_SORT_FIELDS.LIKES,
    order = 'DESC',
    where = {},
    search = {},
    category,
    dateFrom,
    dateTo,
    favoriteUserId,
    subscribedUserId,
    currentUserId,
    isAdmin
  } = {}) {
    const sortByLikes = sortBy === POST_SORT_FIELDS.LIKES;
    const sortByFavorited = sortBy === 'favorited_at' && favoriteUserId;
    const sortBySubscribed = sortBy === 'subscribed_at' && subscribedUserId;

    let baseSql = `SELECT p.*,
        COALESCE(lc.like_count, 0) AS like_count,
        COALESCE(cc.comment_count, 0) AS comment_count,
        COALESCE(ac.attachment_count, 0) AS attachment_count,
        cat.category_titles AS category_titles,
        u.login AS author_login,
        EXISTS (
          SELECT 1 FROM favorite_posts ffp WHERE ffp.post_id = p.id AND ffp.user_id = ?
        ) AS is_favorited
        ${sortByFavorited ? ', fp.favorited_at' : ''}
        ${sortBySubscribed ? ', ps.subscribed_at' : ''}
      FROM \`${this.table}\` p
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN (
        SELECT post_id,
          SUM(CASE WHEN type = 'like' THEN 1 WHEN type = 'dislike' THEN -1 ELSE 0 END) AS like_count
        FROM likes WHERE post_id IS NOT NULL GROUP BY post_id
      ) lc ON p.id = lc.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS comment_count FROM comments GROUP BY post_id
      ) cc ON p.id = cc.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) AS attachment_count FROM post_attachments GROUP BY post_id
      ) ac ON p.id = ac.post_id
      LEFT JOIN (
        SELECT post_id, GROUP_CONCAT(category SEPARATOR ',') AS category_titles FROM post_categories GROUP BY post_id
      ) cat ON p.id = cat.post_id`;

    const clauses = [];
    const params = [currentUserId ?? null];

    if (favoriteUserId) {
      baseSql += ` JOIN favorite_posts fp ON p.id = fp.post_id`;
      clauses.push(`fp.user_id = ?`);
      params.push(favoriteUserId);
    }

    if (subscribedUserId) {
      baseSql += ` JOIN post_subscriptions ps ON p.id = ps.post_id`;
      clauses.push(`ps.user_id = ?`);
      params.push(subscribedUserId);
    }

    if (dateFrom) {
      clauses.push(`p.\`publish_date\` >= ?`);
      params.push(dateFrom);
    }
    if (dateTo) {
      clauses.push(`p.\`publish_date\` <= ?`);
      params.push(dateTo);
    }

    const categoryList = category
      ? String(category).split(',').map(c => c.trim()).filter(c => c.length > 0)
      : [];

    if (categoryList.length > 0) {
      const titles = categoryList.filter(c => !Number.isInteger(Number(c)));
      const numericIds = categoryList.filter(c => Number.isInteger(Number(c))).map(Number);

      const subClauses = [];
      if (titles.length > 0) {
        subClauses.push(`category IN (${titles.map(() => '?').join(', ')})`);
        params.push(...titles);
      }
      if (numericIds.length > 0) {
        subClauses.push(`category IN (SELECT title FROM categories WHERE id IN (${numericIds.map(() => '?').join(', ')}))`);
        params.push(...numericIds);
      }

      clauses.push(`p.id IN (SELECT DISTINCT post_id FROM post_categories WHERE ${subClauses.join(' OR ')})`);
    }

    for (const [column, value] of Object.entries(where)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        if (value.length > 0) {
          const placeholders = value.map(() => '?').join(', ');
          clauses.push(`p.\`${column}\` IN (${placeholders})`);
          params.push(...value);
        }
      } else {
        clauses.push(`p.\`${column}\` = ?`);
        params.push(value);
      }
    }

    if (!isAdmin) {
      if (currentUserId) {
        clauses.push(`(p.status IN ('${CONTENT_STATUS.ACTIVE}', '${CONTENT_STATUS.RESOLVED}') OR p.user_id = ?)`);
        params.push(currentUserId);
      } else {
        clauses.push(`p.status IN ('${CONTENT_STATUS.ACTIVE}', '${CONTENT_STATUS.RESOLVED}')`);
      }
    }

    const searchClauses = [];
    for (const [column, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      searchClauses.push(`p.\`${column}\` LIKE ?`);
      params.push(`%${String(value)}%`);
    }
    if (searchClauses.length > 0) {
      clauses.push(`(${searchClauses.join(' OR ')})`);
    }

    if (clauses.length > 0) {
      baseSql += ` WHERE ${clauses.join(' AND ')}`;
    }

    const safeOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    if (sortByFavorited) {
      baseSql += ` ORDER BY fp.favorited_at ${safeOrder}, p.\`publish_date\` DESC`;
    } else if (sortBySubscribed) {
      baseSql += ` ORDER BY ps.subscribed_at ${safeOrder}, p.\`publish_date\` DESC`;
    } else if (sortByLikes) {
      baseSql += ` ORDER BY like_count ${safeOrder}, p.\`publish_date\` DESC`;
    } else {
      const safeSort = ['publish_date', 'title'].includes(sortBy) ? sortBy : 'publish_date';
      baseSql += ` ORDER BY p.\`${safeSort}\` ${safeOrder}`;
    }

    return await this.paginateQuery(baseSql, params, { page, limit, offset });
  }

  static async addAttachments(postId, filenames, conn) {
    if (!filenames || filenames.length === 0) return;
    const placeholders = filenames.map(() => '(?, ?)').join(', ');
    const values = filenames.flatMap(name => [postId, name]);
    await this.query(
      `INSERT INTO post_attachments (post_id, attachment_path) VALUES ${placeholders}`,
      values,
      conn
    );
  }

  static async getAttachments(postId) {
    const rows = await this.query(
      `SELECT attachment_path FROM post_attachments WHERE post_id = ?`,
      [postId]
    );
    return rows.map(r => r.attachment_path);
  }

  static async deleteAttachments(postId) {
    await this.query(
      `DELETE FROM post_attachments WHERE post_id = ?`,
      [postId]
    );
  }

  static async deleteAttachment(postId, filename) {
    return await this.query(
      `DELETE FROM post_attachments WHERE post_id = ? AND attachment_path = ?`,
      [postId, filename]
    );
  }
};
