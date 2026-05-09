const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');

const userRepo    = require('../repositories/userRepository');
const accountRepo = require('../repositories/accountRepository');
const otpRepo     = require('../repositories/otpRepository');
const { withTransaction } = require('../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS, ACCOUNT } = require('../config/constants');
const AppError = require('../utils/AppError');
const { sendPasswordResetEmail, sendOtpEmail } = require('../utils/email');
const { notify } = require('./notificationService');

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const OTP_EXPIRY_MS         = 10 * 60 * 1000;  // 10 minutes
const MAX_OTP_ATTEMPTS      = 5;

const generateAccountNumber = () => {
  const digits = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `${ACCOUNT.NUMBER_PREFIX}${digits}`;
};

const generateToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// ── Register ──────────────────────────────────────────────────────────────────
const register = async ({ email, password, fullName, avatarColor }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new AppError('Email already registered', 409);

  const passwordHash  = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const accountNumber = generateAccountNumber();

  const result = await withTransaction(async (client) => {
    const user    = await userRepo.create({ email, passwordHash, fullName, avatarColor, role: 'user' }, client);
    const account = await accountRepo.create({ userId: user.id, accountNumber, currency: 'USD', initialBalance: 0 }, client);
    return { user, account };
  });

  const token = generateToken(result.user.id);
  return { user: sanitizeUser(result.user), account: sanitizeAccount(result.account), token };
};

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async ({ email, password }) => {
  const normEmail = (email || '').trim().toLowerCase();
  console.log(`[Login] lookup email="${normEmail}"`);

  const user = await userRepo.findByEmail(normEmail);
  console.log(`[Login] user found=${!!user}${user ? ` id=${user.id} active=${user.is_active}` : ''}`);

  if (!user) throw new AppError('Invalid email or password', 401);
  if (!user.is_active) throw new AppError('Account is suspended', 403);

  // Detect plain-text passwords — bcrypt hashes always start with $2b$ or $2a$.
  // If hash_is_bcrypt=false the stored value is plain text and compare will always fail.
  const hashIsBcrypt = typeof user.password_hash === 'string' &&
    (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$'));
  console.log(`[Login] hash_is_bcrypt=${hashIsBcrypt}`);

  let valid = false;
  if (hashIsBcrypt) {
    valid = await bcrypt.compare(password, user.password_hash);
  } else {
    valid = (password === user.password_hash);
    if (valid) {
      const newHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await userRepo.updatePassword(user.id, newHash);
      console.log(`[Login] upgraded plain-text password to bcrypt for ${user.email}`);
    }
  }
  console.log(`[Login] password match=${valid}`);

  if (!valid) {
    notify({
      userId:   user.id,
      type:     'login_failed',
      title:    'Failed login attempt',
      message:  'Someone tried to sign in to your account with an incorrect password. If this was not you, consider changing your password.',
      severity: 'warning',
      metadata: { email: user.email },
    });
    throw new AppError('Invalid email or password', 401);
  }

  const rawCode  = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = await bcrypt.hash(rawCode, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await otpRepo.create({ userId: user.id, email: user.email, codeHash, expiresAt, purpose: 'login' });

  // Always log the code in dev — this is the guaranteed fallback if email fails.
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[OTP] ${user.email}: ${rawCode}`);
  }

  // Fire-and-forget: do NOT await email sending.
  // SMTP can hang for seconds waiting for a server greeting or AUTH even when
  // the TCP connection succeeds. Awaiting it blocks the HTTP response and causes
  // the browser to time out. The OTP is already stored in the DB — the user can
  // always get it from the server log above if email fails.
  sendOtpEmail(user.email, rawCode)
    .then(() => console.log(`[OTP] Email delivered → ${user.email}`))
    .catch(err => {
      console.error(`[OTP] Email delivery failed for ${user.email}: ${err.message}`);
      console.error(`[OTP] Fallback code (dev only — check server logs): ${rawCode}`);
    });

  return { requiresOtp: true, userId: user.id };
};

// ── Verify OTP ────────────────────────────────────────────────────────────────
const verifyOtp = async ({ userId, code }) => {
  const otp = await otpRepo.findActive(userId, 'login');
  if (!otp) throw new AppError('OTP expired or not found. Please log in again.', 400);

  const attempts = await otpRepo.incrementAttempts(otp.id);
  if (attempts > MAX_OTP_ATTEMPTS) {
    throw new AppError('Too many incorrect attempts. Please log in again.', 429);
  }

  const match = await bcrypt.compare(code, otp.code_hash);
  if (!match) {
    const remaining = MAX_OTP_ATTEMPTS - attempts;
    if (remaining <= 0) throw new AppError('Too many incorrect attempts. Please log in again.', 429);
    throw new AppError(`Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`, 400);
  }

  await otpRepo.markUsed(otp.id);

  const user = await userRepo.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  if (!user.is_active) throw new AppError('Account is suspended', 403);

  await userRepo.updateLastLogin(user.id);
  const account = await accountRepo.findByUserId(user.id);
  const token   = generateToken(user.id);
  return { user: sanitizeUser(user), account: sanitizeAccount(account), token };
};

// ── Forgot password: generate reset token ─────────────────────────────────────
const forgotPassword = async ({ email }) => {
  const user = await userRepo.findByEmail(email);
  if (!user) return { sent: true }; // don't reveal whether email exists

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiry     = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
  await userRepo.setResetToken(user.id, resetToken, expiry);

  // IMPORTANT: the frontend reads ?token from the /login page URL (Login.jsx useSearchParams).
  // There is no separate /reset-password route — the token must land on /login.
  const resetUrl = `${process.env.CLIENT_ORIGIN || 'http://localhost:3000'}/login?token=${resetToken}`;

  // Always log — the URL is sent to the user anyway, and this is the fallback when email fails.
  console.log(`[Reset] token URL for ${user.email}: ${resetUrl}`);

  // Fire-and-forget — same reason as OTP email: don't let SMTP latency
  // block the HTTP response. The reset URL is already logged above.
  sendPasswordResetEmail(user.email, resetUrl)
    .then(() => console.log(`[Reset] Email delivered → ${user.email}`))
    .catch(err => {
      console.error(`[Reset] Email delivery failed for ${user.email}: ${err.message}`);
      console.error('[Reset] Use the URL logged above to reset the password manually.');
    });

  return { sent: true };
};

// ── Reset password: verify token, update password_hash ────────────────────────
const resetPassword = async ({ token, newPassword }) => {
  const user = await userRepo.findByResetToken(token);
  if (!user) throw new AppError('Invalid or expired reset token', 400);

  if (!user.reset_token_expiry || new Date(user.reset_token_expiry) < new Date()) {
    await userRepo.clearResetToken(user.id);
    throw new AppError('Reset token has expired. Please request a new one.', 400);
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await userRepo.updatePassword(user.id, newHash);
  await userRepo.clearResetToken(user.id);
};

// ── Change password (authenticated) ──────────────────────────────────────────
const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await userRepo.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const match = await bcrypt.compare(currentPassword, user.password_hash);
  if (!match) throw new AppError('Current password is incorrect', 400);

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await userRepo.updatePassword(userId, newHash);

  notify({
    userId,
    type:     'password_changed',
    title:    'Password changed',
    message:  'Your account password was updated successfully. If you did not make this change, contact support immediately.',
    severity: 'warning',
  });
};

// ── Change email (authenticated) ──────────────────────────────────────────────
const changeEmail = async ({ userId, newEmail }) => {
  const existing = await userRepo.findByEmail(newEmail);
  if (existing && existing.id !== userId) {
    throw new AppError('Email is already in use by another account', 409);
  }
  const updated = await userRepo.updateEmail(userId, newEmail);

  notify({
    userId,
    type:     'email_changed',
    title:    'Email address changed',
    message:  `Your login email was updated to ${newEmail}. If you did not make this change, contact support immediately.`,
    severity: 'warning',
    metadata: { newEmail },
  });

  return sanitizeUser(updated);
};

// ── Token helpers ─────────────────────────────────────────────────────────────
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
};

const sanitizeUser = (u) => ({
  id:          u.id,
  email:       u.email,
  fullName:    u.full_name,
  role:        u.role,
  avatarColor: u.avatar_color,
  createdAt:   u.created_at,
});

const sanitizeAccount = (a) => a ? ({
  id:            a.id,
  accountNumber: a.account_number,
  balance:       parseFloat(a.balance),
  currency:      a.currency,
  status:        a.status,
}) : null;

module.exports = {
  register, login, verifyOtp,
  forgotPassword, resetPassword,
  changePassword, changeEmail,
  verifyToken, generateToken, sanitizeUser, sanitizeAccount,
};
