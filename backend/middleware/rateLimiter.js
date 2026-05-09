const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 min

// Skip rate limiting entirely in test/development unless explicitly enabled.
// In production, limits are always enforced.
const isDev     = process.env.NODE_ENV !== 'production';
const skipInDev = (skip) => isDev && skip;

const general = rateLimit({
  windowMs,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many requests. Please slow down.' },
});

// Login: strict — brute-force protection (10 attempts per IP per 15 min in prod)
// Register: more generous — a developer legitimately creates many test accounts
const login = rateLimit({
  windowMs,
  max: isDev ? 1000 : parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '10'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many login attempts. Try again later.' },
});

const register = rateLimit({
  windowMs,
  max: isDev ? 1000 : parseInt(process.env.REGISTER_RATE_LIMIT_MAX || '20'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Registration limit reached. Try again later.' },
});

// Forgot/reset password: same generous limit in dev, tight in prod
const forgotPassword = rateLimit({
  windowMs,
  max: isDev ? 1000 : parseInt(process.env.FORGOT_RATE_LIMIT_MAX || '5'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many password reset requests. Try again later.' },
});

// Legacy alias — some routes still import { auth: authLimiter }
// Kept for backward compatibility; points to the login limiter.
const auth = login;

const transfer = rateLimit({
  windowMs,
  max: parseInt(process.env.TRANSFER_RATE_LIMIT_MAX || '20'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many transfer requests. Slow down.' },
  keyGenerator: (req) => req.user?.id || req.ip,
});

const cardReveal = rateLimit({
  windowMs,
  max: parseInt(process.env.CARD_REVEAL_RATE_LIMIT_MAX || '10'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many PIN attempts. Please wait 15 minutes.' },
  keyGenerator: (req) => `card-reveal:${req.user?.id || req.ip}`,
  skipSuccessfulRequests: false,
});

const otpVerify = rateLimit({
  windowMs,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many verification attempts. Try again in 15 minutes.' },
  keyGenerator: (req) => `otp-verify:${req.ip}:${(req.body?.email || '').toLowerCase()}`,
});

const otpResend = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Please wait 60 seconds before requesting a new code.' },
  keyGenerator: (req) => `otp-resend:${req.ip}:${(req.body?.email || '').toLowerCase()}`,
});

module.exports = { general, auth, login, register, forgotPassword, transfer, cardReveal, otpVerify, otpResend };
