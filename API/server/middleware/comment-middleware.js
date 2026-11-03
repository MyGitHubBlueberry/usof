const DbComment = require('../models/comment-model');
const DbPost = require('../models/post-model');
const assert = require('node:assert/strict');
const { CONTENT_STATUS, ROLES, ROLE_LEVELS, ASSERT_MESSAGES } = require('../utils/constants');
const { NotFoundError, ForbiddenError } = require('../utils/error');

async function preloadComment(req, res, next) {
  const { comment_id: id } = req.params;
  const comment = await DbComment.find(id);

  if (!comment) {
    throw new NotFoundError(`Comment with id ${id} doesn't exist.`);
  }

  req.comment = comment;
  next();
}

function restrictPostStatus(forbiddenStatuses = [CONTENT_STATUS.INACTIVE]) {
  return async (req, res, next) => {
    assert.ok(req.comment, ASSERT_MESSAGES.REQ_COMMENT_MISSING);
    const post = await DbPost.find(req.comment.post_id);
    if (!post) {
      throw new NotFoundError('Associated post not found.');
    }
    req.post = post;

    const isAdmin = req.isAdmin;
    if (forbiddenStatuses.includes(post.status) && !isAdmin) {
      throw new ForbiddenError(`Cannot perform this action when post status is '${post.status}'.`);
    }

    next();
  };
}

function restrictInactiveOrResolvedPosts() {
  return restrictPostStatus([CONTENT_STATUS.INACTIVE, CONTENT_STATUS.RESOLVED]);
}

function requirePostOwnerOrAdmin(req, res, next) {
  assert.ok(req.post, ASSERT_MESSAGES.REQ_POST_MISSING);

  if (req.isAdmin) return next();

  if (!req.user || Number(req.post.user_id) !== Number(req.user.id)) {
    throw new ForbiddenError('Only the post owner or an admin can perform this action.');
  }

  next();
}

module.exports = {
  preloadComment,
  restrictPostStatus,
  restrictInactiveOrResolvedPosts,
  requirePostOwnerOrAdmin
};
