'use strict';

/**
 * MCT Bank — Resend email service
 *
 * Single source of truth for all transactional email.
 * Resend is the only transport — SMTP/nodemailer removed.
 *
 * Sender routing:
 *   security@mctbank.online  — OTP, login alerts, password reset
 *   support@mctbank.online   — welcome, account notices
 *   noreply@mctbank.online   — transaction alerts
 *
 * All public functions are fire-and-forget safe:
 *   sendOtpEmail(...).catch(err => console.error(err))
 *
 * Auth flows MUST NOT await these functions — SMTP latency can stall
 * login responses by 5-10 s. Call them fire-and-forget.
 */

const { Resend } = require('resend');

// ── Senders ───────────────────────────────────────────────────────────────────

const FROM = {
  security: 'MCT Bank Security <security@mctbank.online>',
  support:  'MCT Bank <support@mctbank.online>',
  noreply:  'MCT Bank <noreply@mctbank.online>',
};

// ── Client initialisation ─────────────────────────────────────────────────────

let _client = null;

(function init() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('[Email] RESEND_API_KEY not set — email delivery disabled.');
    return;
  }
  try {
    _client = new Resend(key);
    console.log(`[Email] Resend client ready (key …${key.slice(-6)})`);
  } catch (err) {
    console.error('[Email] Resend init error:', err.message);
  }
})();

const isEnabled = () => process.env.ENABLE_EMAIL === 'true';

// ── Retry dispatcher ──────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 600; // doubles on each retry: 600 → 1 200 → 2 400 ms

async function dispatch({ from, to, subject, html, text }) {
  if (!isEnabled()) {
    console.log(`[Email] disabled — skipped "${subject}" → ${to}`);
    return null;
  }
  if (!_client) {
    console.warn(`[Email] no Resend client — skipped "${subject}" → ${to}`);
    return null;
  }

  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await _client.emails.send({
        from, to: [to], subject, html, text,
      });
      if (error) throw new Error(error.message || JSON.stringify(error));
      console.log(`[Email] ✓ delivered id=${data?.id} subject="${subject}" to=${to}`);
      return data;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_ATTEMPTS) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`[Email] attempt ${attempt}/${MAX_ATTEMPTS} failed (${err.message}) — retry in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  // All retries exhausted — log clearly but never throw into auth flows.
  // Callers use .catch(err => console.error(...)) so this is surface-safe.
  console.error(`[Email] ✗ all ${MAX_ATTEMPTS} attempts failed — "${subject}" → ${to}: ${lastErr?.message}`);
  throw lastErr;
}

// ── HTML layout ───────────────────────────────────────────────────────────────
// Dark, premium banking theme. Logo SVG inlined — zero external image requests.
// Mobile-first with @media breakpoints.

const LOGO_SVG = `<svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="10" fill="#003087"/>
  <path d="M7 19 L20 9 L33 19" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="8"  y="21" width="5" height="12" rx="1" fill="white" opacity="0.6"/>
  <rect x="17" y="17" width="6" height="16" rx="1" fill="white"/>
  <rect x="27" y="19" width="5" height="14" rx="1" fill="white" opacity="0.6"/>
