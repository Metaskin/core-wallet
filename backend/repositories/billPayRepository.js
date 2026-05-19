const { pool } = require('../config/database');

const findBillersByUserId = async (userId, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM bill_pay_billers WHERE user_id = $1 ORDER BY name ASC`,
    [userId]
  );
  return rows;
};

const findBillerById = async (id, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM bill_pay_billers WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const createBiller = async ({ userId, name, accountNumber, category }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO bill_pay_billers (user_id, name, account_number, category)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, name, accountNumber || null, category || null]
  );
  return rows[0];
};

const deleteBiller = async (id, client = pool) => {
  await client.query(`DELETE FROM bill_pay_billers WHERE id = $1`, [id]);
};

const findPaymentsByUserId = async (userId, limit = 20, client = pool) => {
  const { rows } = await client.query(
    `SELECT bp.*, b.name AS biller_name, b.account_number AS biller_account_number, b.category AS biller_category
     FROM bill_pay_payments bp
     JOIN bill_pay_billers b ON b.id = bp.biller_id
     WHERE b.user_id = $1
     ORDER BY bp.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows;
};

const createPayment = async ({ billerId, accountId, amount, scheduledDate, dueDate, memo, reference, isRecurring, frequency }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO bill_pay_payments (biller_id, account_id, amount, scheduled_date, due_date, memo, reference, is_recurring, frequency, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled')
     RETURNING *`,
    [billerId, accountId, amount, scheduledDate, dueDate || null, memo || null, reference, isRecurring || false, frequency || null]
  );
  return rows[0];
};

const updatePaymentStatus = async (id, status, paymentDate = null, client = pool) => {
  const { rows } = await client.query(
    `UPDATE bill_pay_payments SET status = $1, payment_date = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
    [status, paymentDate, id]
  );
  return rows[0] || null;
};

const cancelPayment = async (id, client = pool) => {
  const { rows } = await client.query(
    `UPDATE bill_pay_payments SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] || null;
};

module.exports = { findBillersByUserId, findBillerById, createBiller, deleteBiller, findPaymentsByUserId, createPayment, updatePaymentStatus, cancelPayment };
