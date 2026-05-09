#!/usr/bin/env node
/**
 * backend/scripts/migrate-local-to-rds.js
 *
 * Safe, non-destructive migration of CoreWallet data from local PostgreSQL
 * to AWS RDS. Reads from local, inserts into RDS with ON CONFLICT DO NOTHING
 * so existing RDS rows are never overwritten.
 *
 * Usage (run from backend/ directory):
 *
 *   node scripts/migrate-local-to-rds.js --check
 *     Show row counts in both databases. No writes.
 *
 *   node scripts/migrate-local-to-rds.js --dry-run
 *     Show exactly what would be inserted. No writes.
 *
 *   node scripts/migrate-local-to-rds.js --migrate
 *     Copy all local rows into RDS (skips rows that already exist).
 *
 *   node scripts/migrate-local-to-rds.js --verify
 *     After migration, compare counts and flag any remaining gaps.
 *
 * Config — add these to .env or set as env vars before running:
 *
 *   LOCAL_DB_HOST     default: localhost
 *   LOCAL_DB_PORT     default: 5432
 *   LOCAL_DB_NAME     default: corewallet
 *   LOCAL_DB_USER     default: postgres
 *   LOCAL_DB_PASSWORD
 *
 *   RDS_HOST          default: from DB_HOST in .env
 *   RDS_PORT          default: from DB_PORT in .env
 *   RDS_DB_NAME       default: from DB_NAME in .env
 *   RDS_USER          default: from DB_USER in .env
 *   RDS_PASSWORD      default: from DB_PASSWORD in .env
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env'), override: true });
const { Pool } = require('pg');

// ── Local PostgreSQL connection ────────────────────────────────────────────────
const localPool = new Pool({
  host:     process.env.LOCAL_DB_HOST     || 'localhost',
  port:     parseInt(process.env.LOCAL_DB_PORT || '5432'),
  database: process.env.LOCAL_DB_NAME     || process.env.DB_NAME || 'corewallet',
  user:     process.env.LOCAL_DB_USER     || process.env.DB_USER || 'postgres',
  password: process.env.LOCAL_DB_PASSWORD || process.env.DB_PASSWORD,
  ssl:      false,
});

// ── RDS connection ────────────────────────────────────────────────────────────
const rdsPool = new Pool({
  host:     process.env.RDS_HOST     || process.env.DB_HOST,
  port:     parseInt(process.env.RDS_PORT || process.env.DB_PORT || '5432'),
  database: process.env.RDS_DB_NAME  || process.env.DB_NAME     || 'corewallet',
  user:     process.env.RDS_USER     || process.env.DB_USER     || 'postgres',
  password: process.env.RDS_PASSWORD || process.env.DB_PASSWORD,
  ssl:      { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const sep  = (char = '─', n = 70) => char.repeat(n);
const hdr  = (title) => { console.log(''); console.log(sep()); console.log(`  ${title}`); console.log(sep()); };
const line = (label, value) => console.log(`  ${label.padEnd(30)} ${value}`);

async function dbIdentity(pool, label) {
  const { rows } = await pool.query(`
    SELECT current_database() AS db,
           current_user       AS usr,
           inet_server_addr() AS srv,
           inet_server_port() AS prt
  `);
  const r = rows[0];
  console.log(`  [${label}] database="${r.db}" user="${r.usr}" server=${r.srv || '(SSL/addr hidden)'}:${r.prt || '?'}`);
}

async function rowCount(pool, table) {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM ${table}`);
    return rows[0].n;
  } catch {
    return null; // table may not exist in older schema
  }
}

// ── Table definitions in FK-safe insert order ─────────────────────────────────
// Each entry: { name, columns, conflictCol, skip }
//   conflictCol: the column(s) used for ON CONFLICT — always the PK
//   skip: these tables hold ephemeral data not worth migrating
const TABLES = [
  // Root table — no FKs
  {
    name:        'users',
    columns:     ['id','email','password_hash','full_name','role','is_active','is_verified',
                  'avatar_color','created_at','updated_at','last_login_at',
                  'reset_token','reset_token_expiry'],
    conflictCol: 'id',
  },
  // Depends on: users
  {
    name:        'accounts',
    columns:     ['id','user_id','account_number','balance','currency','status',
                  'external_account_id','created_at','updated_at',
                  'available_balance','pending_balance'],
    conflictCol: 'id',
  },
  // Depends on: users
  {
    name:        'user_security_settings',
    columns:     ['id','user_id','pin_hash','created_at','updated_at'],
    conflictCol: 'id',
  },
  // Depends on: users
  {
    name:        'support_tickets',
    columns:     ['id','user_id','subject','status','created_at','updated_at'],
    conflictCol: 'id',
  },
  // Depends on: accounts, users
  {
    name:        'transactions',
    columns:     ['id','reference','type','sender_account_id','receiver_account_id',
                  'initiated_by_admin_id','amount','currency','fee','description','status',
                  'sender_balance_before','sender_balance_after',
                  'receiver_balance_before','receiver_balance_after',
                  'external_reference','is_deleted','created_at'],
    conflictCol: 'id',
  },
  // Depends on: accounts
  {
    name:        'cards',
    columns:     ['id','account_id','card_number','card_holder_name','expiry_month',
                  'expiry_year','cvv','card_type','status','is_active','is_virtual',
                  'design','balance','credit_limit','credit_used','last4',
                  'created_at','updated_at'],
    conflictCol: 'id',
  },
  // Depends on: users, accounts, transactions
  {
    name:        'admin_logs',
    columns:     ['id','admin_id','action','target_user_id','target_account_id',
                  'transaction_id','details','ip_address','created_at'],
    conflictCol: 'id',
  },
  // Depends on: support_tickets, users
  {
    name:        'support_messages',
    columns:     ['id','ticket_id','user_id','sender_role','message','created_at'],
    conflictCol: 'id',
  },
  // Skip: sessions and login_otps are ephemeral — sessions expire,
  // OTPs are one-use. Migrating stale ones creates no value and may
  // cause confusion if a user tries to reuse an old OTP.
  { name: 'sessions',    columns: [], conflictCol: 'id', skip: true },
  { name: 'login_otps',  columns: [], conflictCol: 'id', skip: true },
];

// Columns that may not exist in older schema versions — omit if missing.
const OPTIONAL_COLUMNS = new Set([
  'available_balance', 'pending_balance',   // accounts
  'is_deleted',                             // transactions
  'reset_token', 'reset_token_expiry',      // users
  'balance', 'last4',                       // cards
  'external_account_id',                    // accounts
]);

async function getExistingColumns(pool, tableName) {
  const { rows } = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = $1
  `, [tableName]);
  return new Set(rows.map(r => r.column_name));
}

// ── CHECK mode ────────────────────────────────────────────────────────────────
async function check() {
  hdr('SOURCE  — Local PostgreSQL (localhost)');
  await dbIdentity(localPool, 'LOCAL');

  hdr('DESTINATION — AWS RDS');
  await dbIdentity(rdsPool, 'RDS');

  hdr('ROW COUNTS');
  console.log(`  ${'TABLE'.padEnd(32)} ${'LOCAL'.padStart(8)} ${'RDS'.padStart(8)}`);
  console.log(`  ${sep('─', 32)} ${sep('─', 8)} ${sep('─', 8)}`);

  for (const t of TABLES) {
    const loc = await rowCount(localPool, t.name);
    const rds = await rowCount(rdsPool,   t.name);
    const locStr = loc === null ? 'N/A' : loc.toString();
    const rdsStr = rds === null ? 'N/A' : rds.toString();
    const flag   = loc !== null && rds !== null && loc > rds ? '  ← local has more' : '';
    console.log(`  ${t.name.padEnd(32)} ${locStr.padStart(8)} ${rdsStr.padStart(8)}${flag}`);
  }

  // Email overlap check
  hdr('EMAIL OVERLAP ANALYSIS');
  try {
    const { rows: localEmails } = await localPool.query(
      `SELECT LOWER(TRIM(email)) AS email FROM users ORDER BY email`
    );
    const { rows: rdsEmails } = await rdsPool.query(
      `SELECT LOWER(TRIM(email)) AS email FROM users ORDER BY email`
    );
    const rdsSet   = new Set(rdsEmails.map(r => r.email));
    const localSet = new Set(localEmails.map(r => r.email));

    const onlyLocal = localEmails.filter(r => !rdsSet.has(r.email));
    const onlyRds   = rdsEmails.filter(r => !localSet.has(r.email));
    const inBoth    = localEmails.filter(r => rdsSet.has(r.email));

    console.log(`  In both databases (will be skipped):   ${inBoth.length}`);
    console.log(`  Only in LOCAL (will be migrated):      ${onlyLocal.length}`);
    console.log(`  Only in RDS   (safe, won't be touched):${onlyRds.length}`);

    if (onlyLocal.length > 0) {
      console.log('\n  Accounts to migrate from local → RDS:');
      onlyLocal.forEach(r => console.log(`    ${r.email}`));
    }
    if (inBoth.length > 0) {
      console.log('\n  Accounts already in RDS (ON CONFLICT DO NOTHING):');
      inBoth.forEach(r => console.log(`    ${r.email}`));
    }
  } catch (err) {
    console.error('  Email overlap check failed:', err.message);
  }
}

// ── MIGRATE mode ──────────────────────────────────────────────────────────────
async function migrate(dryRun = false) {
  const mode = dryRun ? 'DRY RUN' : 'LIVE MIGRATION';
  hdr(`${mode} — Local → RDS`);

  if (dryRun) {
    console.log('  No writes will be made. Pass --migrate to apply.\n');
  }

  const results = {};

  for (const tableConfig of TABLES) {
    const { name, columns, conflictCol, skip } = tableConfig;

    if (skip) {
      console.log(`\n  SKIP  ${name}  (ephemeral — not worth migrating)`);
      continue;
    }

    console.log(`\n  TABLE ${name}`);

    // Determine which columns actually exist in BOTH databases
    const localCols = await getExistingColumns(localPool, name);
    const rdsCols   = await getExistingColumns(rdsPool,   name);

    const effectiveCols = columns.filter(col => {
      if (!localCols.has(col) && OPTIONAL_COLUMNS.has(col)) return false;
      if (!rdsCols.has(col)   && OPTIONAL_COLUMNS.has(col)) return false;
      return true;
    });

    // Fetch all rows from local
    let localRows;
    try {
      const { rows } = await localPool.query(
        `SELECT ${effectiveCols.join(', ')} FROM ${name} ORDER BY created_at`
      );
      localRows = rows;
    } catch (err) {
      console.log(`    ✗ Could not read local table: ${err.message}`);
      continue;
    }

    if (localRows.length === 0) {
      console.log(`    Local has 0 rows — nothing to migrate.`);
      results[name] = { total: 0, inserted: 0, skipped: 0, errors: 0 };
      continue;
    }

    console.log(`    Local rows: ${localRows.length}`);

    if (dryRun) {
      console.log(`    Would attempt INSERT ... ON CONFLICT (${conflictCol}) DO NOTHING`);
      console.log(`    Columns: ${effectiveCols.join(', ')}`);
      results[name] = { total: localRows.length, inserted: '?', skipped: '?', errors: 0 };
      continue;
    }

    // Insert into RDS with ON CONFLICT DO NOTHING
    const colList    = effectiveCols.join(', ');
    const placeholders = effectiveCols.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `
      INSERT INTO ${name} (${colList})
      VALUES (${placeholders})
      ON CONFLICT (${conflictCol}) DO NOTHING
    `;

    let inserted = 0;
    let skipped  = 0;
    let errors   = 0;

    for (const row of localRows) {
      const values = effectiveCols.map(col => row[col] ?? null);
      try {
        const result = await rdsPool.query(sql, values);
        if (result.rowCount > 0) {
          inserted++;
        } else {
          skipped++;
        }
      } catch (err) {
        errors++;
        // Email unique index conflict — different UUID, same email
        if (err.code === '23505') {
          console.log(`    ⚠  Unique conflict on row id=${row.id} (${row.email || ''}): ${err.detail}`);
          console.log(`       This row already exists with a different key in RDS — skipping.`);
        } else {
          console.error(`    ✗  Error on row id=${row.id}: ${err.message}`);
        }
      }
    }

    console.log(`    ✓ inserted=${inserted}  skipped(already existed)=${skipped}  errors=${errors}`);
    results[name] = { total: localRows.length, inserted, skipped, errors };
  }

  hdr('MIGRATION SUMMARY');
  console.log(`  ${'TABLE'.padEnd(32)} ${'TOTAL'.padStart(7)} ${'INSERT'.padStart(7)} ${'SKIP'.padStart(6)} ${'ERR'.padStart(5)}`);
  console.log(`  ${sep('─', 32)} ${sep('─', 7)} ${sep('─', 7)} ${sep('─', 6)} ${sep('─', 5)}`);
  for (const [name, r] of Object.entries(results)) {
    console.log(`  ${name.padEnd(32)} ${String(r.total).padStart(7)} ${String(r.inserted).padStart(7)} ${String(r.skipped).padStart(6)} ${String(r.errors).padStart(5)}`);
  }
}

// ── VERIFY mode ───────────────────────────────────────────────────────────────
async function verify() {
  hdr('POST-MIGRATION VERIFICATION');

  await dbIdentity(localPool, 'LOCAL');
  await dbIdentity(rdsPool,   'RDS');

  hdr('ROW COUNTS COMPARISON');
  console.log(`  ${'TABLE'.padEnd(32)} ${'LOCAL'.padStart(8)} ${'RDS'.padStart(8)} ${'STATUS'.padStart(12)}`);
  console.log(`  ${sep('─', 32)} ${sep('─', 8)} ${sep('─', 8)} ${sep('─', 12)}`);

  for (const t of TABLES) {
    const loc = await rowCount(localPool, t.name);
    const rds = await rowCount(rdsPool,   t.name);
    let status = '  ✓ OK';
    if (loc === null || rds === null) status = '  ? N/A';
    else if (rds < loc) status = `  ✗ RDS short by ${loc - rds}`;
    console.log(`  ${t.name.padEnd(32)} ${String(loc ?? 'N/A').padStart(8)} ${String(rds ?? 'N/A').padStart(8)} ${status}`);
  }

  hdr('BALANCE VERIFICATION');
  try {
    const { rows: lBal } = await localPool.query(
      `SELECT COUNT(*) AS accounts, SUM(balance)::numeric(15,2) AS total_balance FROM accounts`
    );
    const { rows: rBal } = await rdsPool.query(
      `SELECT COUNT(*) AS accounts, SUM(balance)::numeric(15,2) AS total_balance FROM accounts`
    );
    line('', 'LOCAL                    RDS');
    line('Accounts:', `${lBal[0].accounts}                      ${rBal[0].accounts}`);
    line('Total balance:', `${lBal[0].total_balance ?? 0}              ${rBal[0].total_balance ?? 0}`);
  } catch (err) {
    console.error('  Balance check failed:', err.message);
  }

  hdr('EMAIL VERIFICATION — accounts in local but NOT yet in RDS');
  try {
    const { rows: localUsers } = await localPool.query(
      `SELECT LOWER(TRIM(email)) AS email, full_name FROM users ORDER BY created_at`
    );
    const { rows: rdsUsers } = await rdsPool.query(
      `SELECT LOWER(TRIM(email)) AS email FROM users`
    );
    const rdsSet  = new Set(rdsUsers.map(r => r.email));
    const missing = localUsers.filter(r => !rdsSet.has(r.email));

    if (missing.length === 0) {
      console.log('  ✓ All local accounts are present in RDS.');
    } else {
      console.log(`  ✗ ${missing.length} local account(s) are MISSING from RDS:`);
      missing.forEach(r => console.log(`      ${r.email}  (${r.full_name})`));
      console.log('\n  Re-run:  node scripts/migrate-local-to-rds.js --migrate');
    }
  } catch (err) {
    console.error('  Email verification failed:', err.message);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const cmd = process.argv[2] || '--check';

  console.log('\n  CoreWallet — Local → RDS Migration Tool');
  console.log(`  Mode: ${cmd}`);
  console.log(`  Time: ${new Date().toUTCString()}`);

  try {
    // Quick connectivity test
    await Promise.all([
      localPool.query('SELECT 1').catch(e => { throw new Error(`Local DB unreachable: ${e.message}`); }),
      rdsPool.query('SELECT 1').catch(e => { throw new Error(`RDS unreachable: ${e.message}`); }),
    ]);
    console.log('\n  Both databases reachable ✓');

    if (cmd === '--check')    await check();
    else if (cmd === '--dry-run')  await migrate(true);
    else if (cmd === '--migrate')  await migrate(false);
    else if (cmd === '--verify')   await verify();
    else {
      console.error(`\n  Unknown command: ${cmd}`);
      console.error('  Usage: node scripts/migrate-local-to-rds.js [--check|--dry-run|--migrate|--verify]');
      process.exit(1);
    }
  } catch (err) {
    console.error('\n  FATAL:', err.message);
    if (err.message.includes('ECONNREFUSED') || err.message.includes('timeout')) {
      console.error('  Check DB_HOST, DB_PORT, and network/SSL settings.');
    }
    if (err.message.includes('password authentication')) {
      console.error('  Check DB_USER and DB_PASSWORD in .env');
    }
    process.exit(1);
  } finally {
    await localPool.end().catch(() => {});
    await rdsPool.end().catch(() => {});
  }
}

main();
