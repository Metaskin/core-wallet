const { pool } = require('../config/database');

const findByAccountIds = async (accountIds, limit = 20, client = pool) => {
  if (!accountIds || !accountIds.length) return [];
  const { rows } = await client.query(
    `SELECT * FROM wire_transfers
     WHERE account_id = ANY($1::uuid[])
     ORDER BY created_at DESC
     LIMIT $2`,
    [accountIds, limit]
  );
  return rows;
};

const findById = async (id, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM wire_transfers WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ accountId, type, recipientName, recipientBank, routingNumber, recipientAccountNumber, swiftBic, iban, amount, currency, fee, memo, reference, estimatedDelivery }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO wire_transfers (
       account_id, type, recipient_name, recipient_bank, routing_number,
       recipient_account_number, swift_bic, iban, amount, currency, fee,
       memo, reference, estimated_delivery, status
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'processing')
     RETURNING *`,
    [
      accountId, type, recipientName, recipientBank || null, routingNumber || null,
      recipientAccountNumber || null, swiftBic || null, iban || null,
      amount, currency || 'USD', fee,
      memo || null, reference, estimatedDelivery,
    ]
  );
  return rows[0];
};

const updateStatus = async (id, status, client = pool) => {
  const { rows } = await client.query(
    `UPDATE wire_transfers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0] || null;
};

module.exports = { findByAccountIds, findById, create, updateStatus };
