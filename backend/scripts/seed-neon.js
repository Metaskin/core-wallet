/**
 * seed-neon.js — import existing users + accounts into the Neon production DB.
 *
 * Run from the backend/ directory:
 *   DATABASE_URL="<neon-connection-string>" node scripts/seed-neon.js
 *
 * Fully idempotent — safe to run multiple times:
 *   - Each user is processed in its own transaction so one duplicate does not
 *     abort the rest.
 *   - ON CONFLICT DO NOTHING (no conflict target) suppresses ALL unique
 *     violations: the primary-key constraint on `id` AND the functional unique
 *     index on LOWER(email) created by migration 002.
 *   - Account creation is skipped if the user already has one.
 *
 * After running, verify with:
 *   psql "<neon-url>" -c "SELECT u.email, a.account_number, a.balance \
 *     FROM users u LEFT JOIN accounts a ON a.user_id = u.id \
 *     ORDER BY u.created_at;"
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set.');
  console.error('  DATABASE_URL="postgres://..." node scripts/seed-neon.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

// ── Source data from local DB backup ─────────────────────────────────────────
// Passwords are already bcrypt-hashed — existing users can log in unchanged.

const USERS = [
  {
    id:            '8b7a2d3b-6941-4c5d-be15-d4c2012b1617',
    email:         'smmy23538@gmail.com',
    password_hash: '$2a$12$WL8J/DbsKwvGyG22w0c0cu9zGLV4TTA339KxMorONaGb2DwcJDUAW',
    full_name:     'Darren Craig',
    role:          'user',
    avatar_color:  '#6366f1',
    created_at:    '2026-05-01 11:00:45.408037+01',
  },
  {
    id:            '812ca9f8-d5ec-4e70-b8df-e1e5e93fffff',
    email:         'drdc983@gmail.com',
    password_hash: '$2a$12$jb5ZQwmt9jV58w1EDWcjcOnDbm0MVF.dkjV3/HckBzIiUO41nyaB.',
    full_name:     'ben fields',
    role:          'user',
    avatar_color:  '#6366f1',
    created_at:    '2026-05-01 11:27:32.277046+01',
  },
  {
    id:            '3165c546-cc97-4cef-95fc-852b9f4046ae',
    email:         'jp8969879@gmail.com',
    password_hash: '$2b$10$d7qNuKGj7uSaZA33Auqwqe.Vape4MjN9fgUOKJGh49MW4ACXlfn3i',
    full_name:     'James Peterson',
    role:          'user',
    avatar_color:  '#6366f1',
    created_at:    '2026-05-02 16:02:50.905005+01',
  },
  {
    id:            'dfa6d703-74b9-4e07-b6ba-6c78c4c7c19a',
    email:         'stephanwhite040@gmail.com',
    password_hash: '$2a$12$1e0ltJ5i9wCJ.oz1IQ5knOe32JaGTME5CrzOrRi20odLt9EGnj.3S',
    full_name:     'Mike fields',
    role:          'user',
    avatar_color:  '#6366f1',
    created_at:    '2026-05-08 17:51:37.595831+01',
  },
];

// Known account numbers from the backup, keyed by user_id.
// Users not listed here get a freshly generated CW + 8-digit number.
// Edit balances here if you want to restore non-zero values.
const KNOWN_ACCOUNTS = {
  '3165c546-cc97-4cef-95fc-852b9f4046ae': { number: 'CW71827206', balance: 0.00 },
};

const generateAccountNumber = () =>
  'CW' + Math.floor(10000000 + Math.random() * 90000000).toString();

// ── Per-user processing ───────────────────────────────────────────────────────
async function processUser(u) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ON CONFLICT DO NOTHING without a conflict target suppresses every unique
    // violation on this table — both `id` (PK) and `idx_users_email_lower`
    // (the functional unique index on LOWER(email) from migration 002).
    // Email is lowercased on insert to match what the index enforces.
    const userResult = await client.query(
      `INSERT INTO users
         (id, email, password_hash, full_name, role,
          is_active, is_verified, avatar_color, created_at, updated_at)
       VALUES ($1, LOWER(TRIM($2)), $3, $4, $5, true, false, $6, $7, NOW())
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [u.id, u.email, u.password_hash, u.full_name, u.role, u.avatar_color, u.created_at]
    );

    const userInserted = userResult.rowCount > 0;

    // Check whether an account already exists for this user_id
    const { rows: existing } = await client.query(
      'SELECT id, account_number FROM accounts WHERE user_id = $1 LIMIT 1',
      [u.id]
    );

    let accountStatus = 'skipped';
    let accountLabel  = existing[0]?.account_number || '—';

    if (existing.length === 0) {
      const known = KNOWN_ACCOUNTS[u.id];
      let accountNumber = known?.number || generateAccountNumber();

      if (!known) {
        for (let attempt = 0; attempt < 10; attempt++) {
          const { rows } = await client.query(
            'SELECT 1 FROM accounts WHERE account_number = $1',
            [accountNumber]
          );
          if (rows.length === 0) break;
          if (attempt === 9) throw new Error('Could not generate a unique account number after 10 tries');
          accountNumber = generateAccountNumber();
        }
      }

      const balance = known?.balance ?? 0.00;
      await client.query(
        `INSERT INTO accounts (user_id, account_number, balance, currency, status)
         VALUES ($1, $2, $3, 'USD', 'active')
         ON CONFLICT DO NOTHING`,
        [u.id, accountNumber, balance]
      );
      accountStatus = 'inserted';
      accountLabel  = `${accountNumber} ($${balance.toFixed(2)})`;
    }

    await client.query('COMMIT');
    return { ok: true, userInserted, accountStatus, accountLabel };

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    return { ok: false, error: err.message };
  } finally {
    client.release();
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\nSeeding ${USERS.length} users into Neon...\n`);

  let usersInserted  = 0;
  let usersSkipped   = 0;
  let accsInserted   = 0;
  let accsSkipped    = 0;
  let errors         = 0;

  for (const u of USERS) {
    const result = await processUser(u);

    if (!result.ok) {
      console.log(`  [ERROR]  ${u.email}: ${result.error}`);
      errors++;
      continue;
    }

    const userTag = result.userInserted ? '[INSERT]' : '[SKIP]  ';
    const acctTag = result.accountStatus === 'inserted' ? '[INSERT]' : '[SKIP]  ';

    console.log(`  ${userTag} user    ${u.email}`);
    console.log(`  ${acctTag} account ${result.accountLabel}`);
    console.log();

    if (result.userInserted)              usersInserted++;
    else                                  usersSkipped++;
    if (result.accountStatus === 'inserted') accsInserted++;
    else                                     accsSkipped++;
  }

  console.log('── Summary ─────────────────────────────────────────────');
  console.log(`  Users inserted  : ${usersInserted}`);
  console.log(`  Users skipped   : ${usersSkipped}  (already existed)`);
  console.log(`  Accounts created: ${accsInserted}`);
  console.log(`  Accounts skipped: ${accsSkipped}  (already existed)`);
  if (errors) console.log(`  Errors          : ${errors}`);
  console.log('\nPasswords and existing data are unchanged.');

  await pool.end();
  if (errors) process.exit(1);
}

run();
