// Load .env in development only.
// In production (Render) environment variables are injected natively — dotenv is
// a no-op because .env is gitignored and never deployed.
// IMPORTANT: do NOT use override:true in production — if .env ever appeared on
// the Render disk it would overwrite Render's correct env vars (e.g. RESEND_API_KEY)
// with whatever stale values are in the file.
const _dotenvPath = require('path').join(__dirname, '.env');
require('dotenv').config({ path: _dotenvPath });

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const fs           = require('fs');
const path         = require('path');

const { testConnection, pool } = require('./config/database');
const { general: limiter }     = require('./middleware/rateLimiter');
const errorHandler             = require('./middleware/errorHandler');
const AppError                 = require('./utils/AppError');

const app = express();

// Trust the first hop from AWS ALB/ELB so req.ip reflects the real client IP.
app.set('trust proxy', 1);

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet());

// CLIENT_ORIGIN accepts a comma-separated list of allowed origins, e.g.:
//   https://mctbank.online,https://www.mctbank.online,http://localhost,http://localhost:5173
// Capacitor Android (androidScheme:"http") sends Origin: http://localhost — include that.
// DO NOT include https://localhost — Capacitor is configured to use http scheme.
// When unset in development, all origins are allowed.
const _allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',').map(o => o.trim()).filter(Boolean);

