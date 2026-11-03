const express = require('express');
const userController = require('../controllers/user-controller');
const { validateIdParam, validateBody } = require('../middleware/validate');
const { requireRole, authenticateToken, authenticateTokenOptional, requireOwner, requireOwnerOrAdmin } = require('../middleware/auth-middleware');
const { validateEmail, validatePassword, validateLogin, validateRole } = require('../middleware/user-middleware');
const { avatarUpload } = require('../middleware/multer-middleware');
const { parsePagination } = require('../middleware/pagination-middleware');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.param('user_id', validateIdParam('user_id'));
router.use(authenticateTokenOptional);

router.delete('/',
  authenticateToken,
  userController.delete);

router.get('/',
  authenticateToken,
  requireRole(ROLES.ADMIN),
  parsePagination,
  userController.getAll);

router.post('/',
  authenticateToken,
  requireRole(ROLES.SUPERADMIN),
  validateBody(["login", "email", "password", "confirmed_password", "full_name", "role"]),
  validateLogin(true),
  validateEmail(true),
  validatePassword(true),
  validateRole(true),
  userController.create);

router.patch('/avatar/',
  authenticateToken,
  avatarUpload.single('avatar'),
  userController.updateAvatar);

router.delete('/avatar/',
  authenticateToken,
  userController.deleteAvatar);

router.get('/bans/log',
  authenticateToken,
  requireRole(ROLES.ADMIN),
  parsePagination,
  userController.getAllBanLogs);

router.get('/search',
  userController.search);

router.get('/:user_id',
  userController.get);

router.patch('/:user_id',
  authenticateToken,
  validateBody(['login', 'email', 'password', 'full_name'], false),
  validateLogin(false),
  validateEmail(false),
  userController.update);

router.patch('/:user_id/role',
  authenticateToken,
  requireRole(ROLES.SUPERADMIN),
  validateBody(['role']),
  validateRole(true),
  userController.updateRole);

router.patch('/:user_id/ban',
  authenticateToken,
  requireRole(ROLES.ADMIN),
  validateBody(['ban']),
  userController.toggleBan);

router.get('/:user_id/ban',
  authenticateToken,
  requireRole(ROLES.ADMIN),
  userController.getBanHistory);

router.delete('/:user_id',
  authenticateToken,
  requireRole(ROLES.SUPERADMIN),
  userController.delete);

router.get('/:user_id/avatar',
  userController.getAvatar);

router.delete('/:user_id/avatar',
  authenticateToken,
  requireOwnerOrAdmin('user'),
  userController.deleteAvatar);

module.exports = router;
