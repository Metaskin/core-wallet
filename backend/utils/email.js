const nodemailer = require('nodemailer');
const { Resend }  = require('resend');

// ── Transport selection ───────────────────────────────────────────────────────
// SMTP (nodemailer) takes priority when SMTP_HOST + SMTP_USER + SMTP_PASS are all set.
// This lets you send from Gmail (with an App Password) or any SMTP relay without
// needing a Resend-verified domain — ideal for local dev.
// Falls back to Resend when SMTP vars are absent.
const useSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const FROM = process.env.EMAIL_FROM
  || (useSmtp
      ? `CoreWallet <${process.env.SMTP_USER}>`
      : 'CoreWallet <onboarding@resend.dev>');

// ── Startup diagnostics ───────────────────────────────────────────────────────
console.log(`[Email] transport=${useSmtp ? 'SMTP' : 'Resend'} enabled=${process.env.ENABLE_EMAIL} from="${FROM}"`);

if (useSmtp) {
  console.log(`[Email] SMTP host=${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587} user=${process.env.SMTP_USER}`);
} else {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] WARNING: RESEND_API_KEY is not set — all email sends will fail.');
  }
  const fromAddr = (FROM.match(/<([^>]+)>/) || [])[1] || FROM;
  const freeMailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  const domain = (fromAddr.split('@')[1] || '').toLowerCase();
  if (freeMailDomains.includes(domain)) {
    console.warn(`[Email] WARNING: Resend cannot send from ${fromAddr} — ${domain} is not a Resend-verified domain. All sends will fail. Set SMTP_HOST/SMTP_USER/SMTP_PASS to use SMTP instead, or set EMAIL_FROM=CoreWallet <onboarding@resend.dev>.`);
  }
  if (FROM.includes('onboarding@resend.dev')) {
    console.log('[Email] NOTE: onboarding@resend.dev — Resend only delivers to your Resend account email. Other recipients are silently discarded by Resend.');
  }
}

// ── Transport instances ───────────────────────────────────────────────────────
const resend = useSmtp ? null : new Resend(process.env.RESEND_API_KEY);

const smtp = useSmtp
  ? nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT  || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // Fail fast so a slow or unreachable SMTP server does not stall callers.
      // Default nodemailer timeouts are 2 min (connect) / infinite (socket) —
      // these shrink them to values that produce a clean error within seconds.
      connectionTimeout: 8000,   // ms to establish TCP connection
      greetingTimeout:   5000,   // ms to receive SMTP greeting after connect
      socketTimeout:     10000,  // ms of inactivity before socket is closed
    })
  : null;

const isEnabled = () => process.env.ENABLE_EMAIL === 'true';

// ── Internal dispatch ─────────────────────────────────────────────────────────
async function send({ to, subject, html, text }) {
  if (!isEnabled()) {
    console.log(`[Email] disabled — skipped: "${subject}" → ${to}`);
    return;
  }

  if (useSmtp) {
    console.log(`[Email] SMTP attempt: "${subject}" → ${to}`);
    const info = await smtp.sendMail({ from: FROM, to, subject, html, text });
    console.log(`[Email] SMTP delivered: messageId=${info.messageId} response="${info.response}"`);
    return;
  }

  console.log(`[Email] Resend attempt: "${subject}" → ${to} (from="${FROM}")`);
  const { data, error } = await resend.emails.send({ from: FROM, to: [to], subject, html, text });
  if (error) {
    console.error('[Email] Resend error:', JSON.stringify(error));
    throw new Error(error.message || JSON.stringify(error));
  }
  console.log(`[Email] Resend delivered: id=${data?.id} → ${to}`);
}

