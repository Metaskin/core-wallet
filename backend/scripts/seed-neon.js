/**
 * seed-neon.js — import existing users + accounts into the Neon production DB.
 *
 * Run from the backend/ directory:
 *   DATABASE_URL="<neon-connection-string>" node scripts/seed-neon.js
 *
 * The script is fully idempotent:
 *   - Users are inserted with ON CONFLICT (id) DO NOTHING so re-running is safe.
 *   - A wallet account is created for each user that doesn't already have one,
 *     using the original account number where known, or a generated one otherwise.
 *   - All balances default to 0.00 — adjust the ACCOUNTS array below if you
 *     want to restore specific balances.
 *
 * After running, verify with:
 *   psql "<neon-url>" -c "SELECT u.email, a.account_number, a.balance FROM users u LEFT JOIN accounts a ON a.user_id = u.id ORDER BY u.created_at;"
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set. Pass it as an env var:');
  console.error('  DATABASE_URL="postgres://..." node scripts/seed-neon.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

// ── Source data from local DB backup ─────────────────────────────────────────
// Passwords are already bcrypt-hashed — they will work with the existing app.
// DO NOT share or commit this file with real credentials to a public repo.

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

// Known account numbers from the backup — keyed by user_id.
// Users not listed here will get a freshly generated account number (CW + 8 digits).
const KNOWN_ACCOUNTS = {
  '3165c546-cc97-4cef-95fc-852b9f4046ae': { number: 'CW71827206', balance: 0.00 },
};

const generateAccountNumber = () =>
  'CW' + Math.floor(10000000 + Math.random() * 90000000).toString();

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let usersInserted = 0;
    let accountsInserted = 0;
    let skipped = 0;

    for (const u of USERS) {
      // Insert user — skip if the UUID or email already exists
      const userResult = await client.query(
        `INSERT INTO users
           (id, email, password_hash, full_name, role, is_active, is_verified, avatar_color, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, false, $6, $7, NOW())
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
        [u.id, u.email, u.password_hash, u.full_name, u.role, u.avatar_color, u.created_at]
      );

      if (userResult.rowCount === 0) {
        console.log(`  [SKIP]   user ${u.email} — already exists`);
        skipped++;
      } else {
        console.log(`  [INSERT] user ${u.email} (${u.id})`);
        usersInserted++;
      }

      // Create wallet account if this user doesn't have one
      const { rows: existingAccounts } = await client.query(
        'SELECT id FROM accounts WHERE user_id = $1 LIMIT 1',
        [u.id]
      );

      if (existingAccounts.length === 0) {
        const known = KNOWN_ACCOUNTS[u.id];
        let accountNumber = known?.number || generateAccountNumber();

        // Ensure the generated number is unique
        if (!known) {
          let attempts = 0;
          while (true) {
            const { rows } = await client.query(
              'SELECT 1 FROM accounts WHERE account_number = $1',
              [accountNumber]
            );
            if (rows.length === 0) break;
            if (++attempts > 10) throw new Error('Could not generate unique account number');
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
        console.log(`  [INSERT] account ${accountNumber} (balance: $${balance.toFixed(2)}) for ${u.email}`);
        accountsInserted++;
      } else {
        console.log(`  [SKIP]   account for ${u.email} — already exists`);
      }
    }

    await client.query('COMMIT');

    console.log('\n── Summary ──────────────────────────────────────────');
    console.log(`  Users inserted : ${usersInserted}`);
    console.log(`  Users skipped  : ${skipped} (already existed)`);
    console.log(`  Accounts created: ${accountsInserted}`);
    console.log('\nDone. All existing auth flows and passwords remain unchanged.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\nFATAL — transaction rolled back:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