if (!_allowedOrigins.length && process.env.NODE_ENV === 'production') {
  console.warn('[CORS] WARNING: CLIENT_ORIGIN is not set — all origins are allowed. Set it to your frontend domains.');
} else if (_allowedOrigins.length) {
  console.log('[CORS] allowed origins:', _allowedOrigins.join(', '));
}

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no Origin header (Postman, curl, server-to-server, some native apps).
    if (!origin) return cb(null, true);
    // No whitelist configured → allow all (development mode).
    if (!_allowedOrigins.length) return cb(null, true);
    if (_allowedOrigins.includes(origin)) return cb(null, true);
    console.warn(`[CORS] blocked origin: "${origin}"`);
    cb(new Error(`CORS: origin "${origin}" is not allowed`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/',       (req, res) => res.json({ status: 'success', message: 'MCT Bank API v2.0' }));
app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// Email health check — validates EmailJS config (service ID, public key, template ID).
// Returns 200 if config is complete, 503 if a required env var is missing.
app.get('/health/email', async (req, res) => {
  try {
    const { checkEmailHealth } = require('./utils/email');
    const result = await checkEmailHealth();
    res.status(result.ok ? 200 : 503).json({ status: result.ok ? 'ok' : 'error', ...result });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.use('/api', require('./routes/index'));

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res, next) => next(new AppError(`Route ${req.originalUrl} not found`, 404)));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Migrations ───────────────────────────────────────────────────────────────
const runMigration = async (filename) => {
  const file = path.join(__dirname, 'migrations', filename);
  if (!fs.existsSync(file)) {
    console.warn(`[Migrate] ${filename} not found — skipping`);
    return;
  }
  const sql    = fs.readFileSync(file, 'utf8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log(`[Migrate] ${filename} — OK`);
  } catch (err) {
    console.error(`[Migrate] ${filename} failed:\n  ${err.message}`);
  } finally {
    client.release();
  }
};

const runMigrations = async () => {
  // Run base schema first — creates all core tables on a fresh database.
  // All statements use CREATE TABLE IF NOT EXISTS so this is safe to run on
  // every startup; existing tables and data are never touched.
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const client = await pool.connect();
    try {
      await client.query(fs.readFileSync(schemaPath, 'utf8'));
      console.log('[Migrate] schema.sql — OK');
    } catch (err) {
      console.error(`[Migrate] schema.sql failed:\n  ${err.message}`);
    } finally {
      client.release();
    }
  } else {
    console.warn('[Migrate] schema.sql not found — skipping base schema');
  }

  await runMigration('001_complete_schema_fix.sql');
  await runMigration('002_fix_email_case.sql');
  await runMigration('003_fix_cvv_hash.sql');
  await runMigration('004_notifications.sql');
  await runMigration('005_checking_savings.sql');
  await runMigration('008_banking_services.sql');
  await runMigration('009_fixes_and_settings.sql');
  await runMigration('010_transaction_seed_fix.sql');
  await runMigration('011_force_seed_transactions.sql');

  // Phase 3: column patches outside migration transactions
  const client = await pool.connect();
  try {
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE login_otps ADD COLUMN IF NOT EXISTS purpose   VARCHAR(20) NOT NULL DEFAULT 'login';
        ALTER TABLE login_otps ADD COLUMN IF NOT EXISTS attempts  SMALLINT    NOT NULL DEFAULT 0;
      EXCEPTION WHEN others THEN NULL;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE login_otps ALTER COLUMN code_hash TYPE VARCHAR(255);
      EXCEPTION WHEN others THEN NULL;
      END $$;
    `);
  } catch (err) {
    console.warn('[Migrate] Column patch skipped:', err.message);
  } finally {
    client.release();
  }
};

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5001');

const start = async () => {
  if (process.env.NODE_ENV === 'production') {
    const { JWT_SECRET } = require('./config/constants');
    if (JWT_SECRET === 'corewallet_dev_secret_change_in_prod') {
      console.warn('[Security] WARNING: JWT_SECRET is using the dev default. Set a strong random value on Render!');
    }
    if (!process.env.CARD_ENCRYPTION_KEY) {
      console.warn('[Security] WARNING: CARD_ENCRYPTION_KEY is not set. Card creation and decryption will fail in production.');
    }
  }

  await testConnection();
  await runMigrations();

  // Validate email service — logs key preview, domain status, and sender address.
  // Does NOT block startup; email failure never kills the server.
  try {
    const { validateEmailService } = require('./utils/email');
    await validateEmailService();
  } catch (err) {
    console.error('[Email] Startup validation threw unexpectedly:', err.message);
  }

  // ── Startup diagnostic ─────────────────────────────────────────────────────
  // Runs after migrations. Proves which database the backend is actually
  // connected to and lists stored emails so you can compare with pgAdmin.
  // If current_database ≠ "corewallet", or emails listed differ from pgAdmin,
  // the backend is pointed at the wrong database — check DB_HOST in .env.
  try {
    const { rows: info } = await pool.query(`
      SELECT current_database() AS db,
             current_user       AS usr,
             inet_server_addr() AS srv,
             inet_server_port() AS prt,
             (SELECT COUNT(*)::int FROM users) AS total_users
    `);
    const d = info[0];
    const connSource = process.env.DATABASE_URL && process.env.NODE_ENV === 'production'
      ? `DATABASE_URL`
      : `DB_HOST=${process.env.DB_HOST || 'localhost'}`;
    console.log(`[DB] conn_source=${connSource}`);
    console.log(`[DB] current_database=${d.db}  current_user=${d.usr}  server=${d.srv || '(SSL — addr hidden)'}  port=${d.prt || '?'}`);
    console.log(`[DB] users table: ${d.total_users} row(s)${d.total_users === 0 ? ' ← NO USERS — account was never created in this database' : ' ✓'}`);

    if (d.total_users > 0) {
      const { rows: emails } = await pool.query(
        "SELECT LOWER(TRIM(email)) AS email FROM users ORDER BY created_at DESC LIMIT 5"
      );
      console.log('[DB] Stored emails (newest first):');
      emails.forEach((r, i) => console.log(`[DB]   [${i + 1}] ${r.email}`));
    }
  } catch (e) {
    console.warn('[DB] Startup diagnostic failed:', e.message);
  }

  // ── Seeded-transaction diagnostic ─────────────────────────────────────────
  // Runs after all migrations.  Confirms the 4 required transactions are
  // present AND linked to the correct account.  Shows a clear warning if not.
  try {
    const SEED_REFS = ['ATM-FAIL-2025-001','ATM-FAIL-2025-002','ATM-FAIL-2025-003','WR-EXT-2025-000001'];
    const { rows: txRows } = await pool.query(
      `SELECT t.reference, t.status, t.type,
              (t.sender_account_id IS NOT NULL)   AS has_sender,
              (t.receiver_account_id IS NOT NULL) AS has_receiver
       FROM transactions t
       WHERE t.reference = ANY($1::text[])`,
      [SEED_REFS]
    );
    const found = new Set(txRows.map(r => r.reference));
    const missing = SEED_REFS.filter(r => !found.has(r));
    if (missing.length) {
      console.warn(`[Seed] WARNING — ${missing.length} seeded transaction(s) missing: ${missing.join(', ')}`);
      const { rows: accts } = await pool.query(
        `SELECT a.account_type FROM accounts a JOIN users u ON u.id = a.user_id
         WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'`
      );
      if (!accts.length) {
        console.warn('[Seed] Root cause: user smmy23538@gmail.com has NO accounts in this DB — register first');
      } else {
        console.warn(`[Seed] User accounts: ${accts.map(a => a.account_type).join(', ')} — check migration logs above for errors`);
      }
    } else {
      const bad = txRows.filter(r => !r.has_sender && !r.has_receiver);
      if (bad.length) {
        console.warn(`[Seed] WARNING — ${bad.length} transaction(s) have NULL account IDs (orphaned): ${bad.map(r=>r.reference).join(', ')}`);
      } else {
        console.log(`[Seed] All 4 seeded transactions confirmed ✓  (${txRows.map(r=>`${r.reference.split('-').slice(-2).join('-')}:${r.status}`).join('  ')})`);
      }
    }
  } catch (e) {
    console.warn('[Seed] Transaction diagnostic error:', e.message);
  }

  app.listen(PORT, () => console.log(`[Server] CoreWallet API running on port ${PORT}`));
};

start().catch((err) => {
  console.error('[Server] Fatal startup error:', err.message);
  process.exit(1);
});
