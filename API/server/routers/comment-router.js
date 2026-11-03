const express = require('express');
const { validateIdParam, validateBody, validateStatus } = require('../middleware/validate');
const commentController = require('../controllers/comment-controller');
const { authenticateToken, authenticateTokenOptional, requireOwner, requireOwnerOrAdmin, requireRole } = require('../middleware/auth-middleware');
const { validateLikeType } = require('../middleware/like-middleware');
const { preloadComment, restrictPostStatus, restrictInactiveOrResolvedPosts, requirePostOwnerOrAdmin } = require('../middleware/comment-middleware');
const { CONTENT_STATUS, ROLES } = require('../utils/constants');

const router = express.Router();

router.use(authenticateTokenOptional);

router.param('comment_id', validateIdParam('comment_id'));
router.param('comment_id', preloadComment);

router.get('/:comment_id', restrictPostStatus(), commentController.get);
router.get('/:comment_id/like', restrictPostStatus(), commentController.getLikes);

router.post('/:comment_id/like',
  authenticateToken,
  restrictPostStatus(),
  validateBody('type'),
  validateLikeType(),
  commentController.like);
router.post('/:comment_id/reply',
  authenticateToken,
  restrictInactiveOrResolvedPosts(),
  validateBody(['content']),
  commentController.create);

router.patch('/:comment_id',
  authenticateToken,
  requireOwner('comment'),
  restrictInactiveOrResolvedPosts(),
  validateBody(['content']),
  commentController.update);
router.patch('/:comment_id/resolve',
  authenticateToken,
  restrictInactiveOrResolvedPosts(),
  requirePostOwnerOrAdmin,
  commentController.resolve);
router.patch('/:comment_id/status',
  authenticateToken,
  requireRole(ROLES.ADMIN),
  validateBody(['status']),
  validateStatus(true, CONTENT_STATUS.RESOLVED),
  commentController.patchStatus);

router.delete('/:comment_id',
  authenticateToken,
  restrictInactiveOrResolvedPosts(),
  requireOwnerOrAdmin('comment'),
  commentController.delete);
router.delete('/:comment_id/like',
  authenticateToken,
  restrictInactiveOrResolvedPosts(),
  commentController.deleteLike);

module.exports = router;
