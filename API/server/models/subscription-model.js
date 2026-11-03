const Model = require("./model");
const pool = require("../database/db");

module.exports = class DbSubscription extends Model {
  static table = 'post_subscriptions';

  static async findByUserAndPost(userId, postId) {
    return await this.findOneBy({ user_id: userId, post_id: postId });
  }

  static async getSubscribers(postId) {
    const rows = await this.query(
      `SELECT user_id FROM \`${this.table}\` WHERE post_id = ?`,
      [postId]
    );
    return rows.map(r => r.user_id);
  }
};
