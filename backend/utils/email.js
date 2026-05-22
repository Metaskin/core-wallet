'use strict';

/**
 * MCT Bank — EmailJS email service (Node.js / server-side)
 *
 * All transactional email goes through @emailjs/nodejs.
 * Templates are defined in the EmailJS dashboard; this module only
 * passes template variables and handles retries.
 *
 * Required env vars (set in .env / Render dashboard):
 *   EMAILJS_SERVICE_ID   — from EmailJS › Email Services
 *   EMAILJS_PUBLIC_KEY   — from EmailJS › Account › API Keys
 *   EMAILJS_PRIVATE_KEY  — from EmailJS › Account › API Keys (server-side, optional but recommended)
 *   EMAILJS_TEMPLATE_ID  — default template (used for OTP + fallback for other types)
 *
 * Optional per-type template overrides:
 *   EMAILJS_TEMPLATE_WELCOME
 *   EMAILJS_TEMPLATE_RESET
 *   EMAILJS_TEMPLATE_TRANSACTION
 *   EMAILJS_TEMPLATE_LOGIN_ALERT
 *
 * Template variables expected by each email type are documented on each
 * send function below — configure the matching placeholders in the
 * EmailJS dashboard template editor.
 *
 * Auth flows MUST use fire-and-forget (.catch) — never await these in a
 * request handler that must respond quickly.
 */

const emailjs = require('@emailjs/nodejs');

// ── Helpers ───────────────────────────────────────────────────────────────────

const isEnabled = () => process.env.ENABLE_EMAIL === 'true';

function getConfig() {
  return {
    serviceId:  process.env.EMAILJS_SERVICE_ID,
    publicKey:  process.env.EMAILJS_PUBLIC_KEY,
    privateKey: process.env.EMAILJS_PRIVATE_KEY || undefined,
    templates: {
      // OTP uses the primary template — required.
      otp: process.env.EMAILJS_TEMPLATE_ID,
      // Other types need their own templates set via optional env vars.
      // If not configured they are skipped (logged, never throw).
      welcome:     process.env.EMAILJS_TEMPLATE_WELCOME      || null,
      reset:       process.env.EMAILJS_TEMPLATE_RESET        || null,
      transaction: process.env.EMAILJS_TEMPLATE_TRANSACTION  || null,
      loginAlert:  process.env.EMAILJS_TEMPLATE_LOGIN_ALERT  || null,
    },
  };
}

// ── Health / startup validation ───────────────────────────────────────────────

async function checkEmailHealth() {
  const cfg = getConfig();

  if (!cfg.serviceId) {
    return { ok: false, error: 'EMAILJS_SERVICE_ID is not set', hint: 'Add it to your Render environment variables.' };
  }
  if (!cfg.publicKey) {
    return { ok: false, error: 'EMAILJS_PUBLIC_KEY is not set', hint: 'Copy it from EmailJS › Account › API Keys.' };
  }
  if (!cfg.templates.otp) {
    return { ok: false, error: 'EMAILJS_TEMPLATE_ID is not set', hint: 'Create a template in EmailJS dashboard and paste its ID here.' };
  }

  return {
    ok:           true,
    service:      cfg.serviceId,
    templateOtp:  cfg.templates.otp,
    publicKey:    `…${cfg.publicKey.slice(-6)}`,
    privateKey:   cfg.privateKey ? 'set' : 'not set (optional)',
    enabled:      isEnabled(),
    env:          process.env.NODE_ENV,
  };
}

async function validateEmailService() {
  const cfg = getConfig();

  console.log('[Email] ── EmailJS service diagnostics ──────────────────────');
  console.log(`[Email] enabled           : ${process.env.ENABLE_EMAIL}`);
  console.log(`[Email] NODE_ENV          : ${process.env.NODE_ENV}`);

  if (!cfg.serviceId)  { console.warn('[Email] EMAILJS_SERVICE_ID  : NOT SET'); }
  else                  { console.log(`[Email] EMAILJS_SERVICE_ID  : ${cfg.serviceId}`); }

  if (!cfg.publicKey)  { console.warn('[Email] EMAILJS_PUBLIC_KEY  : NOT SET'); }
  else                  { console.log(`[Email] EMAILJS_PUBLIC_KEY  : …${cfg.publicKey.slice(-6)}`); }

  console.log(`[Email] EMAILJS_PRIVATE_KEY : ${cfg.privateKey ? 'set' : 'not set (optional)'}`);

  if (!cfg.templates.otp) { console.warn('[Email] EMAILJS_TEMPLATE_ID : NOT SET — OTP email will not send'); }
  else                     { console.log(`[Email] EMAILJS_TEMPLATE_ID : ${cfg.templates.otp}`); }

  const ready = cfg.serviceId && cfg.publicKey && cfg.templates.otp && isEnabled();
  console.log(`[Email] status            : ${ready ? 'READY' : 'DEGRADED — check missing vars above'}`);
  console.log('[Email] ─────────────────────────────────────────────────────');
}

