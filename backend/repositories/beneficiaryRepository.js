const { pool } = require('../config/database');

const findByUserId = async (userId, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM beneficiaries WHERE user_id = $1 ORDER BY created_at ASC`,
    [userId]
  );
  return rows;
};

const findById = async (id, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM beneficiaries WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ userId, name, relationship, dateOfBirth, email, phone, address, percentage, isEmergencyContact }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO beneficiaries (user_id, name, relationship, date_of_birth, email, phone, address, percentage, is_emergency_contact)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [userId, name, relationship, dateOfBirth || null, email || null, phone || null, address || null, percentage || 0, isEmergencyContact || false]
  );
  return rows[0];
};

const update = async (id, fields, client = pool) => {
  const columnMap = {
    name:               'name',
    relationship:       'relationship',
    dateOfBirth:        'date_of_birth',
    email:              'email',
    phone:              'phone',
    address:            'address',
    percentage:         'percentage',
    isEmergencyContact: 'is_emergency_contact',
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
    `UPDATE beneficiaries SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
};

const remove = async (id, client = pool) => {
  await client.query(`DELETE FROM beneficiaries WHERE id = $1`, [id]);
};

module.exports = { findByUserId, findById, create, update, remove };
