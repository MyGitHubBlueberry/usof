const Model = require("./model");
const pool = require("../database/db");
const { REACTION_TYPES } = require("../utils/constants");

module.exports = class DbLike extends Model {
  static table = 'likes';

  static async findPostLike(userId, postId) {
    return await this.findOneBy({ user_id: userId, post_id: postId });
  }

  static async findCommentLike(userId, commentId) {
    return await this.findOneBy({ user_id: userId, comment_id: commentId });
  }

  static async getCountsForPost(postId) {
    const [rows] = await pool.query(
      this.getCountsFor('post_id'),
      [postId]
    );
    return {
      likes: Number(rows[0]?.likes || 0),
      dislikes: Number(rows[0]?.dislikes || 0)
    };
  }

  static async getCountsForComment(commentId) {
    const [rows] = await pool.query(
      this.getCountsFor('comment_id'),
      [commentId]
    );
    return {
      likes: Number(rows[0]?.likes || 0),
      dislikes: Number(rows[0]?.dislikes || 0)
    };
  }

  static getCountsFor(idColumn) {
    return `SELECT
      SUM(CASE WHEN type = '${REACTION_TYPES.LIKE}' THEN 1 ELSE 0 END) AS likes,
      SUM(CASE WHEN type = '${REACTION_TYPES.DISLIKE}' THEN 1 ELSE 0 END) AS dislikes
     FROM likes WHERE ${idColumn} = ?`;
  }

  static async recalculateUserRating(userId) {
    if (!userId) return 0;

    const [rows] = await pool.query(
      `SELECT
        (
          SELECT COALESCE(
            SUM(CASE
              WHEN l.type = '${REACTION_TYPES.LIKE}' THEN 1
              WHEN l.type = '${REACTION_TYPES.DISLIKE}' THEN -1
              ELSE 0 END),
            0)
          FROM likes l
          JOIN posts p ON l.post_id = p.id
          WHERE p.user_id = ?
        ) + (
          SELECT COALESCE(
            SUM(CASE
              WHEN l.type = '${REACTION_TYPES.LIKE}' THEN 1
              WHEN l.type = '${REACTION_TYPES.DISLIKE}' THEN -1
              ELSE 0 END),
            0)
          FROM likes l
          JOIN comments c ON l.comment_id = c.id
          WHERE c.user_id = ?
        ) AS rating`,
      [userId, userId]
    );

    const rating = Number(rows[0]?.rating || 0);

    await pool.query(`UPDATE users SET rating = ? WHERE id = ?`, [rating, userId]);

    return rating;
  }
};
