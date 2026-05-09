const { pool } = require('../config/database');

const invalidatePrevious = async (userId, purpose, client = pool) => {
  await client.query(
    'UPDATE login_otps SET is_used = true WHERE user_id = $1 AND purpose = $2 AND is_used = false',
    [userId, purpose]
  );
};

const create = async ({ userId, email, codeHash, expiresAt, purpose = 'login' }, client = pool) => {
  await invalidatePrevious(userId, purpose, client);
  const { rows } = await client.query(
    `INSERT INTO login_otps (user_id, email, code_hash, expires_at, purpose)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, email, codeHash, expiresAt, purpose]
  );
  return rows[0];
};

const findActive = async (userId, purpose = 'login', client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM login_otps
     WHERE user_id = $1 AND purpose = $2 AND is_used = false AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, purpose]
  );
  return rows[0] || null;
};

const incrementAttempts = async (id, client = pool) => {
  const { rows } = await client.query(
    'UPDATE login_otps SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts',
    [id]
  );
  return rows[0]?.attempts ?? 0;
};

const markUsed = async (id, client = pool) => {
  await client.query('UPDATE login_otps SET is_used = true WHERE id = $1', [id]);
};

module.exports = { create, findActive, incrementAttempts, markUsed };
