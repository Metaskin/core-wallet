const router      = require('express').Router();
const controller  = require('../controllers/authController');
const { authenticate } = require('../middleware/authenticate');
const validate    = require('../middleware/validate');
const { login: loginLimiter, register: registerLimiter, forgotPassword: forgotLimiter } = require('../middleware/rateLimiter');
const validators  = require('../validators/authValidators');

// Each endpoint has its own rate limit tuned to its risk profile:
//   register     — generous (20/15 min prod, unlimited dev): devs create many test accounts
//   login        — strict   (10/15 min prod, unlimited dev): brute-force protection
//   forgot/reset — tight    (5/15 min prod, unlimited dev):  prevent email flooding

router.post('/register',        registerLimiter, validate(validators.register),       controller.register);
router.post('/login',           loginLimiter,    validate(validators.login),           controller.login);
router.post('/verify-otp',      loginLimiter,    validate(validators.verifyOtp),       controller.verifyOtp);
router.get('/me',               authenticate,                                          controller.me);

// ─── Account settings (authenticated) ────────────────────────────────────────
router.post('/change-password', authenticate,    validate(validators.changePassword),  controller.changePassword);
router.patch('/change-email',   authenticate,    validate(validators.changeEmail),     controller.changeEmail);

// ─── Forgot / reset password (public) ────────────────────────────────────────
router.post('/forgot-password', forgotLimiter,   validate(validators.forgotPassword),  controller.forgotPassword);
router.post('/reset-password',  forgotLimiter,   validate(validators.resetPassword),   controller.resetPassword);

module.exports = router;
