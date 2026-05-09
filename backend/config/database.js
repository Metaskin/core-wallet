const { Pool } = require('pg');

const isProd = process.env.NODE_ENV === 'production';

// SSL logic:
//   DB_SSL=true  → force SSL on  (RDS, any remote host)
//   DB_SSL=false → force SSL off (local postgres without SSL)
//   unset        → auto: SSL on in production, off in development
const sslEnabled = process.env.DB_SSL === 'true'  ? true
                 : process.env.DB_SSL === 'false' ? false
                 : isProd;
const sslConfig  = sslEnabled ? { rejectUnauthorized: false } : false;

// ── Connection source ─────────────────────────────────────────────────────────
// DATABASE_URL is ONLY used in production (Elastic Beanstalk sets it
// automatically when an RDS instance is attached to the environment).
//
// In development, individual DB_* vars from .env are ALWAYS used — even if a
// DATABASE_URL exists in the system environment. This prevents a stale
// DATABASE_URL left by an EB CLI session, Docker run, or Windows `setx` from
// silently connecting the backend to the wrong (often empty) database, which
// causes `user found=false` even though the row exists in the real RDS database.
const useDatabaseUrl = !!(process.env.DATABASE_URL && isProd);

// ── Startup diagnostics ───────────────────────────────────────────────────────
console.log(`[DB] SSL ${sslEnabled ? 'enabled' : 'disabled'} (NODE_ENV=${process.env.NODE_ENV}, DB_SSL=${process.env.DB_SSL ?? 'unset'})`);

if (process.env.DATABASE_URL && !isProd) {
  console.warn('[DB] WARNING: DATABASE_URL is set in the environment but NODE_ENV is not "production" — ignoring it. Using individual DB_* vars from .env. (This prevents a stale system-level DATABASE_URL from connecting to the wrong database.)');
}

if (useDatabaseUrl) {
  const safeUrl = (process.env.DATABASE_URL || '').replace(/:([^:@/]+)@/, ':***@');
  console.log(`[DB] Source: DATABASE_URL → ${safeUrl}`);
} else {
  const host = process.env.DB_HOST;
  if (!host) {
    console.warn('[DB] WARNING: DB_HOST is not set — defaulting to localhost. If your database is on RDS, set DB_HOST in .env.');
  }
  console.log(`[DB] Source: individual vars — host=${host || 'localhost (DEFAULT)'} port=${process.env.DB_PORT || '5432'} db=${process.env.DB_NAME || 'corewallet'} user=${process.env.DB_USER || 'postgres'}`);
}

const connectionConfig = useDatabaseUrl
  ? { connectionString: process.env.DATABASE_URL, ssl: sslConfig }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME     || 'corewallet',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl:      sslConfig,
    };

const pool = new Pool({
  ...connectionConfig,
  max:                     20,
  idleTimeoutMillis:       30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected idle client error:', err.message);
  process.exit(-1);
});

// ── Connection test ───────────────────────────────────────────────────────────
// Queries current_database() and inet_server_addr() so you can confirm the
// backend is talking to the correct host and schema — not just "some" postgres.
const testConnection = async () => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT current_database() AS db,
              current_user       AS usr,
              inet_server_addr() AS srv,
              inet_server_port() AS prt`
    );
    const r = rows[0];
    console.log(`[DB] Connected ✓  database="${r.db}" user="${r.usr}" server=${r.srv || '(SSL/socket — addr hidden)'}:${r.prt || '?'}`);
  } finally {
    client.release();
  }
};

// ── Transaction helper ────────────────────────────────────────────────────────
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, withTransaction, testConnection };
