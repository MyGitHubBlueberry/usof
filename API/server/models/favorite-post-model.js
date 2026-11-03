const Model = require("./model");
const pool = require("../database/db");

module.exports = class DbFavoritePost extends Model {
  static table = 'favorite_posts';

  static async findByUserAndPost(userId, postId) {
    return await this.findOneBy({ user_id: userId, post_id: postId });
  }

  static async isPostFavorite(userId, postId) {
    const record = await this.findByUserAndPost(userId, postId);
    return !!record;
  }
};
