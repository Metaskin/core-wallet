const { pool } = require('../config/database');

// ── Profile ───────────────────────────────────────────────────────────────────

const findProfileByUserId = async (userId, client = pool) => {
  const { rows } = await client.query(
    `SELECT p.*, u.first_name, u.last_name, u.email
       FROM user_profiles p
       JOIN users u ON u.id = p.user_id
      WHERE p.user_id = $1`,
    [userId]
  );
  return rows[0] || null;
};

const upsertProfile = async (userId, fields, client = pool) => {
  const allowed = [
    'phone', 'date_of_birth', 'nationality', 'occupation', 'employer',
    'address_line1', 'address_line2', 'city', 'state', 'zip_code', 'country',
    'mailing_same_as_primary', 'mailing_address_line1', 'mailing_city',
    'mailing_state', 'mailing_zip_code', 'profile_photo_url',
    'preferred_language', 'timezone',
  ];
  const keys   = Object.keys(fields).filter(k => allowed.includes(k));
  const values = keys.map(k => fields[k]);

  if (!keys.length) return findProfileByUserId(userId, client);

  const setCols  = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const { rows } = await client.query(
    `INSERT INTO user_profiles (user_id, ${keys.join(', ')})
     VALUES ($1, ${keys.map((_, i) => `$${i + 2}`).join(', ')})
     ON CONFLICT (user_id) DO UPDATE SET ${setCols}, updated_at = NOW()
     RETURNING *`,
    [userId, ...values]
  );
  return rows[0];
};

// ── Notification preferences ──────────────────────────────────────────────────

const findNotifPrefsByUserId = async (userId, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM user_notification_preferences WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || null;
};

const upsertNotifPrefs = async (userId, fields, client = pool) => {
  const allowed = [
    'push_enabled', 'email_enabled', 'sms_enabled',
    'deposit_alerts', 'transaction_alerts', 'security_alerts',
    'weekly_summary', 'monthly_summary', 'marketing',
    'quiet_hours_enabled', 'quiet_hours_start', 'quiet_hours_end',
  ];
  const keys   = Object.keys(fields).filter(k => allowed.includes(k));
  const values = keys.map(k => fields[k]);

  if (!keys.length) return findNotifPrefsByUserId(userId, client);

  const setCols  = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const { rows } = await client.query(
    `INSERT INTO user_notification_preferences (user_id, ${keys.join(', ')})
     VALUES ($1, ${keys.map((_, i) => `$${i + 2}`).join(', ')})
     ON CONFLICT (user_id) DO UPDATE SET ${setCols}, updated_at = NOW()
     RETURNING *`,
    [userId, ...values]
  );
  return rows[0];
};

// ── Security settings ─────────────────────────────────────────────────────────

const findSecuritySettingsByUserId = async (userId, client = pool) => {
  const { rows } = await client.query(
    `SELECT * FROM user_security_settings WHERE user_id = $1`,
    [userId]
  );
  return rows[0] || null;
};

const upsertSecuritySettings = async (userId, fields, client = pool) => {
  const allowed = [
    'two_factor_enabled', 'two_factor_method',
    'auto_logout_minutes', 'biometric_enabled',
  ];
  const keys   = Object.keys(fields).filter(k => allowed.includes(k));
  const values = keys.map(k => fields[k]);

  if (!keys.length) return findSecuritySettingsByUserId(userId, client);

  const setCols  = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const { rows } = await client.query(
    `INSERT INTO user_security_settings (user_id, ${keys.join(', ')})
     VALUES ($1, ${keys.map((_, i) => `$${i + 2}`).join(', ')})
     ON CONFLICT (user_id) DO UPDATE SET ${setCols}, updated_at = NOW()
     RETURNING *`,
    [userId, ...values]
  );
  return rows[0];
};

// ── Active sessions (login_otps re-used as session log proxy) ─────────────────

const findActiveSessions = async (userId, client = pool) => {
  const { rows } = await client.query(
    `SELECT id, purpose, created_at, expires_at, attempts
       FROM login_otps
      WHERE user_id = $1
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 10`,
    [userId]
  );
  return rows;
};

module.exports = {
  findProfileByUserId,
  upsertProfile,
  findNotifPrefsByUserId,
  upsertNotifPrefs,
  findSecuritySettingsByUserId,
  upsertSecuritySettings,
  findActiveSessions,
};
