const { pool } = require('../config/database');

const findByUserId = async (userId, client = pool) => {
  const { rows } = await client.query(
    `SELECT l.*,
            COUNT(lp.id)::int AS payment_count
     FROM loans l
     LEFT JOIN loan_payments lp ON lp.loan_id = l.id
     WHERE l.user_id = $1
     GROUP BY l.id
     ORDER BY l.created_at DESC`,
    [userId]
  );
  return rows;
};

const findById = async (id, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM loans WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const findPaymentsByLoanId = async (loanId, limit = 12, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM loan_payments WHERE loan_id = $1 ORDER BY payment_date DESC LIMIT $2`,
    [loanId, limit]
  );
  return rows;
};

const makePayment = async ({ loanId, amount, principalPaid, interestPaid, remainingBalance }, client = pool) => {
  const { rows: paymentRows } = await client.query(
    `INSERT INTO loan_payments (loan_id, amount, principal_paid, interest_paid, remaining_balance, payment_date)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING *`,
    [loanId, amount, principalPaid, interestPaid, remainingBalance]
  );

  await client.query(
    `UPDATE loans
     SET remaining_balance = $1,
         next_due_date     = next_due_date + INTERVAL '1 month',
         updated_at        = NOW()
     WHERE id = $2`,
    [remainingBalance, loanId]
  );

  return paymentRows[0];
};

module.exports = { findByUserId, findById, findPaymentsByLoanId, makePayment };
