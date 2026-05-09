const { pool } = require('../config/database');

const findById = async (id, client = pool) => {
  const { rows } = await client.query(
    'SELECT * FROM accounts WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const findByIdForUpdate = async (id, client) => {
  const { rows } = await client.query(
    'SELECT * FROM accounts WHERE id = $1 FOR UPDATE',
    [id]
  );
  return rows[0] || null;
};

const findByNumber = async (accountNumber, client = pool) => {
  const { rows } = await client.query(
    'SELECT * FROM accounts WHERE account_number = $1',
    [accountNumber]
  );
  return rows[0] || null;
};

const findByNumberForUpdate = async (accountNumber, client) => {
  const { rows } = await client.query(
    'SELECT * FROM accounts WHERE account_number = $1 AND status = $2 FOR UPDATE',
    [accountNumber, 'active']
  );
  return rows[0] || null;
};

const findByUserId = async (userId, client = pool) => {
  const { rows } = await client.query(
    `SELECT a.*, u.full_name, u.email, u.avatar_color
     FROM accounts a
     JOIN users u ON u.id = a.user_id
     WHERE a.user_id = $1`,
    [userId]
  );
  return rows[0] || null;
};

const create = async ({ userId, accountNumber, currency = 'USD', initialBalance = 0 }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO accounts (user_id, account_number, balance, currency)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, accountNumber, initialBalance, currency]
  );
  return rows[0];
};

const updateBalance = async (id, newBalance, client = pool) => {
  const { rows } = await client.query(
    'UPDATE accounts SET balance = $1 WHERE id = $2 RETURNING *',
    [newBalance, id]
  );
  return rows[0];
};

const updateStatus = async (id, status, client = pool) => {
  const { rows } = await client.query(
    "UPDATE accounts SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  );
  return rows[0];
};

module.exports = {
  findById,
  findByIdForUpdate,
  findByNumber,
  findByNumberForUpdate,
  findByUserId,
  create,
  updateBalance,
  updateStatus,
};
