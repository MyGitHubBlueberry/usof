const Model = require("./model");
const { CONTENT_STATUS } = require("../utils/constants");

module.exports = class DbComment extends Model {
  static table = 'comments';

  static async getAll(postId, { page, limit, offset } = {}) {
    return await this.paginateQuery(`
      SELECT c.* FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE p.id = ?
    `, [postId], { page, limit, offset });
  }

  static async getResolvedComment(postId) {
    const comments = await this.query(`
      SELECT c.* FROM comments c
      JOIN posts p ON c.post_id = p.id
      WHERE p.id = ? AND c.status = '${CONTENT_STATUS.RESOLVED}'
      LIMIT 1;
    `, [postId]);
    return comments[0] || null;
  }
};
