#!/usr/bin/env node
/**
 * backend/scripts/create-rds-user.js
 *
 * Creates (or resets the password of) a user directly in the connected database.
 * Use this when the user row exists in local PostgreSQL but NOT in RDS.
 *
 * Usage:
 *   node scripts/create-rds-user.js --check
 *     List every user and their account status in the connected database.
 *
 *   node scripts/create-rds-user.js --activate <email>
 *     Set accounts.status = 'active' for the given user's account.
 *     Use this when the dashboard shows "Frozen" but the user should be active.
 *
 *   node scripts/create-rds-user.js --create <email> <password> <fullName>
 *     Create a new user + account in the connected database.
 *
 *   node scripts/create-rds-user.js --reset-password <email> <newPassword>
 *     Bcrypt-hash and update the password for an existing user.
 *
 * Run from the backend/ directory:
 *   node scripts/create-rds-user.js --check
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env'), override: true });
const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const isProd        = process.env.NODE_ENV === 'production';
const sslEnabled    = process.env.DB_SSL === 'true'  ? true
                    : process.env.DB_SSL === 'false' ? false
                    : isProd;
const sslConfig     = sslEnabled ? { rejectUnauthorized: false } : false;
const useDatabaseUrl = !!(process.env.DATABASE_URL && isProd);

console.log(`[DB] Source: ${useDatabaseUrl ? 'DATABASE_URL' : `host=${process.env.DB_HOST || 'localhost'} db=${process.env.DB_NAME || 'corewallet'} user=${process.env.DB_USER || 'postgres'}`}`);

const pool = new Pool(
  useDatabaseUrl
    ? { connectionString: process.env.DATABASE_URL, ssl: sslConfig }
    : {
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME     || 'corewallet',
        user:     process.env.DB_USER     || 'postgres',
        password: process.env.DB_PASSWORD,
        ssl:      sslConfig,
      }
);

const BCRYPT_ROUNDS = 12;
const ACCOUNT_PREFIX = 'CW';

async function check() {
  const { rows: info } = await pool.query(`
    SELECT current_database() AS db,
           current_user       AS usr,
           inet_server_addr() AS srv,
           inet_server_port() AS prt
  `);
  const c = info[0];
  console.log(`\n[DB] database="${c.db}"  user="${c.usr}"  server=${c.srv || '(SSL — addr hidden)'}:${c.prt || '?'}`);

  const { rows } = await pool.query(`
    SELECT u.id, LOWER(TRIM(u.email)) AS email, u.full_name,
           CASE WHEN u.password_hash LIKE '$2%' THEN 'bcrypt' ELSE 'PLAIN TEXT' END AS hash_type,
           u.is_active, u.created_at,
           a.status  AS account_status,
           a.balance AS account_balance
    FROM users u
    LEFT JOIN accounts a ON a.user_id = u.id
    ORDER BY u.created_at DESC
  `);

  if (rows.length === 0) {
    console.log('\n  No users found in this database.');
    console.log('  → Run: node scripts/create-rds-user.js --create <email> <password> "<Full Name>"');
    return;
  }

  console.log(`\n  Found ${rows.length} user(s):\n`);
  for (const r of rows) {
    const acctFlag = r.account_status === 'frozen' ? '  ← FROZEN (run --activate to fix)' : '';
    console.log(`  id=${r.id}  email=${r.email}  name="${r.full_name}"  hash=${r.hash_type}  user_active=${r.is_active}  account_status=${r.account_status ?? 'NO ACCOUNT'}${acctFlag}`);
  }
}

async function createUser(email, password, fullName) {
  if (!email || !password || !fullName) {
    console.error('Usage: node scripts/create-rds-user.js --create <email> <password> "<Full Name>"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Error: password must be at least 8 characters.');
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { rows: existing } = await pool.query(
    'SELECT id FROM users WHERE LOWER(TRIM(email)) = $1',
    [normalizedEmail]
  );

  if (existing.length > 0) {
    console.error(`\nUser "${normalizedEmail}" already exists in this database (id=${existing[0].id}).`);
    console.error('To reset their password run:');
    console.error(`  node scripts/create-rds-user.js --reset-password "${email}" "<newpassword>"`);
    process.exit(1);
  }

  const passwordHash    = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const accountNumber   = `${ACCOUNT_PREFIX}${Math.floor(10000000 + Math.random() * 90000000)}`;
  const avatarColor     = '#6366f1';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: userRows } = await client.query(
      `INSERT INTO users (email, password_hash, full_name, avatar_color, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, email, full_name`,
      [normalizedEmail, passwordHash, fullName, avatarColor]
    );
    const user = userRows[0];

    const { rows: acctRows } = await client.query(
      `INSERT INTO accounts (user_id, account_number, balance, currency, status)
       VALUES ($1, $2, 0.00, 'USD', 'active')
       RETURNING id, account_number`,
      [user.id, accountNumber]
    );
    const account = acctRows[0];

    await client.query('COMMIT');

    console.log(`\n✓ User created successfully in "${process.env.DB_NAME || 'corewallet'}" on ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  id            : ${user.id}`);
    console.log(`  email         : ${user.email}`);
    console.log(`  full_name     : ${user.full_name}`);
    console.log(`  account_number: ${account.account_number}`);
    console.log(`  password      : [bcrypt hash — not shown]`);
    console.log('\nYou can now log in with this email and password.\n');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function resetPassword(email, newPassword) {
  if (!email || !newPassword) {
    console.error('Usage: node scripts/create-rds-user.js --reset-password <email> <newPassword>');
    process.exit(1);
  }
  if (newPassword.length < 8) {
    console.error('Error: password must be at least 8 characters.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const { rowCount } = await pool.query(
    `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL
     WHERE LOWER(TRIM(email)) = LOWER(TRIM($2))`,
    [hash, email]
  );

  if (rowCount === 0) {
    console.error(`\nNo user found with email: ${email}`);
    console.error('Run --check to see who is in this database.');
    process.exit(1);
  }

  console.log(`\n✓ Password updated for ${email.trim().toLowerCase()}. You can now log in.\n`);
}

async function activateAccount(email) {
  if (!email) {
    console.error('Usage: node scripts/create-rds-user.js --activate <email>');
    process.exit(1);
  }

  const normalized = email.trim().toLowerCase();

  // Find the user
  const { rows: userRows } = await pool.query(
    `SELECT id, LOWER(TRIM(email)) AS email FROM users WHERE LOWER(TRIM(email)) = $1`,
    [normalized]
  );
  if (userRows.length === 0) {
    console.error(`\nNo user found with email: ${normalized}`);
    console.error('Run --check to see who exists in this database.');
    process.exit(1);
  }
  const userId = userRows[0].id;

  // Show current account status before changing it
  const { rows: before } = await pool.query(
    `SELECT id, account_number, status, balance FROM accounts WHERE user_id = $1`,
    [userId]
  );
  if (before.length === 0) {
    console.error(`\nUser "${normalized}" exists but has no linked account row.`);
    console.error('Run --create to make a new account, or check the accounts table in pgAdmin.');
    process.exit(1);
  }

  const acc = before[0];
  console.log(`\n  Found account:`);
  console.log(`    id             : ${acc.id}`);
  console.log(`    account_number : ${acc.account_number}`);
  console.log(`    status (before): ${acc.status}`);
  console.log(`    balance        : ${acc.balance}`);

  if (acc.status === 'active') {
    console.log('\n  ✓ Account is already active — no change needed.\n');
    return;
  }

  // Apply the fix
  const { rows: updated } = await pool.query(
    `UPDATE accounts SET status = 'active' WHERE user_id = $1 RETURNING id, status`,
    [userId]
  );

  console.log(`\n  ✓ accounts.status updated: "${acc.status}" → "${updated[0].status}"`);
  console.log(`  Restart the backend (npm run dev) and reload the dashboard.\n`);
}

async function main() {
  const [,, cmd, arg1, arg2, arg3] = process.argv;

  try {
    await pool.query('SELECT 1');

    if (cmd === '--activate') {
      await activateAccount(arg1);
    } else if (cmd === '--create') {
      await createUser(arg1, arg2, arg3);
    } else if (cmd === '--reset-password') {
      await resetPassword(arg1, arg2);
    } else {
      await check();
    }
  } catch (err) {
    console.error('\nError:', err.message);
    if (err.message.includes('password authentication')) {
      console.error('Check DB_USER and DB_PASSWORD in .env');
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('timeout')) {
      console.error('Cannot reach the database. Check DB_HOST, DB_PORT, and SSL settings in .env');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
