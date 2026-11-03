const Model = require("./model");
const pool = require("../database/db");
const { CONTENT_STATUS } = require("../utils/constants");
const DbSubscription = require("./subscription-model");
const logger = require("../utils/logger");

module.exports = class DbNotification extends Model {
  static table = 'notifications';

  static async createForSubscribers(subscriberIds, { postId, type, message }) {
    if (!subscriberIds || subscriberIds.length === 0) return;

    const placeholders = subscriberIds.map(() => '(?, ?, ?, ?)').join(', ');
    const values = subscriberIds.flatMap(userId => [userId, postId, type, message]);

    await pool.query(
      `INSERT INTO \`${this.table}\` (user_id, post_id, type, message) VALUES ${placeholders}`,
      values
    );
  }

  static async getUserNotifications(userId, isAdmin, { page, limit, offset, search, status } = {}) {
    const params = [userId, isAdmin ? 1 : 0, userId];
    const clauses = [];

    if (search && String(search).trim() !== '') {
      clauses.push(`(n.message LIKE ? OR p.title LIKE ?)`);
      const pattern = `%${String(search).trim()}%`;
      params.push(pattern, pattern);
    }

    if (status === 'read') {
      clauses.push(`n.is_read = TRUE`);
    } else if (status === 'unread') {
      clauses.push(`n.is_read = FALSE`);
    }

    const extraWhere = clauses.length > 0 ? ` AND ${clauses.join(' AND ')}` : '';

    const baseSql = `
      SELECT n.*, p.title AS post_title
      FROM \`${this.table}\` n
      JOIN posts p ON n.post_id = p.id
      WHERE n.user_id = ?
        AND (
           ? = 1
           OR p.status IN ('${CONTENT_STATUS.ACTIVE}', '${CONTENT_STATUS.RESOLVED}')
           OR p.user_id = ?
        )${extraWhere}
      ORDER BY n.created_at DESC`;

    return await this.paginateQuery(baseSql, params, { page, limit, offset });
  }

  static async markAsRead(notificationId, userId) {
    await pool.query(
      `UPDATE \`${this.table}\` SET is_read = TRUE WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
  }

  static async markAllAsRead(userId) {
    await pool.query(
      `UPDATE \`${this.table}\` SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
  }

  static async deleteAllForUser(userId) {
    await pool.query(
      `DELETE FROM \`${this.table}\` WHERE user_id = ?`,
      [userId]
    );
  }

  static async getUnreadCount(userId, isAdmin) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count 
       FROM \`${this.table}\` n
       JOIN posts p ON n.post_id = p.id
       WHERE n.user_id = ? AND n.is_read = FALSE
         AND (
           ? = 1
           OR p.status IN ('${CONTENT_STATUS.ACTIVE}', '${CONTENT_STATUS.RESOLVED}')
           OR p.user_id = ?
         )`,
      [userId, isAdmin ? 1 : 0, userId]
    );
    return rows[0].count;
  }

  static notifySubscribers(postId, excludeUserId, { type, message }) {
    DbSubscription.getSubscribers(postId).then(subscribers => {
      const filtered = subscribers.filter(id => id !== excludeUserId);
      if (filtered.length > 0) {
        this.createForSubscribers(filtered, { postId, type, message })
          .catch(err => logger.error(err, 'Failed to send notifications'));
      }
    }).catch(err => logger.error(err, 'Failed to get subscribers'));
  }
};
