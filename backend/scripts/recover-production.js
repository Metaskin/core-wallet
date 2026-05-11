/**
 * recover-production.js — restore correct accounts, cards, and transaction history
 * from local_wallet_dump.sql into the Neon production database.
 *
 * Run from the backend/ directory:
 *   DATABASE_URL="<neon-url>" node scripts/recover-production.js
 *
 * Idempotent — safe to run multiple times:
 *   - Accounts: deletes wrong seed-script accounts (wrong UUID/number), upserts correct ones
 *   - Cards: ON CONFLICT DO NOTHING
 *   - Transactions: ON CONFLICT DO NOTHING (skips already-imported rows)
 *
 * What this does NOT touch:
 *   - Users (already correct from seed-neon.js)
 *   - Notifications, sessions, admin_logs
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs');
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

// ── Correct accounts from local_wallet_dump.sql ────────────────────────────────
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

// ── Valid cards from local_wallet_dump.sql ─────────────────────────────────────
// Card 7570c8ea is skipped: masked card_number, frozen, NULL expiry — not importable.
// cvv_hash is NULL (nullable after migration 003); cvv holds the raw/encrypted value.
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

// ── Phase 1: Fix accounts ──────────────────────────────────────────────────────
async function fixAccounts(client) {
  const userIds    = ACCOUNTS.map(a => a.user_id);
  const correctIds = ACCOUNTS.map(a => a.id);

  // Remove accounts that have the right user_id but the wrong UUID.
  // ON DELETE CASCADE on cards means their cards are also removed.
  const del = await client.query(
    `DELETE FROM accounts
     WHERE user_id = ANY($1::uuid[])
       AND id      != ALL($2::uuid[])`,
    [userIds, correctIds]
  );

  let inserted = 0;
  let updated  = 0;

  for (const a of ACCOUNTS) {
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
    // xmax = 0 means INSERT, non-zero means UPDATE
    if (result.rows[0]?.xmax === '0') inserted++;
    else updated++;
  }

  return { deletedWrong: del.rowCount, inserted, updated };
}

// ── Phase 2: Insert cards ──────────────────────────────────────────────────────
async function insertCards(client) {
  let inserted = 0;
  let skipped  = 0;

  for (const c of CARDS) {
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
    if (result.rowCount > 0) inserted++;
    else skipped++;
  }

  return { inserted, skipped };
}

// ── Phase 3: Import transactions from dump ─────────────────────────────────────
// The dump has a `card_id` column that does not exist in the Neon schema.
// We strip it from the column list and remove its value from VALUES.
// `is_deleted` IS in the Neon schema (added by migration 001) and is preserved.
async function importTransactions(client) {
  const dumpPath = path.join(__dirname, '../local_wallet_dump.sql');
  if (!fs.existsSync(dumpPath)) {
    console.warn('  [WARN] local_wallet_dump.sql not found — skipping transactions');
    return { inserted: 0, skipped: 0, errors: 0 };
  }

  const lines = fs.readFileSync(dumpPath, 'utf8').split('\n');
  let inserted = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('INSERT INTO public.transactions')) continue;

    // 1. Remove 'card_id' from the column list (it's the last column)
    let sql = trimmed.replace(', card_id)', ')');

    // 2. Remove the last value (card_id) from VALUES — either a UUID string or NULL.
    //    The VALUES clause ends with: ..., 'uuid');  or  ..., NULL);
    sql = sql.replace(/, (?:NULL|'[0-9a-f-]+')\);$/, ');');

    // 3. Append ON CONFLICT DO NOTHING (strip the trailing ; first)
    sql = sql.replace(/;$/, '') + ' ON CONFLICT DO NOTHING';

    try {
      const result = await client.query(sql);
      if (result.rowCount > 0) inserted++;
      else skipped++;
    } catch (err) {
      console.error(`  [ERROR] transaction insert failed: ${err.message}`);
      console.error(`          SQL (first 120): ${sql.substring(0, 120)}`);
      errors++;
    }
  }

  return { inserted, skipped, errors };
}

// ── Phase 4: Audit ─────────────────────────────────────────────────────────────
async function printAudit(client) {
  const { rows: accounts } = await client.query(`
    SELECT u.full_name, u.email, a.account_number, a.balance
    FROM   accounts a
    JOIN   users u ON u.id = a.user_id
    WHERE  a.user_id = ANY($1::uuid[])
    ORDER  BY a.balance DESC
  `, [ACCOUNTS.map(a => a.user_id)]);

  const { rows: cards } = await client.query(`
    SELECT c.last4, c.card_type, c.status, c.design, a.account_number
    FROM   cards c
    JOIN   accounts a ON a.id = c.account_id
    WHERE  c.id = ANY($1::uuid[])
    ORDER  BY a.account_number, c.card_type
  `, [CARDS.map(c => c.id)]);

  const { rows: txCount } = await client.query(`
    SELECT COUNT(*)::int AS total,
           SUM(CASE WHEN is_deleted THEN 1 ELSE 0 END)::int AS soft_deleted
    FROM   transactions
    WHERE  sender_account_id = ANY($1::uuid[])
       OR  receiver_account_id = ANY($1::uuid[])
  `, [ACCOUNTS.map(a => a.id)]);

  console.log('\n── Accounts ────────────────────────────────────────────');
  for (const r of accounts) {
    console.log(`  ${r.full_name.padEnd(18)} ${r.account_number}  $${Number(r.balance).toLocaleString()}`);
  }
  console.log('\n── Cards ───────────────────────────────────────────────');
  for (const r of cards) {
    console.log(`  **** ${r.last4}  ${r.card_type.padEnd(7)}  ${r.design.padEnd(6)}  → ${r.account_number}`);
  }
  console.log('\n── Transactions ────────────────────────────────────────');
  const t = txCount[0];
  console.log(`  Total: ${t.total}  (${t.soft_deleted} soft-deleted)`);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\nCorewallet production recovery starting...\n');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Phase 1 — accounts...');
    const acc = await fixAccounts(client);
    console.log(`  Deleted wrong: ${acc.deletedWrong}  Inserted: ${acc.inserted}  Updated: ${acc.updated}`);

    console.log('Phase 2 — cards...');
    const crd = await insertCards(client);
    console.log(`  Inserted: ${crd.inserted}  Skipped (already exist): ${crd.skipped}`);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n[FATAL] Accounts/cards phase failed — rolled back:', err.message);
    await pool.end();
    process.exit(1);
  } finally {
    client.release();
  }

  // Transactions run outside the accounts transaction so partial success is preserved.
  const txClient = await pool.connect();
  try {
    console.log('Phase 3 — transactions (each statement is atomic)...');
    const tx = await importTransactions(txClient);
    console.log(`  Inserted: ${tx.inserted}  Skipped: ${tx.skipped}  Errors: ${tx.errors}`);
    if (tx.errors > 0) console.warn('  [WARN] Some transactions failed to import — see errors above.');
  } finally {
    txClient.release();
  }

  // Audit
  const auditClient = await pool.connect();
  try {
    await printAudit(auditClient);
  } finally {
    auditClient.release();
  }

  console.log('\nRecovery complete.\n');
  await pool.end();
}

run().catch((err) => {
  console.error('[FATAL]', err.message);
  pool.end().finally(() => process.exit(1));
});
