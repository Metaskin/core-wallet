const settingsService = require('../services/settingsService');
const asyncHandler    = require('../utils/asyncHandler');

// ── Profile ───────────────────────────────────────────────────────────────────

const getProfile = asyncHandler(async (req, res) => {
  const data = await settingsService.getProfile(req.user.id);
  res.status(200).json({ status: 'success', data });
});

const updateProfile = asyncHandler(async (req, res) => {
  const data = await settingsService.updateProfile(req.user.id, req.body);
  res.status(200).json({ status: 'success', data });
});

// ── Notification preferences ──────────────────────────────────────────────────

const getNotifPrefs = asyncHandler(async (req, res) => {
  const data = await settingsService.getNotifPrefs(req.user.id);
  res.status(200).json({ status: 'success', data });
});

const updateNotifPrefs = asyncHandler(async (req, res) => {
  const data = await settingsService.updateNotifPrefs(req.user.id, req.body);
  res.status(200).json({ status: 'success', data });
});

// ── Security settings ─────────────────────────────────────────────────────────

const getSecuritySettings = asyncHandler(async (req, res) => {
  const data = await settingsService.getSecuritySettings(req.user.id);
  res.status(200).json({ status: 'success', data });
});

const updateSecuritySettings = asyncHandler(async (req, res) => {
  const data = await settingsService.updateSecuritySettings(req.user.id, req.body);
  res.status(200).json({ status: 'success', data });
});

// ── Sessions ──────────────────────────────────────────────────────────────────

const getActiveSessions = asyncHandler(async (req, res) => {
  const data = await settingsService.getActiveSessions(req.user.id);
  res.status(200).json({ status: 'success', data });
});

module.exports = {
  getProfile,
  updateProfile,
  getNotifPrefs,
  updateNotifPrefs,
  getSecuritySettings,
  updateSecuritySettings,
  getActiveSessions,
};
