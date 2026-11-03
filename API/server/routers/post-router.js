const express = require('express');
const router = express.Router();
const postController = require('../controllers/post-controller');
const { parsePagination } = require('../middleware/pagination-middleware');
const { authenticateToken, authenticateTokenOptional, requireOwner, requireOwnerOrAdmin, requireRole } = require('../middleware/auth-middleware');
const { validateBody, validateIdParam, validateStatus, validateTitle } = require('../middleware/validate');
const { preloadPost, validatePostQueryParams, restrictInactivePost, restrictResolvedPost, validateCategories } = require('../middleware/post-middleware');
const { validateLikeType } = require('../middleware/like-middleware');
const { attachmentUpload } = require('../middleware/multer-middleware');
const DbUser = require('../models/user-model');
const { CONTENT_STATUS, ROLES } = require('../utils/constants');

router.use(authenticateTokenOptional);

router.param('post_id', validateIdParam('post_id'));
router.param('post_id', preloadPost);

router.get('/favorites', authenticateToken, parsePagination, validatePostQueryParams, postController.getFavoritePosts);
router.get('/subscriptions', authenticateToken, parsePagination, validatePostQueryParams, postController.getSubscriptions);
router.get('/', parsePagination, validatePostQueryParams, postController.getAll);
router.get('/:post_id', restrictInactivePost(), postController.get);
router.get('/:post_id/attachments/:filename', restrictInactivePost(), postController.getAttachment);
router.get('/:post_id/comments', parsePagination, restrictInactivePost(), postController.getComments);
router.get('/:post_id/categories', restrictInactivePost(), postController.getCategories);
router.get('/:post_id/like', restrictInactivePost(), postController.getLikes);
router.get('/:post_id/events', restrictInactivePost(), postController.streamEvents);

router.post('/',
  authenticateToken,
  attachmentUpload.array('attachments', 10),
  validateBody(['title', 'content']),
  validateTitle(true),
  validateCategories(false),
  postController.create);
router.post('/:post_id/comments',
  authenticateToken,
  restrictInactivePost(true),
  validateBody(['content']),
  postController.postComment);
router.post('/:post_id/like',
  authenticateToken,
  restrictInactivePost(true),
  validateBody(['type']),
  validateLikeType(),
  postController.like);

router.patch('/:post_id',
  authenticateToken,
  requireOwner('post'),
  restrictInactivePost(),
  restrictResolvedPost,
  attachmentUpload.array('attachments', 10),
  validateBody(['title', 'content', 'categories'], false),
  validateTitle(false),
  validateCategories(false),
  postController.update);

router.patch('/:post_id/status',
  authenticateToken,
  requireRole(ROLES.ADMIN),
  validateBody(['status']),
  validateStatus(true, CONTENT_STATUS.RESOLVED),
  postController.patchStatus);

router.delete('/:post_id',
  authenticateToken,
  requireOwnerOrAdmin('post'),
  postController.delete);
router.delete('/:post_id/attachments/:filename',
  authenticateToken,
  requireOwner('post'),
  restrictInactivePost(),
  restrictResolvedPost,
  postController.deleteAttachment);
router.delete('/:post_id/like',
  authenticateToken,
  restrictInactivePost(),
  postController.deleteLike);

router.post('/:post_id/favorite',
  authenticateToken,
  restrictInactivePost(),
  postController.favoritePost);
router.delete('/:post_id/favorite',
  authenticateToken,
  postController.unfavoritePost);

router.post('/:post_id/subscribe',
  authenticateToken,
  restrictInactivePost(),
  postController.subscribe);
router.delete('/:post_id/subscribe',
  authenticateToken,
  postController.unsubscribe);

module.exports = router;
