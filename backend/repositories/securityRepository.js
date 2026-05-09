const { pool } = require('../config/database');

const findByUserId = async (userId, client = pool) => {
  const { rows } = await client.query(
    'SELECT * FROM user_security_settings WHERE user_id = $1',
    [userId]
  );
  return rows[0] || null;
};

/** INSERT or UPDATE the PIN hash for a user */
const upsert = async (userId, pinHash, client = pool) => {
  await client.query(
    `INSERT INTO user_security_settings (user_id, pin_hash)
     VALUES ($1, $2)
     ON CONFLICT (user_id)
     DO UPDATE SET pin_hash = EXCLUDED.pin_hash, updated_at = NOW()`,
    [userId, pinHash]
  );
};

module.exports = { findByUserId, upsert };
