const { pool } = require('../config/database');

const findByUserId = async (userId, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM autopay WHERE user_id = $1 ORDER BY next_due_date ASC`,
    [userId]
  );
  return rows;
};

const findById = async (id, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM autopay WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ userId, accountId, name, biller, amount, category, frequency, customDay, nextDueDate }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO autopay (user_id, account_id, name, biller, amount, category, frequency, custom_day, next_due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [userId, accountId, name, biller, amount, category, frequency, customDay || null, nextDueDate]
  );
  return rows[0];
};

const update = async (id, fields, client = pool) => {
  const allowed = ['name', 'biller', 'amount', 'category', 'frequency', 'custom_day', 'next_due_date', 'status'];
  const columnMap = {
    name:        'name',
    biller:      'biller',
    amount:      'amount',
    category:    'category',
    frequency:   'frequency',
    customDay:   'custom_day',
    nextDueDate: 'next_due_date',
    status:      'status',
  };

  const setClauses = [];
  const values     = [];
  let   idx        = 1;

  for (const [key, col] of Object.entries(columnMap)) {
    if (fields[key] !== undefined) {
      setClauses.push(`${col} = $${idx++}`);
      values.push(fields[key]);
    }
  }

  if (!setClauses.length) return null;

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await client.query(
    `UPDATE autopay SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
};

const remove = async (id, client = pool) => {
  await client.query(`DELETE FROM autopay WHERE id = $1`, [id]);
};

module.exports = { findByUserId, findById, create, update, remove };
