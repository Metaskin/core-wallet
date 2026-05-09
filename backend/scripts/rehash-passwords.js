#!/usr/bin/env node
/**
 * backend/scripts/rehash-passwords.js
 *
 * One-time migration tool for users whose password_hash was stored as plain text.
 * Supports three modes:
 *
 *   node scripts/rehash-passwords.js --list
 *     Show every user and whether their stored hash is bcrypt or plain text.
 *
 *   node scripts/rehash-passwords.js --generate-resets
 *     For every plain-text user, create a 2-hour reset token and print the
 *     reset URL. Visit each URL in the browser to set a proper password.
 *     Does NOT read or print the existing plain-text value.
 *
 *   node scripts/rehash-passwords.js --set user@example.com NewPassword123
 *     Directly bcrypt-hash and store a new password for one user.
 *     Use this for your own test accounts where you know the desired password.
 *
 * Run from the backend/ directory:
 *   node scripts/rehash-passwords.js --list
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

// ── DB connection — mirrors database.js logic exactly ─────────────────────────
const isProd        = process.env.NODE_ENV === 'production';
const sslEnabled    = process.env.DB_SSL === 'true'  ? true
                    : process.env.DB_SSL === 'false' ? false
                    : isProd;
const sslConfig     = sslEnabled ? { rejectUnauthorized: false } : false;
const useDatabaseUrl = !!(process.env.DATABASE_URL && isProd);

if (process.env.DATABASE_URL && !isProd) {
  console.warn('[DB] WARNING: DATABASE_URL is set but NODE_ENV is not "production" — ignoring it. Using individual DB_* vars.');
}
console.log(`[DB] Source: ${useDatabaseUrl ? 'DATABASE_URL' : `host=${process.env.DB_HOST || 'localhost'} db=${process.env.DB_NAME || 'corewallet'}`}`);

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

const CLIENT_ORIGIN   = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const RESET_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
const BCRYPT_ROUNDS   = 12;

// ── list ──────────────────────────────────────────────────────────────────────
async function listUsers() {
  const { rows } = await pool.query(`
    SELECT
      email,
      CASE WHEN password_hash LIKE '$2%' THEN 'bcrypt  ✓'
           ELSE 'PLAIN TEXT  ← needs fixing'
      END AS hash_status
    FROM users
    ORDER BY email
  `);

  if (rows.length === 0) {
    console.log('No users found in the database.');
    return;
  }

  const width = Math.max(...rows.map(r => r.email.length), 5);
  console.log(`\n  ${'EMAIL'.padEnd(width)}  HASH STATUS`);
  console.log(`  ${'─'.repeat(width)}  ${'─'.repeat(30)}`);
  for (const r of rows) {
    console.log(`  ${r.email.padEnd(width)}  ${r.hash_status}`);
  }

  const broken = rows.filter(r => r.hash_status.includes('PLAIN'));
  console.log(`\n  Total: ${rows.length}  |  Need fixing: ${broken.length}`);

  if (broken.length > 0) {
    console.log('\n  Options:');
    console.log('    node scripts/rehash-passwords.js --generate-resets');
    console.log('      → Creates reset tokens; visit each printed URL to set a new password.');
    console.log('    node scripts/rehash-passwords.js --set <email> <newpassword>');
    console.log('      → Directly sets a bcrypt hash for one account (good for test accounts).');
  }
}

// ── generate-resets ───────────────────────────────────────────────────────────
async function generateResets() {
  const { rows } = await pool.query(
    "SELECT id, email FROM users WHERE password_hash NOT LIKE '$2%' ORDER BY email"
  );

  if (rows.length === 0) {
    console.log('\nAll users already have bcrypt hashes. Nothing to do.\n');
    return;
  }

  console.log(`\nGenerating reset tokens for ${rows.length} user(s)...\n`);

  for (const u of rows) {
    const token  = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + RESET_EXPIRY_MS);

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
      [token, expiry, u.id]
    );

    const url = `${CLIENT_ORIGIN}/login?token=${token}`;
    console.log(`  Email : ${u.email}`);
    console.log(`  URL   : ${url}`);
    console.log(`  Expiry: ${expiry.toUTCString()}`);
    console.log('');
  }

  console.log('─'.repeat(70));
  console.log('Next steps:');
  console.log('  1. Open each URL above in your browser.');
  console.log('  2. Enter a new password (min 8 chars) and submit.');
  console.log('  3. Log in with that email + new password.');
  console.log('─'.repeat(70));
}

// ── set password ──────────────────────────────────────────────────────────────
async function setPassword(email, plainPassword) {
  if (!email || !plainPassword) {
    console.error('Usage: node scripts/rehash-passwords.js --set <email> <password>');
    process.exit(1);
  }
  if (plainPassword.length < 8) {
    console.error('Error: password must be at least 8 characters.');
    process.exit(1);
  }

  console.log(`Hashing password for ${email}...`);
  const hash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

  const { rowCount } = await pool.query(
    `UPDATE users
     SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL
     WHERE LOWER(email) = $2`,
    [hash, email.trim().toLowerCase()]
  );

  if (rowCount === 0) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`Done. You can now log in as ${email} with the new password.`);
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  const [,, cmd, arg1, arg2] = process.argv;

  try {
    await pool.query('SELECT 1');
    console.log(`[DB] Connected to ${process.env.DB_HOST || 'localhost'}/${process.env.DB_NAME || 'corewallet'}`);

    if (cmd === '--generate-resets') {
      await generateResets();
    } else if (cmd === '--set') {
      await setPassword(arg1, arg2);
    } else {
      await listUsers();
    }
  } catch (err) {
    console.error('\nError:', err.message);
    if (err.message.includes('password authentication')) {
      console.error('Check DB_USER and DB_PASSWORD in your .env file.');
    } else if (err.message.includes('ECONNREFUSED') || err.message.includes('timeout')) {
      console.error('Cannot reach the database. Check DB_HOST, DB_PORT, and network/VPN.');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
