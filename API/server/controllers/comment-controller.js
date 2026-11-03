const DbComment = require("../models/comment-model");
const DbLike = require("../models/like-model");
const DbPost = require("../models/post-model");
const { NotFoundError, ForbiddenError } = require("../utils/error");
const { CONTENT_STATUS, ERROR_MESSAGES } = require("../utils/constants");
const logger = require("../utils/logger");
const { broadcastPostEvent } = require("../utils/post-events");

module.exports = class CommentController {
  static async get(req, res) {
    const comment = req.comment;

    const isAdminOrAuthor = req.user && (req.isAdmin || Number(req.user.id) === Number(comment.user_id));

    if (comment.status === CONTENT_STATUS.INACTIVE && !isAdminOrAuthor) {
      throw new ForbiddenError('Cannot view inactive comment.');
    }

    return res.json(comment);
  }

  static async getLikes(req, res) {
    const { comment_id: id } = req.params;
    const counts = await DbLike.getCountsForComment(id);
    const myReaction = req.user
      ? (await DbLike.findCommentLike(req.user.id, id))?.type ?? null
      : null;
    return res.json({ ...counts, myReaction });
  }

  static async like(req, res) {
    let { type } = req.body;
    let comment = req.comment;

    const isAdminOrAuthor = req.isAdmin || Number(req.user.id) === Number(comment.user_id);
    if (comment.status === CONTENT_STATUS.INACTIVE && !isAdminOrAuthor) {
      throw new ForbiddenError('Cannot react to an inactive comment.');
    }

    const existingLike = await DbLike.findCommentLike(req.user.id, comment.id);
    if (existingLike) {
      await existingLike.delete();
    }

    const like = new DbLike({
      user_id: req.user.id,
      comment_id: comment.id,
      type
    });

    await like.save();

    await DbLike.recalculateUserRating(comment.user_id);
    const counts = await DbLike.getCountsForComment(comment.id);
    broadcastPostEvent(comment.post_id, 'comment_like_updated', { commentId: comment.id, ...counts });

    return res.status(201).json({ message: "Reaction saved successfully.", like });
  }

  static async create(req, res) {
    const parentComment = req.comment;

    const isAdminOrAuthor = req.isAdmin || Number(req.user.id) === Number(parentComment.user_id);
    if (parentComment.status === CONTENT_STATUS.INACTIVE && !isAdminOrAuthor) {
      throw new ForbiddenError('Cannot reply to an inactive comment.');
    }

    const created = new DbComment({
      user_id: req.user.id,
      post_id: parentComment.post_id,
      parent_comment_id: parentComment.id,
      content: req.body.content
    });

    await created.save();
    broadcastPostEvent(created.post_id, 'comments_updated', { commentId: created.id });
    return res.status(201).json(created);
  }

  static async update(req, res) {
    const comment = req.comment;

    comment.content = req.body.content;

    await comment.save();
    broadcastPostEvent(comment.post_id, 'comments_updated', { commentId: comment.id });
    return res.json(comment);
  }

  static async patchStatus(req, res) {
    const comment = req.comment;
    const post = await DbPost.find(comment.post_id);
    const { status } = req.body;

    if (comment.status === CONTENT_STATUS.RESOLVED
      && post.status === CONTENT_STATUS.RESOLVED) {
      post.status = CONTENT_STATUS.ACTIVE;
      await post.save();
    }
    comment.status = status;
    await comment.save();

    logger.info({
      action: 'update_comment_status',
      targetCommentId: comment.id,
      issuerId: req.user.id,
      newStatus: status
    }, `Admin changed status of comment '${comment.id}' to '${status}'`);

    broadcastPostEvent(comment.post_id, 'comments_updated', { commentId: comment.id });

    return res.json(comment);
  }


  static async resolve(req, res) {
    const comment = req.comment;
    const post = await DbPost.find(comment.post_id);

    post.status = CONTENT_STATUS.RESOLVED;
    comment.status = CONTENT_STATUS.RESOLVED;

    await post.save();
    await comment.save();

    broadcastPostEvent(post.id, 'post_updated', post);
    broadcastPostEvent(comment.post_id, 'comments_updated', { commentId: comment.id });

    res.json({
      message: "Comment and post are marked as resolved.",
      post,
      comment
    });
  }

  static async deleteLike(req, res) {
    const comment = req.comment;

    const like = await DbLike.findCommentLike(req.user.id, comment.id);
    if (!like) {
      throw new NotFoundError(ERROR_MESSAGES.REACTION_NOT_FOUND);
    }

    await like.delete();
    await DbLike.recalculateUserRating(comment.user_id);
    const counts = await DbLike.getCountsForComment(comment.id);
    broadcastPostEvent(comment.post_id, 'comment_like_updated', { commentId: comment.id, ...counts });

    return res.status(204).end();
  }

  static async delete(req, res) {
    const comment = req.comment;

    const [{ count: replyCount }] = await DbComment.query(
      'SELECT COUNT(*) AS count FROM comments WHERE parent_comment_id = ?',
      [comment.id]
    );

    if (replyCount > 0) {
      comment.user_id = null;
      comment.content = null;
      comment.status = CONTENT_STATUS.INACTIVE;
      await comment.save();
      broadcastPostEvent(comment.post_id, 'comments_updated', { commentId: comment.id });
      return res.status(200).json(comment);
    }

    await comment.delete();
    broadcastPostEvent(comment.post_id, 'comments_updated', { commentId: comment.id });
    return res.status(204).end();
  }
};