// ── Retry dispatcher ──────────────────────────────────────────────────────────

const MAX_ATTEMPTS  = 3;
const BASE_DELAY_MS = 600; // 600 → 1 200 → 2 400 ms

async function dispatch(templateId, templateParams) {
  if (!isEnabled()) {
    console.log(`[Email] disabled — skipped template="${templateId}" to="${templateParams.to_email}"`);
    return null;
  }

  const cfg = getConfig();
  if (!cfg.serviceId || !cfg.publicKey || !templateId) {
    console.warn('[Email] missing config — skipped (need EMAILJS_SERVICE_ID, EMAILJS_PUBLIC_KEY, template ID)');
    return null;
  }

  const options = { publicKey: cfg.publicKey };
  if (cfg.privateKey) options.privateKey = cfg.privateKey;

  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[Email] attempt ${attempt}/${MAX_ATTEMPTS} — template="${templateId}" to="${templateParams.to_email}"`);

      const result = await emailjs.send(cfg.serviceId, templateId, templateParams, options);

      console.log(`[Email] ✓ delivered status=${result.status} to="${templateParams.to_email}"`);
      return result;
    } catch (err) {
      lastErr = err;
      const isLast = attempt === MAX_ATTEMPTS;
      const msg = err?.text || err?.message || String(err);
      console.error(`[Email] ✗ attempt ${attempt}/${MAX_ATTEMPTS} failed: ${msg}${isLast ? ' — no more retries' : ''}`);

      if (!isLast) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`[Email] retrying in ${delay}ms…`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  throw lastErr;
}

// ── 1. OTP / Login verification ───────────────────────────────────────────────
// EmailJS template variables (must match placeholders in the dashboard template):
//   {{to_email}} — recipient address — set the "To Email" field in the template to {{to_email}}
//   {{to_name}}  — recipient's full name (falls back to email)
//   {{otp}}      — 6-digit verification code
//   {{time}}     — expiry window "15 minutes"

async function sendOtpEmail(to, code, name) {
  return dispatch(getConfig().templates.otp, {
    to_email: to,
    to_name:  name || to,
    otp:      code,
    time:     '15 minutes',
  });
}

// ── 2. Login security alert ───────────────────────────────────────────────────
// Dashboard template variables:
//   {{to_email}}, {{to_name}}, {{login_time}}, {{login_ip}}, {{login_device}}

async function sendLoginAlertEmail(to, { name, ip, device, time }) {
  return dispatch(getConfig().templates.loginAlert, {
    to_email:     to,
    to_name:      name || to,
    login_time:   new Date(time).toUTCString(),
    login_ip:     ip || 'Unknown',
    login_device: device ? (device.length > 120 ? device.slice(0, 120) + '…' : device) : 'Unknown device',
  });
}

// ── 3. Password reset ─────────────────────────────────────────────────────────
// Dashboard template variables:
//   {{to_email}}, {{reset_url}}

async function sendPasswordResetEmail(to, resetUrl) {
  return dispatch(getConfig().templates.reset, {
    to_email:  to,
    reset_url: resetUrl,
  });
}

// ── 4. Welcome (new account) ──────────────────────────────────────────────────
// Dashboard template variables:
//   {{to_email}}, {{to_name}}, {{account_last4}}, {{routing_number}}

async function sendWelcomeEmail(to, { name, accountNumber, routingNumber }) {
  return dispatch(getConfig().templates.welcome, {
    to_email:       to,
    to_name:        name ? name.split(' ')[0] : to,
    account_last4:  accountNumber ? String(accountNumber).slice(-4) : '—',
    routing_number: routingNumber || '—',
  });
}

// ── 5. Transaction notification ───────────────────────────────────────────────
// Dashboard template variables:
//   {{to_email}}, {{to_name}}, {{direction}}, {{amount}}, {{transaction_type}},
//   {{counterparty}}, {{new_balance}}, {{reference}}

async function sendTransactionEmail(to, { name, type, amount, currency, direction, counterparty, balance, reference }) {
  const cur      = currency || 'USD';
  const amt      = parseFloat(amount || 0).toFixed(2);
  const isCredit = direction === 'credit';

  return dispatch(getConfig().templates.transaction, {
    to_email:         to,
    to_name:          name ? name.split(' ')[0] : to,
    direction:        isCredit ? 'received' : 'sent',
    amount:           `${isCredit ? '+' : '-'}${amt} ${cur}`,
    transaction_type: type === 'transfer' ? 'Transfer' : type === 'credit' ? 'Deposit' : 'Payment',
    counterparty:     counterparty || '—',
    new_balance:      balance != null ? `${parseFloat(balance).toFixed(2)} ${cur}` : '—',
    reference:        reference || '—',
  });
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  sendOtpEmail,
  sendLoginAlertEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendTransactionEmail,
  checkEmailHealth,
  validateEmailService,
};
