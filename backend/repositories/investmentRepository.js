const { pool } = require('../config/database');

const findAccountByUserId = async (userId, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM investment_accounts WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || null;
};

const findHoldingsByAccountId = async (accountId, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM investment_holdings WHERE account_id = $1 ORDER BY current_value DESC`,
    [accountId]
  );
  return rows;
};

const findTransactionsByAccountId = async (accountId, limit = 20, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM investment_transactions WHERE account_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [accountId, limit]
  );
  return rows;
};

const createTransfer = async ({ accountId, type, amount, description }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO investment_transactions (account_id, type, amount, description, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [accountId, type, amount, description]
  );
  return rows[0];
};

const updateAccountBalance = async (accountId, newBalance, client = pool) => {
  const { rows } = await client.query(
    `UPDATE investment_accounts SET balance = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [newBalance, accountId]
  );
  return rows[0] || null;
};

module.exports = { findAccountByUserId, findHoldingsByAccountId, findTransactionsByAccountId, createTransfer, updateAccountBalance };
