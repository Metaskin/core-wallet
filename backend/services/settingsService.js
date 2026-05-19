const settingsRepo = require('../repositories/settingsRepository');
const userRepo     = require('../repositories/userRepository');
const AppError     = require('../utils/AppError');

// ── Profile ───────────────────────────────────────────────────────────────────

const getProfile = async (userId) => {
  let profile = await settingsRepo.findProfileByUserId(userId);
  if (!profile) {
    // Auto-create empty profile row so GET always returns something
    await settingsRepo.upsertProfile(userId, {});
    profile = await settingsRepo.findProfileByUserId(userId);
  }
  return profile;
};

const updateProfile = async (userId, fields) => {
  // Name fields live on the users table, not user_profiles
  const nameFields    = {};
  const profileFields = {};

  for (const [k, v] of Object.entries(fields)) {
    if (k === 'first_name' || k === 'last_name') nameFields[k]    = v;
    else                                           profileFields[k] = v;
  }

  if (nameFields.first_name || nameFields.last_name) {
    const sets  = Object.keys(nameFields).map((k, i) => `${k} = $${i + 2}`).join(', ');
    const vals  = Object.values(nameFields);
    const { pool } = require('../config/database');
    await pool.query(`UPDATE users SET ${sets} WHERE id = $1`, [userId, ...vals]);
  }

  const profile = await settingsRepo.upsertProfile(userId, profileFields);
  return profile;
};

// ── Notification preferences ──────────────────────────────────────────────────

const getNotifPrefs = async (userId) => {
  let prefs = await settingsRepo.findNotifPrefsByUserId(userId);
  if (!prefs) {
    await settingsRepo.upsertNotifPrefs(userId, {});
    prefs = await settingsRepo.findNotifPrefsByUserId(userId);
  }
  return prefs;
};

const updateNotifPrefs = async (userId, fields) => {
  return settingsRepo.upsertNotifPrefs(userId, fields);
};

// ── Security settings ─────────────────────────────────────────────────────────

const getSecuritySettings = async (userId) => {
  let settings = await settingsRepo.findSecuritySettingsByUserId(userId);
  if (!settings) {
    await settingsRepo.upsertSecuritySettings(userId, {});
    settings = await settingsRepo.findSecuritySettingsByUserId(userId);
  }
  return settings;
};

const updateSecuritySettings = async (userId, fields) => {
  return settingsRepo.upsertSecuritySettings(userId, fields);
};

// ── Sessions ──────────────────────────────────────────────────────────────────

const getActiveSessions = async (userId) => {
  return settingsRepo.findActiveSessions(userId);
};

module.exports = {
  getProfile,
  updateProfile,
  getNotifPrefs,
  updateNotifPrefs,
  getSecuritySettings,
  updateSecuritySettings,
  getActiveSessions,
};
