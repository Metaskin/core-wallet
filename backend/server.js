// override: true forces .env values to win over any pre-existing system environment
// variables of the same name (e.g. NODE_ENV, PORT set globally on Windows).
require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: true });

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

if (!process.env.CLIENT_ORIGIN && process.env.NODE_ENV === 'production') {
  console.warn('[CORS] WARNING: CLIENT_ORIGIN is not set — all origins are allowed. Set it to your Amplify URL.');
}
app.use(cors({
  origin:  process.env.CLIENT_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/',       (req, res) => res.json({ status: 'success', message: 'CoreWallet API v2.0' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
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
  await runMigration('001_complete_schema_fix.sql');
  await runMigration('002_fix_email_case.sql');

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
  await testConnection();
  await runMigrations();

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

  app.listen(PORT, () => console.log(`[Server] CoreWallet API running on port ${PORT}`));
};

start().catch((err) => {
  console.error('[Server] Fatal startup error:', err.message);
  process.exit(1);
});
