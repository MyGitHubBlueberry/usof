const Model = require('./model');
const { CONTENT_STATUS } = require('../utils/constants');

module.exports = class DbCategory extends Model {
  static table = 'categories';

  static async findByTitle(title) {
    return await this.findOneBy({ title });
  }

  static async getPostCategories(postId) {
    return await this.query(`
      SELECT c.* FROM ${DbCategory.table} c
      JOIN post_categories pc ON c.title = pc.category
      WHERE pc.post_id = ?
    `, [postId]);
  }

  static async getCategoryPosts(id, { page, limit, offset } = {}) {
    const baseSql = `SELECT p.* FROM posts p
      JOIN post_categories pc ON p.id = pc.post_id
      JOIN ${DbCategory.table} c ON c.title = pc.category
      WHERE c.id = ? AND p.status = '${CONTENT_STATUS.ACTIVE}'`;
    return await this.paginateQuery(baseSql, [id], { page, limit, offset });
  }

  static async deletePostCategories(postId) {
    return await this.query(`
        DELETE FROM post_categories WHERE post_id = ?`,
      [postId]);
  }

  static async addCategoriesToPost(categories, postId, conn) {
    const placeholders = categories.map(() => '(?, ?)').join(', ');
    const values = categories.flatMap(cat => [postId, cat]);
    await this.query(
      `INSERT INTO post_categories (post_id, category) VALUES ${placeholders}`,
      values,
      conn
    );
  }
}
