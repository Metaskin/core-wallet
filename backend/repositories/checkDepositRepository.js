const { pool } = require('../config/database');

const findByAccountIds = async (accountIds, limit = 20, client = pool) => {
  if (!accountIds || !accountIds.length) return [];
  const { rows } = await client.query(
    `SELECT * FROM check_deposits
     WHERE account_id = ANY($1::uuid[])
     ORDER BY created_at DESC
     LIMIT $2`,
    [accountIds, limit]
  );
  return rows;
};

const findById = async (id, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM check_deposits WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ accountId, amount, checkNumber, memo, frontImageData, backImageData, reference }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO check_deposits (account_id, amount, check_number, memo, front_image_data, back_image_data, reference, availability_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '2 days')
     RETURNING *`,
    [accountId, amount, checkNumber || null, memo || null, frontImageData || null, backImageData || null, reference]
  );
  return rows[0];
};

const updateStatus = async (id, status, rejectionReason = null, client = pool) => {
  const { rows } = await client.query(
    `UPDATE check_deposits SET status = $1, rejection_reason = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
    [status, rejectionReason, id]
  );
  return rows[0] || null;
};

module.exports = { findByAccountIds, findById, create, updateStatus };
