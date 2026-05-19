const { pool } = require('../config/database');

const findByUserId = async (userId, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM cashback_rewards WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || null;
};

const findTransactionsByUserId = async (userId, limit = 20, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM cashback_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return rows;
};

const updateBalance = async (userId, newBalance, totalEarned, totalRedeemed, client = pool) => {
  const { rows } = await client.query(
    `UPDATE cashback_rewards
     SET balance = $1, total_earned = $2, total_redeemed = $3, updated_at = NOW()
     WHERE user_id = $4
     RETURNING *`,
    [newBalance, totalEarned, totalRedeemed, userId]
  );
  return rows[0] || null;
};

const createTransaction = async ({ userId, transactionId, type, amount, merchant, category, multiplier, description }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO cashback_transactions (user_id, transaction_id, type, amount, merchant, category, multiplier, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, transactionId || null, type, amount, merchant || null, category || null, multiplier || null, description || null]
  );
  return rows[0];
};

module.exports = { findByUserId, findTransactionsByUserId, updateBalance, createTransaction };
