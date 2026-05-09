const { pool } = require('../config/database');

const createTicket = async ({ userId, subject }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO support_tickets (user_id, subject)
     VALUES ($1, $2) RETURNING *`,
    [userId, subject]
  );
  return rows[0];
};

const addMessage = async ({ ticketId, userId, senderRole, message }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO support_messages (ticket_id, user_id, sender_role, message)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [ticketId, userId, senderRole, message]
  );
  await client.query(
    'UPDATE support_tickets SET updated_at = NOW() WHERE id = $1',
    [ticketId]
  );
  return rows[0];
};

const findByUserId = async (userId, client = pool) => {
  const { rows } = await client.query(
    `SELECT t.*,
            u.full_name AS user_name,
            (SELECT COUNT(*) FROM support_messages m WHERE m.ticket_id = t.id)::int AS message_count
     FROM support_tickets t
     JOIN users u ON u.id = t.user_id
     WHERE t.user_id = $1
     ORDER BY t.updated_at DESC`,
    [userId]
  );
  return rows;
};

const findById = async (id, client = pool) => {
  const { rows } = await client.query(
    `SELECT t.*, u.full_name AS user_name
     FROM support_tickets t
     JOIN users u ON u.id = t.user_id
     WHERE t.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const findMessages = async (ticketId, client = pool) => {
  const { rows } = await client.query(
    `SELECT m.*, u.full_name AS sender_name
     FROM support_messages m
     JOIN users u ON u.id = m.user_id
     WHERE m.ticket_id = $1
     ORDER BY m.created_at ASC`,
    [ticketId]
  );
  return rows;
};

const findAll = async ({ page = 1, limit = 50 } = {}, client = pool) => {
  const offset = (page - 1) * limit;
  const { rows } = await client.query(
    `SELECT t.*,
            u.full_name AS user_name,
            (SELECT COUNT(*) FROM support_messages m WHERE m.ticket_id = t.id)::int AS message_count
     FROM support_tickets t
     JOIN users u ON u.id = t.user_id
     ORDER BY t.updated_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
};

const updateStatus = async (id, status, client = pool) => {
  const { rows } = await client.query(
    'UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
  return rows[0];
};

module.exports = {
  createTicket, addMessage,
  findByUserId, findById, findMessages,
  findAll, updateStatus,
};
