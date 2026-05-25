/**
 * Notification Controller — RoadResQ v9.0.0 (Week 7)
 *
 * POST /api/notifications/token     — Register FCM token
 * GET  /api/notifications           — Get user notifications
 * PUT  /api/notifications/:id/read  — Mark as read
 * PUT  /api/notifications/read-all  — Mark all read
 * GET  /api/notifications/unread-count — Get unread count
 * POST /api/notifications/send      — Admin send notification
 */

const {
  registerFCMToken, getUserNotifications, markAsRead,
  markAllRead, getUnreadCount, sendPushNotification,
} = require('../utils/notificationEngine');

const ok   = (res, data, code = 200) => res.status(code).json({ status: 'success', data });
const fail = (res, msg, code = 400) => res.status(code).json({ status: 'error', message: msg });

const registerToken = async (req, res) => {
  try {
    const { token, platform } = req.body;
    if (!token) return fail(res, 'FCM token is required.');
    const result = await registerFCMToken(req.user.uid, token, platform || 'android');
    return ok(res, result, 201);
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

const getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const notifications = await getUserNotifications(req.user.uid, limit);
    return ok(res, { notifications, count: notifications.length });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

const markReadHandler = async (req, res) => {
  try {
    await markAsRead(req.params.id);
    return ok(res, { marked: true });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

const markAllReadHandler = async (req, res) => {
  try {
    const result = await markAllRead(req.user.uid);
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

const getUnreadCountHandler = async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.uid);
    return ok(res, { unreadCount: count });
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

const sendNotificationHandler = async (req, res) => {
  try {
    const { userId, title, body, type, data } = req.body;
    if (!userId || !title || !body) return fail(res, 'userId, title, and body are required.');
    const result = await sendPushNotification(userId, { title, body, type, data });
    return ok(res, result);
  } catch (err) {
    return fail(res, err.message, 500);
  }
};

module.exports = {
  registerToken, getNotifications, markReadHandler,
  markAllReadHandler, getUnreadCountHandler, sendNotificationHandler,
};
