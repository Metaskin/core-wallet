const Joi = require('joi');

// ── Email rule ─────────────────────────────────────────────────────────────
// .email({ tlds: { allow: true } }) checks that the TLD is in the IANA list,
// catching obvious fakes like "user@test.fake" or "user@x.y" with unknown TLDs.
// It still won't ping a mail server (that would require a live DNS lookup),
// but it rejects syntactically valid but obviously bogus addresses.
const emailRule = Joi.string()
  .email({ tlds: { allow: true } })   // validates TLD against IANA registry
  .trim()
  .lowercase()
  .max(254)                            // RFC 5321 maximum email length
  .required();

const register = Joi.object({
  email:       emailRule,
  password:    Joi.string().min(8).max(72).required()
                 .messages({
                   'string.min': 'Password must be at least 8 characters',
                   'string.max': 'Password must be no longer than 72 characters',
                 }),
  fullName:    Joi.string().trim().min(2).max(100).required()
                 .messages({ 'string.min': 'Full name must be at least 2 characters' }),
  avatarColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
});

const login = Joi.object({
  email:    emailRule,
  password: Joi.string().required(),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     Joi.string().min(8).max(72).required()
                     .messages({ 'string.min': 'New password must be at least 8 characters' }),
});

const changeEmail = Joi.object({
  newEmail: emailRule,
});

const forgotPassword = Joi.object({
  email: emailRule,
});

const resetPassword = Joi.object({
  token:       Joi.string().length(64).hex().required()
                 .messages({ 'string.length': 'Invalid reset token', 'string.hex': 'Invalid reset token' }),
  newPassword: Joi.string().min(8).max(72).required()
                 .messages({ 'string.min': 'Password must be at least 8 characters' }),
});

const verifyOtp = Joi.object({
  userId: Joi.string().uuid().required(),
  code:   Joi.string().length(6).pattern(/^\d{6}$/).required()
             .messages({ 'string.length': 'Code must be 6 digits', 'string.pattern.base': 'Code must be 6 digits' }),
});

module.exports = { register, login, verifyOtp, changePassword, changeEmail, forgotPassword, resetPassword };
