const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification-controller');
const { authenticateToken } = require('../middleware/auth-middleware');
const { parsePagination } = require('../middleware/pagination-middleware');
const { validateIdParam } = require('../middleware/validate');

router.use(authenticateToken);

router.get('/', parsePagination, notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:notification_id/read', validateIdParam('notification_id'),
  notificationController.markAsRead);
router.delete('/', notificationController.deleteAllNotifications);
router.delete('/:notification_id', validateIdParam('notification_id'),
  notificationController.deleteNotification);

module.exports = router;
