const DbCategory = require("../models/category-model");
const DbPost = require("../models/post-model");
const pool = require("../database/db");
const DbLike = require("../models/like-model");
const { NotFoundError, ServerError, ConflictError, ForbiddenError, BadRequestError } = require("../utils/error");
const DbUser = require("../models/user-model");
const DbComment = require("../models/comment-model");
const { CONTENT_STATUS, ROLES, ROLE_LEVELS, REACTION_TYPES, NOTIFICATION_TYPES, ERROR_MESSAGES, POST_SORT_FIELDS } = require("../utils/constants");
const path = require("node:path");
const fs = require("node:fs/promises");
const logger = require("../utils/logger");
const DbFavoritePost = require("../models/favorite-post-model");
const DbSubscription = require("../models/subscription-model");
const DbNotification = require("../models/notification-model");
const { addPostClient, removePostClient, broadcastPostEvent } = require("../utils/post-events");

module.exports = class PostController {
  static async _getPostsList(req, additionalOptions = {}) {
    const { page, limit, offset } = req.pagination;
    const { order, search, sortBy, status, dateFrom, dateTo } = req.query;
    const category = req.query.categories || req.query.category;

    const where = {};
    const isAdmin = req.isAdmin;
    const currentUserId = req.user ? req.user.id : null;

    const isViewingOwnPosts = req.validatedUser
      && Number(req.validatedUser.id) === Number(currentUserId);

    if (req.validatedUser) {
      where.user_id = req.validatedUser.id;
    }

    if (status) {
      if (status === CONTENT_STATUS.INACTIVE && !isAdmin && !isViewingOwnPosts) {
        throw new ForbiddenError("Can't view inactive posts of other users.");
      }
      where.status = status;
    }

    return await DbPost.findAll({
      page, limit, offset,
      sortBy: sortBy || additionalOptions.defaultSortBy || POST_SORT_FIELDS.LIKES,
      order: order ? order.toUpperCase() : 'DESC',
      where,
      category,
      dateFrom,
      dateTo,
      search: search ? { title: search, content: search } : {},
      currentUserId,
      isAdmin,
      ...additionalOptions
    });
  }

  static async getAll(req, res) {
    const result = await PostController._getPostsList(req);
    return res.json(result);
  }

  static async get(req, res) {
    const attachments = await DbPost.getAttachments(req.post.id);
    return res.json({ ...req.post, attachments });
  }

  static async streamEvents(req, res) {
    const postId = req.post.id;

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    res.flushHeaders();
    res.write(': connected\n\n');

    addPostClient(postId, res);

    const keepAlive = setInterval(() => {
      res.write(': ping\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      removePostClient(postId, res);
    });
  }

  static async getAttachment(req, res) {
    const { filename } = req.params;
    const attachments = await DbPost.getAttachments(req.post.id);

    if (!attachments.includes(filename)) {
      throw new NotFoundError("Attachment not found for this post.");
    }

    const filepath = path.join(__dirname, '../../uploads/attachments', filename);
    return res.sendFile(filepath);
  }

  static async deleteAttachment(req, res) {
    const { filename } = req.params;
    const attachments = await DbPost.getAttachments(req.post.id);

    if (!attachments.includes(filename)) {
      throw new NotFoundError("Attachment not found for this post.");
    }

    await DbPost.deleteAttachment(req.post.id, filename);

    const filepath = path.join(__dirname, '../../uploads/attachments', filename);
    await fs.rm(filepath, { force: true }).catch(() => { });

    return res.status(204).end();
  }

  static async getComments(req, res) {
    const { page, limit, offset } = req.pagination;
    const result = await DbComment.getAll(req.post.id, { page, limit, offset });

    const data = result.data.map((comment) => {
      const isOwner = req.user && Number(req.user.id) === Number(comment.user_id);
      if (comment.status === CONTENT_STATUS.INACTIVE && !req.isAdmin && !isOwner) {
        return { ...comment, content: null, user_id: null };
      }
      return comment;
    });

    return res.json({ ...result, data });
  }

  static async postComment(req, res) {
    const comment = new DbComment({
      user_id: req.user.id,
      post_id: req.post.id,
      content: req.body.content
    });

    await comment.save();

    broadcastPostEvent(req.post.id, 'comments_updated', { commentId: comment.id });

    DbNotification.notifySubscribers(req.post.id, req.user.id, {
      type: NOTIFICATION_TYPES.POST_COMMENTED,
      message: `New comment on post "${req.post.title}".`
    });

    return res.status(201).json(comment);
  }

  static async getCategories(req, res) {
    const categories = await DbCategory.getPostCategories(req.post.id);
    return res.json(categories);
  }

  static async getLikes(req, res) {
    const counts = await DbLike.getCountsForPost(req.post.id);
    const myReaction = req.user
      ? (await DbLike.findPostLike(req.user.id, req.post.id))?.type ?? null
      : null;
    return res.json({ ...counts, myReaction });
  }

  static async like(req, res) {
    const post = req.post;
    let { type } = req.body;

    if (type === undefined
      || (type !== REACTION_TYPES.LIKE && type !== REACTION_TYPES.DISLIKE)) {
      type = REACTION_TYPES.LIKE;
    }

    const existingLike = await DbLike.findPostLike(req.user.id, post.id);
    if (existingLike) {
      await existingLike.delete();
    }

    const like = new DbLike({
      user_id: req.user.id,
      post_id: post.id,
      type
    });
    await like.save();

    await DbLike.recalculateUserRating(post.user_id);

    const counts = await DbLike.getCountsForPost(post.id);
    broadcastPostEvent(post.id, 'likes_updated', counts);

    return res.status(201).json({
      message: "Reaction saved successfully.",
      like: like
    });
  }

  static async deleteLike(req, res) {
    const post = req.post;

    const existingLike = await DbLike.findPostLike(req.user.id, post.id);
    if (!existingLike) {
      throw new NotFoundError(ERROR_MESSAGES.REACTION_NOT_FOUND);
    }

    await existingLike.delete();
    await DbLike.recalculateUserRating(post.user_id);

    const counts = await DbLike.getCountsForPost(post.id);
    broadcastPostEvent(post.id, 'likes_updated', counts);

    return res.status(204).end();
  }

  static async create(req, res) {
    const { title, content, categories } = req.body;

    if (await DbPost.findByTitle(title)) {
      throw new ConflictError(ERROR_MESSAGES.POST_EXISTS);
    }


    if (categories) {
      for (const title of categories) {
        const category = await DbCategory.findByTitle(title);
        if (!category) {
          throw new BadRequestError(`Category '${title}' does not exist.`);
        }
      }
    }

    const post = new DbPost({
      title,
      content,
      user_id: req.user.id
    });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await post.save(conn);

      if (categories && categories.length > 0) {
        await DbCategory.addCategoriesToPost(categories, post.id, conn);
      }

      if (req.files && req.files.length > 0) {
        const filenames = req.files.map(f => f.filename);
        await DbPost.addAttachments(post.id, filenames, conn);
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      if (req.files && req.files.length > 0) {
        await Promise.all(req.files.map(f => fs.rm(f.path, { force: true }).catch(() => { })));
      }
      throw err;
    } finally {
      conn.release();
    }

    const attachments = await DbPost.getAttachments(post.id);
    return res.status(201).json({ ...post, attachments });
  }

  static async update(req, res) {
    const post = req.post;
    const { title, content, categories } = req.body;

    if (title !== undefined && title !== post.title) {
      if (await DbPost.findByTitle(title)) {
        throw new ConflictError(ERROR_MESSAGES.POST_EXISTS);
      }
      post.title = title;
    }

    if (content !== undefined) {
      post.content = content;
    }

    await post.save();

    if (categories) {
      await DbCategory.deletePostCategories(post.id);
      if (categories.length > 0) {
        await DbCategory.addCategoriesToPost(categories, post.id);
      }
    }

    if (req.files && req.files.length > 0) {
      const filenames = req.files.map(f => f.filename);
      await DbPost.addAttachments(post.id, filenames);
    }

    const attachments = await DbPost.getAttachments(post.id);

    broadcastPostEvent(post.id, 'post_updated', { ...post, attachments });

    DbNotification.notifySubscribers(post.id, req.user.id, {
      type: NOTIFICATION_TYPES.POST_UPDATED,
      message: `Post "${post.title}" has been updated.`
    });

    return res.json({ ...post, attachments });
  }

  static async patchStatus(req, res) {
    req.post.status = req.body.status;
    const updated = await req.post.save();
    logger.info({
      action: 'update_post_status',
      targetPostId: req.post.id,
      issuerId: req.user.id,
      newStatus: req.body.status
    }, `Admin changed status of post '${req.post.id}' to '${req.body.status}'`);

    broadcastPostEvent(req.post.id, 'post_updated', updated);

    res.json(updated);

    DbNotification.notifySubscribers(req.post.id, req.user.id, {
      type: NOTIFICATION_TYPES.POST_STATUS_CHANGED,
      message: `Post "${req.post.title}" status changed to "${req.body.status}".`
    });
  }

  static async delete(req, res) {
    const attachments = await DbPost.getAttachments(req.post.id);
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        const filepath = path.join(__dirname, '../../uploads/attachments', attachment);
        await fs.rm(filepath, { force: true }).catch(() => { });
      }
    }
    await req.post.delete();
    return res.status(204).end();
  }

  static async favoritePost(req, res) {
    const existing = await DbFavoritePost.findByUserAndPost(req.user.id, req.post.id);
    if (existing) {
      throw new ConflictError("Post is already favorited.");
    }

    const favorited = new DbFavoritePost({
      user_id: req.user.id,
      post_id: req.post.id
    });
    await favorited.save();

    return res.status(201).json({ message: "Post favorited successfully." });
  }

  static async unfavoritePost(req, res) {
    const existing = await DbFavoritePost.findByUserAndPost(req.user.id, req.post.id);
    if (!existing) {
      throw new NotFoundError("Post is not favorited.");
    }

    await existing.delete();
    return res.status(204).end();
  }

  static async getFavoritePosts(req, res) {
    const result = await PostController._getPostsList(req, {
      favoriteUserId: req.user.id,
      defaultSortBy: 'favorited_at'
    });
    return res.json(result);
  }

  static async subscribe(req, res) {
    const existing = await DbSubscription.findByUserAndPost(req.user.id, req.post.id);
    if (existing) {
      throw new ConflictError("Already subscribed to this post.");
    }

    const sub = new DbSubscription({
      user_id: req.user.id,
      post_id: req.post.id
    });
    await sub.save();

    return res.status(201).json({ message: "Subscribed to post successfully." });
  }

  static async unsubscribe(req, res) {
    const existing = await DbSubscription.findByUserAndPost(req.user.id, req.post.id);
    if (!existing) {
      throw new NotFoundError("Not subscribed to this post.");
    }

    await existing.delete();
    return res.status(204).end();
  }

  static async getSubscriptions(req, res) {
    const result = await PostController._getPostsList(req, {
      subscribedUserId: req.user.id,
      defaultSortBy: 'subscribed_at'
    });
    return res.json(result);
  }
};
