const notificationService = require('../services/notificationService');
const asyncHandler        = require('../utils/asyncHandler');

// GET /api/notifications?limit=50&offset=0
const getNotifications = asyncHandler(async (req, res) => {
  const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit  || 50)));
  const offset = Math.max(0,              parseInt(req.query.offset || 0));

  const result = await notificationService.getForUser(req.user.id, { limit, offset });
  res.json({ status: 'success', data: result });
});

// GET /api/notifications/unread-count
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  res.json({ status: 'success', data: { unreadCount: count } });
});

// PATCH /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const updated = await notificationService.markOneRead(req.params.id, req.user.id);
  res.json({ status: 'success', data: { notification: updated } });
});

// PATCH /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user.id);
  res.json({ status: 'success', data: result });
});

// DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteOne(req.params.id, req.user.id);
  res.json({ status: 'success', message: 'Notification deleted' });
});

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead, deleteNotification };