// ── Shared layout wrapper ─────────────────────────────────────────────────────
function layout(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
    .outer{padding:40px 16px}
    .card{max-width:480px;margin:0 auto;background:#111211;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.07)}
    .header{background:linear-gradient(135deg,#052e16 0%,#064e3b 100%);padding:32px;text-align:center}
    .logo-box{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;background:#10b981;border-radius:12px;margin-bottom:12px}
    .logo-letter{color:#fff;font-weight:800;font-size:20px;line-height:1}
    .brand{color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.4px}
    .body{padding:32px}
    .eyebrow{color:#34d399;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;font-weight:600;margin-bottom:10px}
    .title{color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.3px;margin-bottom:12px}
    .para{color:rgba(255,255,255,0.55);font-size:14px;line-height:1.7;margin-bottom:20px}
    .detail-box{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:16px;margin-bottom:20px}
    .detail-row{display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
    .detail-row:last-child{border-bottom:none}
    .detail-label{color:rgba(255,255,255,0.35);font-size:12px}
    .detail-value{color:rgba(255,255,255,0.75);font-size:12px;font-family:'Courier New',monospace;max-width:260px;text-align:right;word-break:break-all}
    .btn-wrap{text-align:center;margin-bottom:20px}
    .btn{display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:15px}
    .btn-danger{background:#dc2626}
    .notice{background:rgba(234,179,8,0.06);border:1px solid rgba(234,179,8,0.18);border-radius:8px;padding:12px 14px;color:#fbbf24;font-size:12px;line-height:1.6;margin-bottom:16px}
    .alert{background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:8px;padding:12px 14px;color:rgba(255,255,255,0.45);font-size:12px;line-height:1.6;margin-bottom:16px}
    .success-box{background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.18);border-radius:8px;padding:12px 14px;color:#34d399;font-size:12px;line-height:1.6;margin-bottom:16px}
    .amount{color:#10b981;font-size:28px;font-weight:800;letter-spacing:-0.5px;font-family:'Courier New',monospace}
    .footer{border-top:1px solid rgba(255,255,255,0.05);padding:18px 32px;text-align:center;color:rgba(255,255,255,0.18);font-size:11px;line-height:1.6}
  </style>
</head>
<body>
  <div class="outer">
    <div class="card">
      <div class="header">
        <div class="logo-box"><span class="logo-letter">C</span></div>
        <div class="brand">CoreWallet</div>
      </div>
      <div class="body">${bodyHtml}</div>
      <div class="footer">
        © 2018 CoreWallet, Inc. · This is an automated security message. Do not reply.<br>
        If you need help, contact <a href="mailto:support@corewallet.com" style="color:rgba(255,255,255,0.35);text-decoration:none">support@corewallet.com</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── Login alert ───────────────────────────────────────────────────────────────
async function sendLoginAlertEmail(to, { name, ip, device, time }) {
  const displayName = name ? name.split(' ')[0] : 'there';
  const displayTime = new Date(time).toUTCString();
  const shortDevice = device
    ? device.length > 90 ? device.substring(0, 90) + '…' : device
    : 'Unknown device';

  const body = `
    <p class="eyebrow">Security Alert</p>
    <p class="title">New sign-in to your account</p>
    <p class="para">Hi ${displayName}, we detected a new sign-in to your CoreWallet account. Here are the details:</p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Time</span>
        <span class="detail-value">${displayTime}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">IP Address</span>
        <span class="detail-value">${ip}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Device / Browser</span>
        <span class="detail-value">${shortDevice}</span>
      </div>
    </div>
    <div class="success-box">✓ If this was you, no action is needed. You can safely ignore this email.</div>
    <div class="alert">🔒 <strong style="color:#fff">Wasn't you?</strong> Change your password immediately and contact support. Someone may have access to your account.</div>
  `;

  const text = [
    `CoreWallet Security Alert`,
    ``,
    `Hi ${displayName}, a new sign-in was detected on your CoreWallet account.`,
    ``,
    `Time:    ${displayTime}`,
    `IP:      ${ip}`,
    `Device:  ${shortDevice}`,
    ``,
    `If this was you, no action is needed.`,
    `If this wasn't you, change your password immediately and contact support@corewallet.com.`,
  ].join('\n');

  await send({ to, subject: 'New sign-in to your CoreWallet account', html: layout(body), text });
}

// ── Password reset ────────────────────────────────────────────────────────────
async function sendPasswordResetEmail(to, resetUrl) {
  const body = `
    <p class="eyebrow">Account Security</p>
    <p class="title">Reset your password</p>
    <p class="para">We received a request to reset the password for your CoreWallet account. Click the button below to choose a new password.</p>
    <div class="btn-wrap">
      <a class="btn" href="${resetUrl}">Reset Password</a>
    </div>
    <div class="notice">⏱ This link expires in <strong>1 hour</strong>. After that, you'll need to request a new one.</div>
    <div class="alert">🔒 <strong style="color:#fff">Didn't request this?</strong> You can safely ignore this email — your password will not change and no action is required.</div>
    <p class="para" style="font-size:12px;margin-top:8px">If the button above doesn't work, copy and paste this URL into your browser:<br>
      <span style="color:rgba(255,255,255,0.35);font-family:'Courier New',monospace;font-size:11px;word-break:break-all">${resetUrl}</span>
    </p>
  `;

  const text = [
    `Reset your CoreWallet password`,
    ``,
    `Visit the link below to choose a new password:`,
    `${resetUrl}`,
    ``,
    `This link expires in 1 hour.`,
    `If you did not request a password reset, ignore this email.`,
  ].join('\n');

  await send({ to, subject: 'Reset your CoreWallet password', html: layout(body), text });
}

// ── Transaction notification ──────────────────────────────────────────────────
async function sendTransactionEmail(to, { name, type, amount, currency, direction, counterparty, balance }) {
  const displayName   = name ? name.split(' ')[0] : 'there';
  const displayAmount = `${direction === 'credit' ? '+' : '-'}${parseFloat(amount).toFixed(2)} ${currency || 'USD'}`;
  const isCredit      = direction === 'credit';
  const verb          = isCredit ? 'received' : 'sent';
  const amountColor   = isCredit ? '#10b981' : 'rgba(255,255,255,0.75)';
  const typeLabel     = type === 'transfer' ? 'Transfer' : type === 'credit' ? 'Deposit' : 'Transaction';

  const body = `
    <p class="eyebrow">Transaction ${isCredit ? 'Received' : 'Sent'}</p>
    <p class="title">You ${verb} money</p>
    <p class="para">Hi ${displayName}, your ${typeLabel.toLowerCase()} has been processed.</p>
    <div class="detail-box">
      <div class="detail-row">
        <span class="detail-label">Amount</span>
        <span class="detail-value" style="color:${amountColor};font-size:15px;font-weight:700">${displayAmount}</span>
      </div>
      ${counterparty ? `<div class="detail-row">
        <span class="detail-label">${isCredit ? 'From' : 'To'}</span>
        <span class="detail-value">${counterparty}</span>
      </div>` : ''}
      ${balance != null ? `<div class="detail-row">
        <span class="detail-label">New Balance</span>
        <span class="detail-value">${parseFloat(balance).toFixed(2)} ${currency || 'USD'}</span>
      </div>` : ''}
    </div>
    <div class="success-box">✓ This transaction has been recorded. View your full history in the CoreWallet app.</div>
  `;

  const text = [
    `CoreWallet Transaction Alert`,
    ``,
    `Hi ${displayName}, you ${verb} ${displayAmount}.`,
    counterparty ? `${isCredit ? 'From' : 'To'}: ${counterparty}` : '',
    balance != null ? `New balance: ${parseFloat(balance).toFixed(2)} ${currency || 'USD'}` : '',
    ``,
    `View your full transaction history in the CoreWallet app.`,
  ].filter(Boolean).join('\n');

  await send({ to, subject: `CoreWallet: You ${verb} ${displayAmount}`, html: layout(body), text });
}

// ── OTP ───────────────────────────────────────────────────────────────────────
async function sendOtpEmail(to, code) {
  const body = `
    <p class="eyebrow">Login Verification</p>
    <p class="title">Your verification code</p>
    <p class="para">Use the code below to complete your CoreWallet sign-in. Enter it within 10 minutes.</p>
    <div style="text-align:center;margin:24px 0">
      <div style="display:inline-block;background:rgba(16,185,129,0.08);border:1.5px solid rgba(16,185,129,0.25);border-radius:12px;padding:20px 36px">
        <span style="font-size:40px;font-weight:800;letter-spacing:12px;color:#34d399;font-family:'Courier New',monospace">${code}</span>
      </div>
    </div>
    <div class="notice">⏱ This code expires in <strong>10 minutes</strong>.</div>
    <div class="alert">🔒 <strong style="color:#fff">Security notice:</strong> If you did not attempt to sign in, ignore this email. Never share this code with anyone, including CoreWallet support.</div>
  `;

  const text = [
    `Your CoreWallet login code: ${code}`,
    ``,
    `This code expires in 10 minutes.`,
    `If you did not request this, ignore this email.`,
  ].join('\n');

  await send({ to, subject: 'Your CoreWallet verification code', html: layout(body), text });
}

module.exports = { sendLoginAlertEmail, sendPasswordResetEmail, sendTransactionEmail, sendOtpEmail };
