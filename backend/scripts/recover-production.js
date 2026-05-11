/**
 * recover-production.js — full idempotent recovery for Neon production DB.
 *
 * Run from the backend/ directory:
 *   DATABASE_URL="<neon-url>" node scripts/recover-production.js
 *
 * Phases:
 *   0. Users    — insert all 4 users; if email already exists with a different
 *                 UUID, remap that UUID so downstream FKs stay consistent.
 *   1. Accounts — delete wrong seed-script accounts, upsert correct ones.
 *   2. Cards    — insert 4 valid cards (ON CONFLICT DO NOTHING).
 *   3. Transactions — parse local_wallet_dump.sql, strip card_id column,
 *                     insert with ON CONFLICT DO NOTHING.
 *   4. Audit    — print final counts and balances.
 *
 * Every phase runs per-item with individual try/catch so one failure never
 * crashes the whole recovery. Missing users are logged and their downstream
 * accounts/cards are skipped safely.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set.');
  console.error('  DATABASE_URL="postgres://..." node scripts/recover-production.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

// ── Source data (from local_wallet_dump.sql + users_only.sql) ─────────────────
// Passwords are bcrypt-hashed — existing users can log in unchanged.
// $2a$ and $2b$ prefixes are both accepted by bcryptjs.compare().

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

// Accounts from local_wallet_dump.sql.
// user_id values here are the ORIGINAL dump UUIDs — they are remapped at
// runtime if the email already exists in Neon under a different UUID.
const ACCOUNTS = [
  {
    id:             '26ff2d27-825e-4b5c-991e-a197d83b893a',
    user_id:        '8b7a2d3b-6941-4c5d-be15-d4c2012b1617',
    account_number: 'CW76350025',
    balance:        990000.00,
    created_at:     '2026-05-01 11:00:45.408037+01',
    updated_at:     '2026-05-03 22:08:48.310613+01',
  },
  {
    id:             '851e9849-0a0d-4072-a7b1-e75e58899a88',
    user_id:        '812ca9f8-d5ec-4e70-b8df-e1e5e93fffff',
    account_number: 'CW80829882',
    balance:        10000.00,
    created_at:     '2026-05-01 11:27:32.277046+01',
    updated_at:     '2026-05-03 22:08:48.310613+01',
  },
  {
    id:             'a4a94db0-1965-4b74-a5be-64a36aebbdd1',
    user_id:        '3165c546-cc97-4cef-95fc-852b9f4046ae',
    account_number: 'CW18674121',
    balance:        125650.00,
    created_at:     '2026-05-02 16:02:50.905005+01',
    updated_at:     '2026-05-03 22:59:38.277979+01',
  },
  {
    id:             '38b2c094-f360-46e7-87f2-1e5d70948af0',
    user_id:        'dfa6d703-74b9-4e07-b6ba-6c78c4c7c19a',
    account_number: 'CW35287127',
    balance:        0.00,
    created_at:     '2026-05-08 17:51:37.595831+01',
    updated_at:     '2026-05-08 17:51:37.595831+01',
  },
];

// Card 7570c8ea skipped: masked card_number '**** **** **** 4121', frozen,
// NULL expiry — cannot be inserted (violates NOT NULL on expiry_month/year).
// cvv_hash is NULL (nullable after migration 003); cvv holds the encrypted value.
const CARDS = [
  {
    id:               '42166c12-2cbe-4fa1-b54d-cc02bea1ef80',
    account_id:       '26ff2d27-825e-4b5c-991e-a197d83b893a',
    card_number:      '3.39203397349910',
    card_type:        'credit',
    cvv:              '151',
    status:           'active',
    credit_limit:     5000.00,
    credit_used:      0.00,
    card_holder_name: 'CARD HOLDER',
    design:           'blue',
    expiry_month:     11,
    expiry_year:      2029,
    balance:          0.00,
    is_active:        true,
    is_virtual:       false,
    last4:            '9910',
    created_at:       '2026-05-02 02:07:34.166109+01',
  },
  {
    id:               'a93343af-3673-4213-ae57-456f9cab1292',
    account_id:       '26ff2d27-825e-4b5c-991e-a197d83b893a',
    card_number:      '6d383cd9ee29e6c3ad0acecf:9dd83dd282556dd91d515914c44422a6:782da03927ede5fe7b9ec0b80d97b14f',
    card_type:        'debit',
    cvv:              '92b4cc4487c1a4a6884a8d45:5c3c7d20ce4aa4b78ebb8ada162b1c88:3555b8',
    status:           'active',
    credit_limit:     null,
    credit_used:      0.00,
    card_holder_name: 'CARD HOLDER',
    design:           'black',
    expiry_month:     5,
    expiry_year:      2029,
    balance:          0.00,
    is_active:        true,
    is_virtual:       false,
    last4:            '0740',
    created_at:       '2026-05-02 05:29:29.914862+01',
  },
  {
    id:               '655e78c0-aa20-4ab3-8409-11ebc453dadf',
    account_id:       'a4a94db0-1965-4b74-a5be-64a36aebbdd1',
    card_number:      '9ce6d02e69d63bde26808a22:c06c7bf5beca37d6fe6e995cd4b28884:38c4dea696e14343a72f0198568947b2',
    card_type:        'debit',
    cvv:              '4ffc2187197fdf215c322737:dcc9cffc31b711ed6d0e26fa93d1bc86:588f46',
    status:           'active',
    credit_limit:     null,
    credit_used:      0.00,
    card_holder_name: 'CARD HOLDER',
    design:           'gold',
    expiry_month:     5,
    expiry_year:      2029,
    balance:          0.00,
    is_active:        true,
    is_virtual:       false,
    last4:            '8762',
    created_at:       '2026-05-02 16:03:13.191956+01',
  },
  {
    id:               '82666a43-49da-47b8-a4f2-8c2882f161de',
    account_id:       'a4a94db0-1965-4b74-a5be-64a36aebbdd1',
    card_number:      '117553ea2dda35f8f49a0e0f:cf6a8bd600c5d9c5ce39d873613b9b4c:6aa7cfa91d231fdcaf4879084983b304',
    card_type:        'debit',
    cvv:              '0b359d085f106756b0a1153d:e515349be8b0234e41535c8c300787b4:b50bcb',
    status:           'active',
    credit_limit:     null,
    credit_used:      0.00,
    card_holder_name: 'CARD HOLDER',
    design:           'black',
    expiry_month:     5,
    expiry_year:      2029,
    balance:          0.00,
    is_active:        true,
    is_virtual:       false,
    last4:            '9382',
    created_at:       '2026-05-02 16:03:21.478566+01',
  },
];

// ── Phase 0: Ensure all users exist ───────────────────────────────────────────
// Returns a map of { originalDumpUUID → actualNeonUUID }.
// If a user already exists under the same email with a different UUID, we
// record the remap so accounts use the UUID that actually exists in Neon.
async function ensureUsers() {
  console.log('\nPhase 0 — users');

  // originalId → actualId in Neon (may differ if user registered independently)
  const userIdMap = {};
  let inserted = 0;
  let existed  = 0;
  let remapped = 0;
  const missing = [];

  for (const u of USERS) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Check by email (case-insensitive) first — the canonical match.
      const { rows: byEmail } = await client.query(
        `SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) LIMIT 1`,
        [u.email]
      );

      if (byEmail.length > 0) {
        const actualId = byEmail[0].id;
        userIdMap[u.id] = actualId;
        if (actualId !== u.id) {
          console.log(`  [REMAP]  ${u.email}  dump=${u.id}  neon=${actualId}`);
          remapped++;
        } else {
          console.log(`  [EXIST]  ${u.email}`);
          existed++;
        }
        await client.query('COMMIT');
        continue;
      }

      // 2. User not found by email — insert with original UUID.
      //    ON CONFLICT DO NOTHING covers both the PK (id) and the email
      //    functional unique index created by migration 002.
      const result = await client.query(
        `INSERT INTO users
           (id, email, password_hash, full_name, role,
            is_active, is_verified, avatar_color, created_at, updated_at)
         VALUES ($1, LOWER(TRIM($2)), $3, $4, $5, true, false, $6, $7, NOW())
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [u.id, u.email, u.password_hash, u.full_name, u.role, u.avatar_color, u.created_at]
      );

      if (result.rowCount > 0) {
        userIdMap[u.id] = u.id;
        console.log(`  [INSERT] ${u.email}`);
        inserted++;
      } else {
        // Conflict was suppressed — re-query to find the actual id.
        const { rows: retry } = await client.query(
          `SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) LIMIT 1`,
          [u.email]
        );
        if (retry.length > 0) {
          const actualId = retry[0].id;
          userIdMap[u.id] = actualId;
          if (actualId !== u.id) {
            console.log(`  [REMAP]  ${u.email}  dump=${u.id}  neon=${actualId}`);
            remapped++;
          } else {
            console.log(`  [EXIST]  ${u.email}`);
            existed++;
          }
        } else {
          console.error(`  [ERROR]  ${u.email}: could not insert or locate user`);
          missing.push(u.email);
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error(`  [ERROR]  ${u.email}: ${err.message}`);
      missing.push(u.email);
    } finally {
      client.release();
    }
  }

  console.log(`  Result: inserted=${inserted}  existed=${existed}  remapped=${remapped}  missing=${missing.length}`);
  if (missing.length > 0) {
    console.error(`  [WARN] Missing user(s) — their accounts/cards will be skipped:`);
    missing.forEach(e => console.error(`         ${e}`));
  }

  return userIdMap;
}

// ── Phase 1: Fix accounts ──────────────────────────────────────────────────────
// Uses userIdMap to substitute actual Neon UUIDs where the user registered
// with a different UUID than what the dump recorded.
// Each account is processed independently — one failure does not block others.
async function fixAccounts(userIdMap) {
  console.log('\nPhase 1 — accounts');

  // Build resolved account list, swapping dump user_id for actual Neon user_id.
  // Skip any account whose user is not in the map (insert failed in Phase 0).
  const resolved = [];
  for (const a of ACCOUNTS) {
    const actualUserId = userIdMap[a.user_id];
    if (!actualUserId) {
      console.warn(`  [SKIP]   account ${a.account_number} — user ${a.user_id} is not in Neon`);
      continue;
    }
    resolved.push({ ...a, user_id: actualUserId });
  }

  let deletedWrong = 0;
  let inserted     = 0;
  let updated      = 0;
  let errors       = 0;

  for (const a of resolved) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete any account for this user that has a different UUID.
      // Cards on those wrong accounts are cascade-deleted automatically.
      // Transactions are NOT cascade-deleted (no ON DELETE CASCADE on the FK),
      // but since this is a fresh DB there are none yet on the first run.
      // On subsequent runs the wrong accounts were already removed so this
      // deletes 0 rows — safe either way.
      const del = await client.query(
        `DELETE FROM accounts WHERE user_id = $1 AND id != $2`,
        [a.user_id, a.id]
      );
      deletedWrong += del.rowCount;

      // Upsert correct account: INSERT on first run, UPDATE balance on re-runs.
      const result = await client.query(
        `INSERT INTO accounts
           (id, user_id, account_number, balance, currency, status,
            external_account_id, available_balance, pending_balance,
            created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'USD', 'active', NULL, $4, 0, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           account_number    = EXCLUDED.account_number,
           balance           = EXCLUDED.balance,
           available_balance = EXCLUDED.balance,
           updated_at        = NOW()
         RETURNING xmax`,
        [a.id, a.user_id, a.account_number, a.balance, a.created_at, a.updated_at]
      );

      // xmax = '0' means a fresh INSERT; non-zero means the ON CONFLICT UPDATE fired.
      if (result.rows[0]?.xmax === '0') {
        console.log(`  [INSERT] ${a.account_number}  $${a.balance.toLocaleString()}`);
        inserted++;
      } else {
        console.log(`  [UPDATE] ${a.account_number}  $${a.balance.toLocaleString()} (balance restored)`);
        updated++;
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      console.error(`  [ERROR]  ${a.account_number}: ${err.message}`);
      errors++;
    } finally {
      client.release();
    }
  }

  console.log(`  Result: deletedWrong=${deletedWrong}  inserted=${inserted}  updated=${updated}  errors=${errors}`);
  return errors === 0;
}

// ── Phase 2: Insert cards ──────────────────────────────────────────────────────
async function insertCards() {
  console.log('\nPhase 2 — cards');

  // Verify each card's parent account actually exists before attempting insert.
  const accountIds = new Set(CARDS.map(c => c.account_id));
  const client0    = await pool.connect();
  let existingAccounts;
  try {
    const { rows } = await client0.query(
      `SELECT id FROM accounts WHERE id = ANY($1::uuid[])`,
      [Array.from(accountIds)]
    );
    existingAccounts = new Set(rows.map(r => r.id));
  } finally {
    client0.release();
  }

  let inserted = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const c of CARDS) {
    if (!existingAccounts.has(c.account_id)) {
      console.warn(`  [SKIP]   card **** ${c.last4} — account ${c.account_id} not found`);
      skipped++;
      continue;
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO cards
           (id, account_id, card_number, card_holder_name,
            expiry_month, expiry_year, cvv, cvv_hash,
            card_type, status, credit_limit, credit_used,
            is_virtual, design, created_at, updated_at,
            balance, is_active, last4)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9, $10, $11, $12, $13, $14, NOW(), $15, $16, $17)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          c.id, c.account_id, c.card_number, c.card_holder_name,
          c.expiry_month, c.expiry_year, c.cvv,
          c.card_type, c.status, c.credit_limit, c.credit_used,
          c.is_virtual, c.design, c.created_at,
          c.balance, c.is_active, c.last4,
        ]
      );
      if (result.rowCount > 0) {
        console.log(`  [INSERT] **** ${c.last4}  ${c.card_type}  ${c.design}`);
        inserted++;
      } else {
        console.log(`  [SKIP]   **** ${c.last4}  (already exists)`);
        skipped++;
      }
    } catch (err) {
      console.error(`  [ERROR]  **** ${c.last4}: ${err.message}`);
      errors++;
    } finally {
      client.release();
    }
  }

  console.log(`  Result: inserted=${inserted}  skipped=${skipped}  errors=${errors}`);
}

// ── Phase 3: Import transactions from dump ─────────────────────────────────────
// Strips the `card_id` column (not in Neon schema) from each INSERT.
// `is_deleted` IS in Neon schema (added by migration 001) and is kept.
// Each INSERT is individual and auto-rolled-back on error — partial success OK.
async function importTransactions() {
  console.log('\nPhase 3 — transactions');

  const dumpPath = path.join(__dirname, '../local_wallet_dump.sql');
  if (!fs.existsSync(dumpPath)) {
    console.warn('  [WARN] local_wallet_dump.sql not found — skipping');
    return;
  }

  const lines    = fs.readFileSync(dumpPath, 'utf8').split('\n');
  let inserted   = 0;
  let skipped    = 0;
  let errors     = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('INSERT INTO public.transactions')) continue;

    // Strip ', card_id' from the column list (always the last listed column).
    let sql = trimmed.replace(', card_id)', ')');

    // Strip the card_id value (last value in VALUES — UUID string or NULL).
    sql = sql.replace(/, (?:NULL|'[0-9a-f-]+')\);$/, ');');

    // Add conflict guard and remove trailing semicolon for pg driver.
    sql = sql.replace(/;$/, '') + ' ON CONFLICT DO NOTHING';

    const client = await pool.connect();
    try {
      const result = await client.query(sql);
      if (result.rowCount > 0) inserted++;
      else skipped++;
    } catch (err) {
      console.error(`  [ERROR] ${err.message.split('\n')[0]}`);
      console.error(`          ${sql.substring(0, 100)}...`);
      errors++;
    } finally {
      client.release();
    }
  }

  console.log(`  Result: inserted=${inserted}  skipped=${skipped}  errors=${errors}`);
  if (errors > 0) console.warn('  [WARN] Some transactions failed — see errors above.');
}

// ── Phase 4: Audit ─────────────────────────────────────────────────────────────
async function printAudit() {
  console.log('\nPhase 4 — audit');

  const client = await pool.connect();
  try {
    const { rows: users } = await client.query(
      `SELECT id, email, full_name, role FROM users
       WHERE LOWER(TRIM(email)) = ANY($1)
       ORDER BY created_at`,
      [USERS.map(u => u.email.toLowerCase().trim())]
    );
    console.log('\n── Users ───────────────────────────────────────────────');
    for (const u of users) {
      console.log(`  ${u.full_name.padEnd(18)} ${u.email}  (${u.id})`);
    }

    const { rows: accounts } = await client.query(
      `SELECT a.account_number, a.balance, a.status, u.full_name
       FROM accounts a JOIN users u ON u.id = a.user_id
       WHERE a.id = ANY($1::uuid[])
       ORDER BY a.balance DESC`,
      [ACCOUNTS.map(a => a.id)]
    );
    console.log('\n── Accounts ────────────────────────────────────────────');
    if (accounts.length === 0) console.log('  (none found — check Phase 1 errors above)');
    for (const r of accounts) {
      console.log(`  ${r.full_name.padEnd(18)} ${r.account_number}  $${Number(r.balance).toLocaleString()}`);
    }

    const { rows: cards } = await client.query(
      `SELECT c.last4, c.card_type, c.status, c.design, a.account_number
       FROM cards c JOIN accounts a ON a.id = c.account_id
       WHERE c.id = ANY($1::uuid[])
       ORDER BY a.account_number, c.card_type`,
      [CARDS.map(c => c.id)]
    );
    console.log('\n── Cards ───────────────────────────────────────────────');
    if (cards.length === 0) console.log('  (none found — check Phase 2 errors above)');
    for (const r of cards) {
      console.log(`  **** ${r.last4}  ${r.card_type.padEnd(7)}  ${r.design.padEnd(6)}  → ${r.account_number}`);
    }

    const { rows: tx } = await client.query(
      `SELECT COUNT(*)::int                                             AS total,
              COUNT(*) FILTER (WHERE status = 'completed')::int        AS completed,
              COUNT(*) FILTER (WHERE status = 'pending')::int          AS pending,
              COUNT(*) FILTER (WHERE status = 'failed')::int           AS failed,
              SUM(CASE WHEN is_deleted THEN 1 ELSE 0 END)::int         AS soft_deleted
       FROM   transactions
       WHERE  sender_account_id   = ANY($1::uuid[])
          OR  receiver_account_id = ANY($1::uuid[])`,
      [ACCOUNTS.map(a => a.id)]
    );
    console.log('\n── Transactions ────────────────────────────────────────');
    const t = tx[0];
    console.log(`  Total: ${t.total}  completed: ${t.completed}  pending: ${t.pending}  failed: ${t.failed}  soft-deleted: ${t.soft_deleted}`);

    const { rows: notif } = await client.query(
      `SELECT COUNT(*)::int AS total FROM notifications`
    ).catch(() => ({ rows: [{ total: 'table missing' }] }));
    console.log(`\n── Notifications: ${notif[0].total} ─────────────────────────────`);
  } finally {
    client.release();
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function run() {
  console.log('CoreWallet production recovery');
  console.log('================================');

  try {
    const userIdMap = await ensureUsers();
    await fixAccounts(userIdMap);
    await insertCards();
    await importTransactions();
    await printAudit();
  } catch (err) {
    console.error('\n[FATAL] Unexpected error:', err.message);
    console.error(err.stack);
  } finally {
    await pool.end();
  }

  console.log('\nRecovery complete.\n');
}

run();
