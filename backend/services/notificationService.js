const notificationRepo = require('../repositories/notificationRepository');
const AppError         = require('../utils/AppError');

/**
 * Fire-and-forget: create a notification without blocking the caller.
 * Errors are logged but never propagated — a notification failure must
 * never break a login, transaction, or any other business operation.
 *
 * Call pattern (no await needed):
 *   notify({ userId, type, title, message, severity, metadata });
 */
const notify = ({ userId, type, title, message, severity = 'info', metadata = null }) => {
  if (!userId || !type || !title || !message) {
    console.warn('[Notification] Skipped: missing required field', { userId, type });
    return;
  }
  notificationRepo
    .create({ userId, type, title, message, severity, metadata })
    .catch(err => console.error(`[Notification] Failed to create (${type}):`, err.message));
};

// ── API-facing methods (used by the controller, do throw on errors) ────────────

const getForUser = async (userId, { limit, offset } = {}) => {
  const [items, unreadCount] = await Promise.all([
    notificationRepo.findByUserId(userId, { limit, offset }),
    notificationRepo.countUnread(userId),
  ]);
  return { items, unreadCount };
};

const getUnreadCount = async (userId) =>
  notificationRepo.countUnread(userId);

const markOneRead = async (id, userId) => {
  const updated = await notificationRepo.markRead(id, userId);
  if (!updated) throw new AppError('Notification not found', 404);
  return updated;
};

const markAllRead = async (userId) => {
  const count = await notificationRepo.markAllRead(userId);
  return { updated: count };
};

const deleteOne = async (id, userId) => {
  const deleted = await notificationRepo.remove(id, userId);
  if (!deleted) throw new AppError('Notification not found', 404);
};

module.exports = { notify, getForUser, getUnreadCount, markOneRead, markAllRead, deleteOne };
