const { pool } = require('../config/database');
const { formatTransaction } = require('../utils/formatters');

const BASE_SELECT = `
  SELECT
    t.id, t.reference, t.type, t.amount, t.currency,
    t.description, t.status, t.created_at,
    t.external_reference,
    t.sender_balance_before, t.sender_balance_after,
    t.receiver_balance_before, t.receiver_balance_after,
    sa.account_number AS sender_account_number,
    su.full_name      AS sender_name,
    ra.account_number AS receiver_account_number,
    ru.full_name      AS receiver_name,
    au.full_name      AS admin_name
  FROM transactions t
  LEFT JOIN accounts sa ON sa.id = t.sender_account_id
  LEFT JOIN users    su ON su.id = sa.user_id
  LEFT JOIN accounts ra ON ra.id = t.receiver_account_id
  LEFT JOIN users    ru ON ru.id = ra.user_id
  LEFT JOIN users    au ON au.id = t.initiated_by_admin_id
`;

const create = async ({
  reference, type, senderAccountId, receiverAccountId, adminId,
  amount, currency = 'USD', description, status = 'completed',
  senderBalBefore, senderBalAfter, receiverBalBefore, receiverBalAfter,
  externalReference,
}, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO transactions (
       reference, type, sender_account_id, receiver_account_id, initiated_by_admin_id,
       amount, currency, description, status,
       sender_balance_before, sender_balance_after,
       receiver_balance_before, receiver_balance_after,
       external_reference
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      reference, type, senderAccountId || null, receiverAccountId || null, adminId || null,
      amount, currency, description, status,
      senderBalBefore   ?? null, senderBalAfter   ?? null,
      receiverBalBefore ?? null, receiverBalAfter ?? null,
      externalReference || null,
    ]
  );
  return rows[0];
};

const findByAccountId = async (accountId, { page = 1, limit = 20 } = {}, client = pool) => {
  const offset = (page - 1) * limit;
  const { rows } = await client.query(
    `${BASE_SELECT}
     WHERE (sa.id = $1 OR ra.id = $1) AND t.is_deleted = false
     ORDER BY t.created_at DESC
     LIMIT $2 OFFSET $3`,
    [accountId, limit, offset]
  );
  const count = await client.query(
    `SELECT COUNT(*) FROM transactions t
     LEFT JOIN accounts sa ON sa.id = t.sender_account_id
     LEFT JOIN accounts ra ON ra.id = t.receiver_account_id
     WHERE (sa.id = $1 OR ra.id = $1) AND t.is_deleted = false`,
    [accountId]
  );
  return {
    rows: rows.map(formatTransaction),
    total: parseInt(count.rows[0].count),
  };
};

const findAll = async ({ page = 1, limit = 50 } = {}, client = pool) => {
  const offset = (page - 1) * limit;
  const { rows } = await client.query(
    `${BASE_SELECT} WHERE t.is_deleted = false ORDER BY t.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const count = await client.query("SELECT COUNT(*) FROM transactions WHERE is_deleted = false");
  return {
    rows: rows.map(formatTransaction),
    total: parseInt(count.rows[0].count),
  };
};

const findById = async (id, client = pool) => {
  const { rows } = await client.query(`${BASE_SELECT} WHERE t.id = $1`, [id]);
  return rows[0] ? formatTransaction(rows[0]) : null;
};

// Returns the raw DB row — used for ownership checks before soft-delete
const findRawById = async (id, client = pool) => {
  const { rows } = await client.query(
    'SELECT id, sender_account_id, receiver_account_id, is_deleted FROM transactions WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const softDelete = async (id, client = pool) => {
  await client.query(
    'UPDATE transactions SET is_deleted = true WHERE id = $1',
    [id]
  );
};

module.exports = { create, findByAccountId, findAll, findById, findRawById, softDelete };