</svg>`;

function layout(bodyHtml, { footerNote = '' } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html,body{background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
    .outer{padding:40px 16px 64px;background:#09090b}
    .card{max-width:520px;margin:0 auto;background:#111112;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);box-shadow:0 24px 64px rgba(0,0,0,0.6)}
    /* Header */
    .hdr{background:linear-gradient(145deg,#001540 0%,#003087 60%,#0042b5 100%);padding:36px 32px 32px;text-align:center}
    .hdr-name{color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.4px;margin-top:14px;line-height:1}
    .hdr-sub{color:rgba(255,255,255,0.40);font-size:10px;letter-spacing:1.8px;text-transform:uppercase;margin-top:5px}
    /* Body */
    .bdy{padding:36px 32px}
    /* Typography */
    .eyebrow{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.6px;color:#93b4e0;margin-bottom:10px}
    .h1{font-size:22px;font-weight:800;letter-spacing:-0.4px;color:#fff;line-height:1.25;margin-bottom:14px}
    .para{font-size:14px;line-height:1.75;color:rgba(255,255,255,0.50);margin-bottom:20px}
    /* Detail table */
    .detail-box{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:4px 16px;margin-bottom:24px}
    .dr{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
    .dr:last-child{border-bottom:none}
    .dl{color:rgba(255,255,255,0.32);font-size:12px;font-weight:500;white-space:nowrap;padding-right:12px}
    .dv{color:rgba(255,255,255,0.78);font-size:12px;font-family:'Courier New',Courier,monospace;text-align:right;word-break:break-all;max-width:68%}
    /* OTP */
    .otp-wrap{text-align:center;margin:28px 0}
    .otp-box{display:inline-block;background:rgba(0,48,135,0.14);border:1.5px solid rgba(0,48,135,0.40);border-radius:16px;padding:24px 44px}
    .otp-code{font-size:46px;font-weight:900;letter-spacing:16px;color:#7ab0e0;font-family:'Courier New',Courier,monospace;display:block;line-height:1}
    /* Button */
    .btn-wrap{text-align:center;margin:24px 0}
    .btn{display:inline-block;background:#003087;color:#fff !important;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:-0.2px}
    /* Banners */
    .banner{border-radius:10px;padding:14px 16px;font-size:12px;line-height:1.70;margin-bottom:16px}
    .b-info{background:rgba(0,48,135,0.09);border:1px solid rgba(0,48,135,0.28);color:#93b4e0}
    .b-warn{background:rgba(234,179,8,0.06);border:1px solid rgba(234,179,8,0.22);color:#fbbf24}
    .b-danger{background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.18);color:rgba(255,255,255,0.50)}
    /* Amount */
    .amt{display:block;text-align:center;font-family:'Courier New',Courier,monospace;font-weight:900;letter-spacing:-1px;margin:24px 0}
    .amt-credit{font-size:34px;color:#4ade80}
    .amt-debit{font-size:34px;color:rgba(255,255,255,0.78)}
    /* Welcome steps */
    .step-wrap{background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:4px 16px;margin-bottom:24px}
    .step{display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
    .step:last-child{border-bottom:none}
    .step-n{flex-shrink:0;width:26px;height:26px;border-radius:50%;background:#003087;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;margin-top:1px}
    .step-t{font-size:13px;line-height:1.65;color:rgba(255,255,255,0.50)}
    .step-t strong{color:rgba(255,255,255,0.85)}
    /* Divider */
    .divider{border:none;border-top:1px solid rgba(255,255,255,0.06);margin:24px 0}
    /* Footer */
    .ftr{border-top:1px solid rgba(255,255,255,0.05);padding:22px 32px;text-align:center}
    .ftr p{color:rgba(255,255,255,0.18);font-size:11px;line-height:1.75}
    .ftr a{color:rgba(255,255,255,0.32);text-decoration:none}
    /* Responsive */
    @media(max-width:580px){
      .bdy,.hdr{padding:28px 20px}
      .h1{font-size:20px}
      .otp-code{font-size:38px;letter-spacing:12px}
      .otp-box{padding:20px 28px}
      .btn{padding:13px 24px;font-size:14px}
      .amt-credit,.amt-debit{font-size:28px}
    }
  </style>
</head>
<body>
  <div class="outer">
    <div class="card">
      <div class="hdr">
        ${LOGO_SVG}
        <div class="hdr-name">MCT Bank</div>
        <div class="hdr-sub">Metropolitan Capital &amp; Trust</div>
      </div>
      <div class="bdy">
        ${bodyHtml}
      </div>
      <div class="ftr">
        <p>© 2024 Metropolitan Capital &amp; Trust Bank &nbsp;·&nbsp; Member FDIC<br>
        ${footerNote ? `${footerNote}<br>` : ''}
        Need help? <a href="mailto:support@mctbank.online">support@mctbank.online</a>
        &nbsp;·&nbsp; 1-800-MCT-BANK</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── 1. OTP / Login verification ───────────────────────────────────────────────

async function sendOtpEmail(to, code) {
  const html = layout(`
    <p class="eyebrow">Login Verification</p>
    <h1 class="h1">Your one-time code</h1>
    <p class="para">Use the code below to complete your MCT Bank sign-in. It expires in <strong style="color:#fff">10 minutes</strong> and can only be used once.</p>
    <div class="otp-wrap">
      <div class="otp-box">
        <span class="otp-code">${code}</span>
      </div>
    </div>
    <div class="banner b-warn">⏱ This code expires in <strong>10 minutes</strong>. Start a new login if it has expired.</div>
    <div class="banner b-danger">🔒 <strong style="color:#fff">Security notice:</strong> Never share this code with anyone — including MCT Bank staff. We will never ask for your OTP by phone, chat, or email.</div>
  `, { footerNote: 'This is an automated security message. Do not reply to this email.' });

  const text = [
    'MCT Bank — Login Verification Code',
    '',
    `Your one-time sign-in code: ${code}`,
    '',
    'This code expires in 10 minutes.',
    'Never share this code with anyone, including MCT Bank staff.',
    'If you did not attempt to sign in, you can safely ignore this email.',
  ].join('\n');

  return dispatch({ from: FROM.security, to, subject: 'Your MCT Bank verification code', html, text });
}

// ── 2. Login security alert ───────────────────────────────────────────────────

async function sendLoginAlertEmail(to, { name, ip, device, time }) {
  const firstName   = name ? name.split(' ')[0] : 'there';
  const displayTime = new Date(time).toUTCString();
  const shortDevice = device
    ? (device.length > 85 ? device.substring(0, 85) + '…' : device)
    : 'Unknown device';

  const html = layout(`
    <p class="eyebrow">Security Alert</p>
    <h1 class="h1">New sign-in to your account</h1>
    <p class="para">Hi ${firstName}, we detected a new sign-in to your MCT Bank account. Review the details below.</p>
    <div class="detail-box">
      <div class="dr"><span class="dl">Time</span><span class="dv">${displayTime}</span></div>
      <div class="dr"><span class="dl">IP Address</span><span class="dv">${ip}</span></div>
      <div class="dr"><span class="dl">Device</span><span class="dv">${shortDevice}</span></div>
    </div>
    <div class="banner b-info">✓ If this was you, no action is needed. You can safely ignore this email.</div>
    <div class="banner b-danger">🔒 <strong style="color:#fff">Wasn't you?</strong> Change your password immediately and contact our security team. Someone may have access to your account.</div>
    <div class="btn-wrap"><a class="btn" href="https://mctbank.online/login">Secure My Account</a></div>
  `, { footerNote: 'This is an automated security message. Do not reply to this email.' });

  const text = [
    'MCT Bank Security Alert — New Sign-In',
    '',
    `Hi ${firstName}, a new sign-in was detected on your MCT Bank account.`,
    '',
    `Time:   ${displayTime}`,
    `IP:     ${ip}`,
    `Device: ${shortDevice}`,
    '',
    'If this was you, no action is needed.',
    "If this wasn't you, change your password immediately at https://mctbank.online",
    'and contact security@mctbank.online.',
  ].join('\n');

  return dispatch({ from: FROM.security, to, subject: 'New sign-in to your MCT Bank account', html, text });
}

// ── 3. Password reset ─────────────────────────────────────────────────────────

async function sendPasswordResetEmail(to, resetUrl) {
  const html = layout(`
    <p class="eyebrow">Account Security</p>
    <h1 class="h1">Reset your password</h1>
    <p class="para">We received a request to reset the password for your MCT Bank account. Click the button below to choose a new password.</p>
    <div class="btn-wrap"><a class="btn" href="${resetUrl}">Reset My Password</a></div>
    <div class="banner b-warn">⏱ This link expires in <strong>1 hour</strong>. After that, you will need to request a new link.</div>
    <div class="banner b-danger">🔒 <strong style="color:#fff">Didn't request this?</strong> You can safely ignore this email — your password will not change and no action is required.</div>
    <hr class="divider">
    <p class="para" style="font-size:12px;margin-bottom:0">If the button does not work, copy and paste this link into your browser:<br>
      <span style="color:rgba(255,255,255,0.30);font-family:'Courier New',monospace;font-size:11px;word-break:break-all;display:block;margin-top:6px">${resetUrl}</span>
    </p>
  `, { footerNote: 'This is an automated security message. Do not reply to this email.' });

  const text = [
    'MCT Bank — Reset Your Password',
    '',
    'Visit the link below to choose a new password:',
    resetUrl,
    '',
    'This link expires in 1 hour.',
    'If you did not request a password reset, you can safely ignore this email.',
    '',
    'For help, contact support@mctbank.online',
  ].join('\n');

  return dispatch({ from: FROM.security, to, subject: 'Reset your MCT Bank password', html, text });
}

// ── 4. Welcome (new account) ──────────────────────────────────────────────────

async function sendWelcomeEmail(to, { name, accountNumber, routingNumber }) {
  const firstName     = name ? name.split(' ')[0] : 'there';
  const maskedAccount = accountNumber ? `••••${String(accountNumber).slice(-4)}` : '—';
  const routing       = routingNumber || '026009593';

  const html = layout(`
    <p class="eyebrow">Welcome to MCT Bank</p>
    <h1 class="h1">Your account is ready, ${firstName}!</h1>
    <p class="para">Thank you for choosing Metropolitan Capital &amp; Trust Bank. Your personal checking account has been opened and is ready to use.</p>
    <div class="detail-box">
      <div class="dr"><span class="dl">Account (last 4)</span><span class="dv">${maskedAccount}</span></div>
      <div class="dr"><span class="dl">Routing Number</span><span class="dv">${routing}</span></div>
      <div class="dr"><span class="dl">Account Type</span><span class="dv">Personal Checking</span></div>
      <div class="dr"><span class="dl">FDIC Insured</span><span class="dv">Yes — up to $250,000</span></div>
    </div>
    <p class="para" style="font-size:12px;color:rgba(255,255,255,0.35);margin-bottom:14px;text-transform:uppercase;letter-spacing:0.8px">Get started</p>
    <div class="step-wrap">
      <div class="step"><div class="step-n">1</div><div class="step-t"><strong>Set up your PIN</strong> — secure your account for card purchases and wire transfers</div></div>
      <div class="step"><div class="step-n">2</div><div class="step-t"><strong>Issue a virtual card</strong> — get an instant debit card for online purchases</div></div>
      <div class="step"><div class="step-n">3</div><div class="step-t"><strong>Open a savings account</strong> — earn interest and separate your funds</div></div>
      <div class="step"><div class="step-n">4</div><div class="step-t"><strong>Set up autopay</strong> — schedule recurring bill payments automatically</div></div>
    </div>
    <div class="btn-wrap"><a class="btn" href="https://mctbank.online">Go to Dashboard</a></div>
    <div class="banner b-info">Questions? Our support team is available 24/7 at <a href="mailto:support@mctbank.online" style="color:#93b4e0">support@mctbank.online</a> or call <strong>1-800-MCT-BANK</strong>.</div>
  `);

  const text = [
    `Welcome to MCT Bank, ${firstName}!`,
    '',
    'Your personal checking account is ready.',
    '',
    `Account (last 4): ${maskedAccount}`,
    `Routing number:   ${routing}`,
    'Account type:     Personal Checking',
    'FDIC insured:     Yes, up to $250,000',
    '',
    'Get started at https://mctbank.online',
    '',
    'Support: support@mctbank.online  |  1-800-MCT-BANK',
    '',
    '© 2024 Metropolitan Capital & Trust Bank · Member FDIC',
  ].join('\n');

  return dispatch({ from: FROM.support, to, subject: `Welcome to MCT Bank, ${firstName}!`, html, text });
}

// ── 5. Transaction notification ───────────────────────────────────────────────

async function sendTransactionEmail(to, { name, type, amount, currency, direction, counterparty, balance, reference }) {
  const firstName   = name ? name.split(' ')[0] : 'there';
  const cur         = currency || 'USD';
  const amt         = parseFloat(amount || 0).toFixed(2);
  const isCredit    = direction === 'credit';
  const verb        = isCredit ? 'received' : 'sent';
  const display     = `${isCredit ? '+' : '-'}${amt} ${cur}`;
  const typeLabel   = type === 'transfer' ? 'Transfer' : type === 'credit' ? 'Deposit' : 'Payment';
  const amtClass    = isCredit ? 'amt-credit' : 'amt-debit';

  const html = layout(`
    <p class="eyebrow">Transaction ${isCredit ? 'Received' : 'Sent'}</p>
    <h1 class="h1">You ${verb} money</h1>
    <p class="para">Hi ${firstName}, your ${typeLabel.toLowerCase()} has been processed successfully.</p>
    <span class="amt ${amtClass}">${display}</span>
    <div class="detail-box">
      <div class="dr"><span class="dl">Type</span><span class="dv">${typeLabel}</span></div>
      ${counterparty ? `<div class="dr"><span class="dl">${isCredit ? 'From' : 'To'}</span><span class="dv">${counterparty}</span></div>` : ''}
      ${balance != null ? `<div class="dr"><span class="dl">New Balance</span><span class="dv">${parseFloat(balance).toFixed(2)} ${cur}</span></div>` : ''}
      ${reference ? `<div class="dr"><span class="dl">Reference</span><span class="dv">${reference}</span></div>` : ''}
    </div>
    <div class="banner b-info">✓ This transaction has been recorded. View your full history in the MCT Bank app.</div>
    <div class="btn-wrap"><a class="btn" href="https://mctbank.online/transactions">View History</a></div>
  `);

  const text = [
    `MCT Bank — Transaction ${isCredit ? 'Received' : 'Sent'}`,
    '',
    `Hi ${firstName}, you ${verb} ${display}.`,
    counterparty ? `${isCredit ? 'From' : 'To'}: ${counterparty}` : '',
    balance != null ? `New balance: ${parseFloat(balance).toFixed(2)} ${cur}` : '',
    reference ? `Reference: ${reference}` : '',
    '',
    'View your transaction history: https://mctbank.online/transactions',
  ].filter(Boolean).join('\n');

  return dispatch({ from: FROM.noreply, to, subject: `MCT Bank: You ${verb} ${display}`, html, text });
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  sendOtpEmail,
  sendLoginAlertEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendTransactionEmail,
};
