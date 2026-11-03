const DbNotification = require('../models/notification-model');
const { NotFoundError } = require('../utils/error');
const { ROLES, ROLE_LEVELS } = require('../utils/constants');

module.exports = class NotificationController {
  static async getNotifications(req, res) {
    const { page, limit, offset } = req.pagination;
    const { search, status } = req.query;
    const isAdmin = req.isAdmin;
    const result = await DbNotification.getUserNotifications(
      req.user.id, isAdmin, { page, limit, offset, search, status });
    return res.json(result);
  }

  static async getUnreadCount(req, res) {
    const isAdmin = req.isAdmin;
    const count = await DbNotification.getUnreadCount(req.user.id, isAdmin);
    return res.json({ unreadCount: count });
  }

  static async markAllAsRead(req, res) {
    await DbNotification.markAllAsRead(req.user.id);
    return res.json({ message: "All notifications marked as read." });
  }

  static async markAsRead(req, res) {
    const notification = await DbNotification.find(req.params.notification_id);
    if (!notification || notification.user_id !== req.user.id) {
      throw new NotFoundError("Notification not found.");
    }

    await DbNotification.markAsRead(notification.id, req.user.id);
    return res.json({ message: "Notification marked as read." });
  }

  static async deleteNotification(req, res) {
    const notification = await DbNotification.find(req.params.notification_id);
    if (!notification || notification.user_id !== req.user.id) {
      throw new NotFoundError("Notification not found.");
    }

    await notification.delete();
    return res.status(204).end();
  }

  static async deleteAllNotifications(req, res) {
    await DbNotification.deleteAllForUser(req.user.id);
    return res.status(204).end();
  }
};
