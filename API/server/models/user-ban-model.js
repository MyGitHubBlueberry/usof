const Model = require('./model');
const pool = require('../database/db');

module.exports = class DbUserBan extends Model {
  static table = 'user_bans';

  static async findActiveBan(userId) {
    const [rows] = await pool.query(
      `SELECT * FROM \`${this.table}\`
       WHERE user_id = ?
         AND unbanned_at IS NULL
         AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY banned_at DESC
       LIMIT 1`,
      [userId]
    );
    return rows.length > 0 ? new this(rows[0]) : null;
  }

  static async banUser({ userId, bannedBy, reason, expiresAt }) {
    await pool.query(
      `UPDATE \`${this.table}\`
       SET unbanned_at = NOW()
       WHERE user_id = ? AND unbanned_at IS NULL`,
      [userId]
    );

    const ban = new this({
      user_id: userId,
      banned_by: bannedBy || null,
      reason,
      expires_at: expiresAt ? new Date(expiresAt) : null
    });

    await ban.save();
    return ban;
  }

  static async unbanUser(userId) {
    const [result] = await pool.query(
      `UPDATE \`${this.table}\`
       SET unbanned_at = NOW()
       WHERE user_id = ? AND unbanned_at IS NULL`,
      [userId]
    );
    return result.affectedRows > 0;
  }

  static async getBanHistory(userId) {
    const [rows] = await pool.query(
      `SELECT ub.*, u.login AS banned_by_login
       FROM \`${this.table}\` ub
       LEFT JOIN users u ON ub.banned_by = u.id
       WHERE ub.user_id = ?
       ORDER BY ub.banned_at DESC`,
      [userId]
    );
    return rows;
  }

  static SORTABLE_FIELDS = Object.freeze({
    banned_at: 'ub.banned_at',
    expires_at: 'ub.expires_at',
    target_login: 'target.login',
    id: 'ub.id',
  });

  static async getAllBanHistory({
    page = 1,
    limit = 10,
    search,
    status,
    targetUser,
    bannedBy,
    sortBy = 'banned_at',
    order = 'desc',
    dateFrom,
    dateTo,
  } = {}) {
    const offset = (page - 1) * limit;
    const params = [];
    const clauses = [];

    if (search) {
      const pattern = `%${search}%`;
      clauses.push('(target.login LIKE ? OR target.email LIKE ? OR ub.reason LIKE ?)');
      params.push(pattern, pattern, pattern);
    }

    if (targetUser) {
      clauses.push('target.login LIKE ?');
      params.push(`%${targetUser}%`);
    }

    if (bannedBy) {
      clauses.push('issuer.login LIKE ?');
      params.push(`%${bannedBy}%`);
    }

    if (status === 'active') {
      clauses.push('ub.unbanned_at IS NULL AND (ub.expires_at IS NULL OR ub.expires_at > NOW())');
    } else if (status === 'expired') {
      clauses.push('ub.unbanned_at IS NULL AND ub.expires_at <= NOW()');
    } else if (status === 'revoked' || status === 'unbanned') {
      clauses.push('ub.unbanned_at IS NOT NULL');
    }

    if (dateFrom) {
      clauses.push('ub.banned_at >= ?');
      params.push(`${dateFrom} 00:00:00`);
    }
    if (dateTo) {
      clauses.push('ub.banned_at <= ?');
      params.push(`${dateTo} 23:59:59`);
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const sortColumn = this.SORTABLE_FIELDS[sortBy] || this.SORTABLE_FIELDS.banned_at;
    const sortOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const baseSql = `
      SELECT
        ub.id, ub.user_id, ub.banned_by, ub.reason,
        ub.banned_at, ub.expires_at, ub.unbanned_at,
        target.login AS target_login,
        target.profile_picture_path AS target_avatar,
        issuer.login AS issuer_login
      FROM \`${this.table}\` ub
      JOIN users target ON ub.user_id = target.id
      LEFT JOIN users issuer ON ub.banned_by = issuer.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
    `;

    const countSql = `SELECT COUNT(*) AS count FROM (${baseSql}) AS subquery`;
    const [countRows] = await pool.query(countSql, params);
    const totalItems = countRows[0].count;

    const [rows] = await pool.query(
      `${baseSql} LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    return {
      data: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
      }
    };
  }
};
