const { pool } = require('../config/database');

const DEFAULT_LIMIT = 50;

const create = async ({ userId, type, title, message, severity = 'info', metadata = null }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO notifications (user_id, type, title, message, severity, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, type, title, message, severity, metadata ? JSON.stringify(metadata) : null]
  );
  return rows[0];
};

const findByUserId = async (userId, { limit = DEFAULT_LIMIT, offset = 0 } = {}, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, Math.min(limit, 100), offset]
  );
  return rows;
};

const countUnread = async (userId, client = pool) => {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM notifications
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return rows[0].count;
};

const markRead = async (id, userId, client = pool) => {
  const { rows } = await client.query(
    `UPDATE notifications
     SET is_read = true, read_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId]
  );
  return rows[0] || null;
};

const markAllRead = async (userId, client = pool) => {
  const { rowCount } = await client.query(
    `UPDATE notifications
     SET is_read = true, read_at = NOW()
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return rowCount;
};

const remove = async (id, userId, client = pool) => {
  const { rowCount } = await client.query(
    `DELETE FROM notifications
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return rowCount > 0;
};

module.exports = { create, findByUserId, countUnread, markRead, markAllRead, remove };
