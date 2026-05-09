const bcrypt       = require('bcryptjs');
const securityRepo = require('../repositories/securityRepository');
const AppError     = require('../utils/AppError');
const { BCRYPT_ROUNDS } = require('../config/constants');

const PIN_RE = /^\d{4,6}$/;

const setPin = async (userId, pin) => {
  const s = String(pin).trim();
  if (!PIN_RE.test(s)) throw new AppError('PIN must be 4 to 6 digits', 400);
  const pinHash = await bcrypt.hash(s, BCRYPT_ROUNDS);
  await securityRepo.upsert(userId, pinHash);
};

/** Throws 400 if no PIN is set, 401 if wrong PIN */
const verifyPin = async (userId, pin) => {
  const settings = await securityRepo.findByUserId(userId);
  if (!settings?.pin_hash) {
    throw new AppError('No PIN set. Go to Settings → Transaction PIN to create one.', 400);
  }
  const match = await bcrypt.compare(String(pin).trim(), settings.pin_hash);
  if (!match) throw new AppError('Incorrect PIN', 401);
  return true;
};

const hasPin = async (userId) => {
  const s = await securityRepo.findByUserId(userId);
  return !!(s?.pin_hash);
};

module.exports = { setPin, verifyPin, hasPin };
