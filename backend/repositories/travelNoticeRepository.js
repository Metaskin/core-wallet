const { pool } = require('../config/database');

const findByUserId = async (userId, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM travel_notices WHERE user_id = $1 ORDER BY start_date DESC`,
    [userId]
  );
  return rows;
};

const findById = async (id, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM travel_notices WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ userId, destination, destinationCountry, startDate, endDate, emergencyContactName, emergencyContactPhone, notes }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO travel_notices (user_id, destination, destination_country, start_date, end_date, emergency_contact_name, emergency_contact_phone, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, destination, destinationCountry || null, startDate, endDate, emergencyContactName || null, emergencyContactPhone || null, notes || null]
  );
  return rows[0];
};

const update = async (id, fields, client = pool) => {
  const columnMap = {
    destination:           'destination',
    destinationCountry:    'destination_country',
    startDate:             'start_date',
    endDate:               'end_date',
    emergencyContactName:  'emergency_contact_name',
    emergencyContactPhone: 'emergency_contact_phone',
    notes:                 'notes',
    status:                'status',
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
    `UPDATE travel_notices SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
};

module.exports = { findByUserId, findById, create, update };
