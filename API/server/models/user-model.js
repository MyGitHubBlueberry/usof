const Model = require("./model");
const { ROLES, ROLE_LEVELS, REACTION_TYPES } = require("../utils/constants");

module.exports = class DbUser extends Model {
  static table = 'users';

  static async findByLogin(login) {
    return await this.findOneBy({ login });
  }

  static async findByEmail(email) {
    return await this.findOneBy({ email });
  }

  static async findByEmailOrLogin(identifier) {
    const rows = await this.query(
      `SELECT * FROM \`${this.table}\` WHERE login = ? OR email = ? LIMIT 1`,
      [identifier, identifier]
    );
    return rows.length > 0 ? new this(rows[0]) : null;
  }

  static async searchByLogin(query, limit = 8) {
    return await this.query(
      `SELECT id, login, profile_picture_path FROM \`${this.table}\`
        WHERE login LIKE ?
        ORDER BY login ASC
        LIMIT ?`,
      [`${query}%`, Number(limit)]
    );
  }

  static async findByVerificationToken(email_verification_token) {
    return await this.findOneBy({ email_verification_token });
  }

  static async findByResetToken(token) {
    const rows = await this.query(
      `SELECT * FROM \`${this.table}\`
        WHERE password_reset_token = ?
        AND password_reset_token_expires > NOW()
      LIMIT 1`,
      [token]
    );
    return rows.length > 0 ? new this(rows[0]) : null;
  }

  isAdmin() {
    const level = ROLE_LEVELS[this.role] ?? 0;
    return level >= ROLE_LEVELS[ROLES.ADMIN];
  }

  isSuperadmin() {
    return this.role === ROLES.SUPERADMIN;
  }

  isConfirmed() {
    return Boolean(this.is_email_confirmed);
  }

  getPublicFields() {
    const {
      password, email_verification_token,
      password_reset_token, password_reset_token_expires,
      ...user
    } = this;
    return user;
  }

  static async getWeeklyLeaderboard({ page, limit, offset } = {}) {
    const weeklyPostRating = `
        SELECT
          target_user.id AS user_id,
          SUM(
            CASE
              WHEN l.type = '${REACTION_TYPES.LIKE}' THEN 1
              WHEN l.type = '${REACTION_TYPES.DISLIKE}' THEN -1
              ELSE 0
            END) AS weekly_rating
        FROM \`${this.table}\` target_user
        LEFT JOIN posts p ON p.user_id = target_user.id
        LEFT JOIN likes l ON l.post_id = p.id
          AND l.publish_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY target_user.id
    `;

    const weeklyCommentRating = `
        SELECT
          target_user.id AS user_id,
          SUM(
            CASE
              WHEN l.type = '${REACTION_TYPES.LIKE}' THEN 1
              WHEN l.type = '${REACTION_TYPES.DISLIKE}' THEN -1
              ELSE 0
            END) AS weekly_rating
        FROM \`${this.table}\` target_user
        LEFT JOIN comments c ON c.user_id = target_user.id
        LEFT JOIN likes l ON l.comment_id = c.id
          AND l.publish_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY target_user.id
    `;

    const baseSql = `
      SELECT
        u.id, u.login, u.full_name, u.profile_picture_path, u.rating AS total_rating,
        COALESCE(SUM(weekly.weekly_rating), 0) AS weekly_rating
      FROM \`${this.table}\` u
      LEFT JOIN (${weeklyPostRating} UNION ALL ${weeklyCommentRating}) weekly
        ON weekly.user_id = u.id
      GROUP BY u.id, u.login, u.full_name, u.profile_picture_path, u.rating
      HAVING weekly_rating != 0
      ORDER BY weekly_rating DESC, u.rating DESC
    `;

    return await this.paginateQuery(baseSql, [], { page, limit, offset });
  }
};
