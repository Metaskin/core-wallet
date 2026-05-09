const { pool } = require('../config/database');

// Normalise email to lowercase + trimmed at the repository layer.
// Joi already does this at validation time, but having it here too means
// no mixed-case or whitespace-padded email can ever reach the database,
// even if a code path bypasses validation (e.g. admin scripts, future endpoints).
const normaliseEmail = (email) => (email || '').trim().toLowerCase();

const findById = async (id, client = pool) => {
  const { rows } = await client.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
};

const FIND_BY_EMAIL_SQL = 'SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))';

const findByEmail = async (email, client = pool) => {
  const normalized = normaliseEmail(email);
  console.log(`[UserRepo] findByEmail SQL : ${FIND_BY_EMAIL_SQL}`);
  console.log(`[UserRepo] findByEmail param: "${normalized}"`);
  const { rows } = await client.query(FIND_BY_EMAIL_SQL, [normalized]);
  console.log(`[UserRepo] findByEmail("${normalized}") → ${rows.length} row(s)${rows.length > 0 ? `  id=${rows[0].id}` : ''}`);
  return rows[0] || null;
};

const create = async ({ email, passwordHash, fullName, avatarColor = '#6366f1', role = 'user' }, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO users (email, password_hash, full_name, avatar_color, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, full_name, avatar_color, role, created_at`,
    [normaliseEmail(email), passwordHash, fullName, avatarColor, role]
  );
  return rows[0];
};

const updateLastLogin = async (id, client = pool) => {
  await client.query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [id]
  );
};

const findAll = async (client = pool) => {
  const { rows } = await client.query(
    `SELECT u.id, u.email, u.full_name, u.role, u.avatar_color,
            u.is_active, u.created_at, u.last_login_at,
            a.id AS account_id, a.account_number, a.balance, a.currency, a.status AS account_status
     FROM users u
     LEFT JOIN accounts a ON a.user_id = u.id
     ORDER BY u.created_at DESC`
  );
  return rows;
};

const updatePassword = async (id, passwordHash, client = pool) => {
  await client.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [passwordHash, id]
  );
};

const updateEmail = async (id, email, client = pool) => {
  const { rows } = await client.query(
    'UPDATE users SET email = $1 WHERE id = $2 RETURNING *',
    [normaliseEmail(email), id]
  );
  return rows[0];
};

const setResetToken = async (id, token, expiry, client = pool) => {
  await client.query(
    'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
    [token, expiry, id]
  );
};

const findByResetToken = async (token, client = pool) => {
  const { rows } = await client.query(
    'SELECT * FROM users WHERE reset_token = $1',
    [token]
  );
  return rows[0] || null;
};

const clearResetToken = async (id, client = pool) => {
  await client.query(
    'UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE id = $1',
    [id]
  );
};

module.exports = {
  findById, findByEmail, create, updateLastLogin, findAll,
  updatePassword, updateEmail, setResetToken, findByResetToken, clearResetToken,
};
