const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category-controller');
const { authenticateToken, requireRole } = require('../middleware/auth-middleware');
const { parsePagination } = require('../middleware/pagination-middleware');
const { preloadCategory } = require('../middleware/category-middleware');
const { validateIdParam, validateBody, validateTitle } = require('../middleware/validate');
const { ROLES } = require('../utils/constants');

router.param('category_id', validateIdParam('category_id'));
router.param('category_id', preloadCategory);

router.get('/', parsePagination, categoryController.getAll);
router.get('/:category_id', categoryController.get);
router.get('/:category_id/posts', parsePagination, categoryController.getPosts);

router.post('/',
  authenticateToken,
  requireRole(ROLES.ADMIN),
  validateBody("title"),
  validateTitle(true),
  categoryController.create);

router.patch('/:category_id',
  authenticateToken,
  requireRole(ROLES.ADMIN),
  validateBody(['title', 'description'], false),
  validateTitle(false),
  categoryController.update);

router.delete('/:category_id',
  authenticateToken,
  requireRole(ROLES.ADMIN),
  categoryController.delete);

module.exports = router;
