import * as notificationService from '../services/notificationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const listNotifications = async (req, res) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = await notificationService.getNotificationsForUser(
      req.user.id,
      req.organizationId,
      { unreadOnly }
    );
    return sendSuccess(res, 'Notifications retrieved', notifications);
  } catch (err) {
    return sendError(res, 'Error fetching notifications', [err.message], 500);
  }
};

export const markRead = async (req, res) => {
  try {
    const notification = await notificationService.markNotificationAsRead(req.params.id, req.user.id);
    return sendSuccess(res, 'Notification marked as read', notification);
  } catch (err) {
    return sendError(res, 'Error updating notification', [err.message], 400);
  }
};

export const markAllRead = async (req, res) => {
  try {
    const result = await notificationService.markAllNotificationsAsRead(req.user.id, req.organizationId);
    return sendSuccess(res, 'All notifications marked as read', result);
  } catch (err) {
    return sendError(res, 'Error updating notifications', [err.message], 400);
  }
};

