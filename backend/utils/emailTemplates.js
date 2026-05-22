'use strict';

/**
 * MCT Bank — HTML Email Templates
 *
 * Usage with EmailJS (server-side):
 *   Store the rendered HTML in a template variable called {{html_body}}
 *   and configure your EmailJS template to insert it as HTML content.
 *
 * Usage with Amazon SES (future migration):
 *   Pass the returned { html, text } object directly to SES sendEmail().
 *
 * All templates:
 *   - Match MCT Bank brand colors (#003087 navy, #0072CE blue)
 *   - Include plain-text fallback
 *   - Include anti-phishing footer notice
 *   - Are mobile-optimized (max-width 600px, inline styles for email clients)
 *   - Include MCT Bank SVG logo mark rendered as inline table cell
 */

const BRAND = {
  name:       'Metropolitan Capital & Trust Bank',
  short:      'MCT Bank',
  navy:       '#003087',
  blue:       '#0072CE',
  green:      '#0A7A4A',
  bgPage:     '#F3F4F6',
  bgCard:     '#FFFFFF',
  textPrimary:'#111827',
  textMuted:  '#6B7280',
  textLight:  '#9CA3AF',
  border:     '#E5E7EB',
  domain:     'mctbank.online',
  support:    'support@mctbank.online',
  security:   'security@mctbank.online',
};

// ── Shared chrome ─────────────────────────────────────────────────────────────

function logoRow() {
  return `
    <tr>
      <td align="center" style="padding:32px 24px 20px;">
        <table border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:${BRAND.navy};border-radius:10px;padding:10px 12px;vertical-align:middle;">
              <!-- MCT Bank icon mark (inline SVG rendered as img via data URI in most clients) -->
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 19L20 9L33 19" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="8" y="21" width="5" height="12" rx="1" fill="white" opacity="0.6"/>
                <rect x="17" y="17" width="6" height="16" rx="1" fill="white"/>
                <rect x="27" y="19" width="5" height="14" rx="1" fill="white" opacity="0.6"/>
              </svg>
            </td>
            <td style="padding-left:10px;vertical-align:middle;">
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:700;color:${BRAND.navy};line-height:1.2;">Metropolitan Capital</div>
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:9px;color:${BRAND.textMuted};letter-spacing:0.12em;text-transform:uppercase;margin-top:2px;">&amp; Trust Bank</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function antiPhishingFooter() {
  return `
    <tr>
      <td style="background:#F9FAFB;border-top:1px solid ${BRAND.border};padding:20px 24px;border-radius:0 0 12px 12px;">
        <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:${BRAND.textLight};text-align:center;line-height:1.6;">
          <strong style="color:${BRAND.textMuted};">Security notice:</strong>
          MCT Bank will never ask for your password, PIN, or full card number by email.
          If you did not initiate this action, contact us immediately at
          <a href="mailto:${BRAND.security}" style="color:${BRAND.navy};">${BRAND.security}</a>.
        </p>
        <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:10px;color:${BRAND.textLight};text-align:center;">
          &copy; ${new Date().getFullYear()} ${BRAND.name} &nbsp;&middot;&nbsp; Member FDIC
          &nbsp;&middot;&nbsp; <a href="https://${BRAND.domain}/privacy" style="color:${BRAND.textLight};">Privacy</a>
          &nbsp;&middot;&nbsp; <a href="https://${BRAND.domain}/security" style="color:${BRAND.textLight};">Security Center</a>
        </p>
      </td>
    </tr>`;
}

function wrapper(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
  <title>${BRAND.short}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bgPage};-webkit-font-smoothing:antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:${BRAND.bgPage};padding:24px 12px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:${BRAND.bgCard};border-radius:12px;border:1px solid ${BRAND.border};overflow:hidden;">
          ${logoRow()}
          ${content}
          ${antiPhishingFooter()}
        </table>
        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:10px;color:${BRAND.textLight};text-align:center;margin:16px 0 0;padding:0 12px;">
          This email was sent to you because you have an account at ${BRAND.name}.
          You cannot unsubscribe from security and account notifications.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── 1. OTP / Login verification ───────────────────────────────────────────────

function otpTemplate({ name, otp, time = '15 minutes' }) {
  const firstName = (name || 'Account Holder').split(' ')[0];
  const html = wrapper(`
    <tr>
      <td style="padding:0 24px 32px;">
        <h1 style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:20px;font-weight:700;color:${BRAND.textPrimary};margin:0 0 8px;">Verify your sign-in</h1>
        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:${BRAND.textMuted};margin:0 0 24px;line-height:1.6;">
          Hi ${firstName}, enter this verification code to complete your sign-in to MCT Bank.
          The code expires in <strong>${time}</strong>.
        </p>

        <!-- OTP code block -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
          <tr>
            <td align="center" style="background:#F0F4FF;border:2px dashed #C7D7F9;border-radius:12px;padding:24px;">
              <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:${BRAND.textMuted};letter-spacing:0.1em;text-transform:uppercase;">Verification Code</p>
              <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:40px;font-weight:700;letter-spacing:0.25em;color:${BRAND.navy};">${otp}</p>
            </td>
          </tr>
        </table>

        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:${BRAND.textMuted};margin:0;line-height:1.6;">
          If you did not attempt to sign in, your account may be compromised.
          Please change your password immediately and contact
          <a href="mailto:${BRAND.security}" style="color:${BRAND.navy};">${BRAND.security}</a>.
        </p>
      </td>
    </tr>`);

  const text = `MCT Bank — Sign-In Verification\n\nHi ${firstName},\n\nYour verification code is: ${otp}\n\nThis code expires in ${time}.\n\nIf you did not attempt to sign in, contact ${BRAND.security} immediately.\n\n---\n${BRAND.name}\nMember FDIC`;

  return { html, text };
}

// ── 2. Welcome (new account) ──────────────────────────────────────────────────

function welcomeTemplate({ name, accountLast4, routingNumber }) {
  const firstName = (name || 'Account Holder').split(' ')[0];
  const html = wrapper(`
    <tr>
      <td style="padding:0 24px 32px;">
        <!-- Hero banner -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:${BRAND.navy};border-radius:10px;margin-bottom:24px;">
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:0.08em;text-transform:uppercase;">Welcome to MCT Bank</p>
              <h2 style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:22px;font-weight:700;color:#FFFFFF;">Your account is ready, ${firstName}.</h2>
            </td>
          </tr>
        </table>

        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:${BRAND.textMuted};margin:0 0 20px;line-height:1.6;">
          Your Metropolitan Capital &amp; Trust Bank checking account has been successfully opened.
          Here are your account details:
        </p>

        <!-- Account details table -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;margin-bottom:24px;">
          <tr style="background:#F9FAFB;">
            <td style="padding:12px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${BRAND.textMuted};font-weight:600;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid ${BRAND.border};">Account Details</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid ${BRAND.border};">
              <table border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
                <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:${BRAND.textMuted};">Account Number</td>
                <td align="right" style="font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:700;color:${BRAND.textPrimary};">&#x2022;&#x2022;&#x2022;&#x2022; ${accountLast4 || '????'}</td>
              </tr></table>
            </td>
          </tr>
          ${routingNumber ? `<tr>
            <td style="padding:12px 16px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%"><tr>
                <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:${BRAND.textMuted};">Routing Number</td>
                <td align="right" style="font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:700;color:${BRAND.textPrimary};">${routingNumber}</td>
              </tr></table>
            </td>
          </tr>` : ''}
        </table>

        <!-- CTA button -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px;">
          <tr>
            <td align="center">
              <a href="https://${BRAND.domain}" style="display:inline-block;background:${BRAND.navy};color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                Go to Your Dashboard
              </a>
            </td>
          </tr>
        </table>

        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:${BRAND.textMuted};margin:0;line-height:1.6;">
          Need help getting started? Visit our
          <a href="https://${BRAND.domain}/contact" style="color:${BRAND.navy};">support center</a>
          or email <a href="mailto:${BRAND.support}" style="color:${BRAND.navy};">${BRAND.support}</a>.
        </p>
      </td>
    </tr>`);

  const text = `Welcome to MCT Bank, ${firstName}!\n\nYour checking account is now open.\n\nAccount Number: •••• ${accountLast4 || '????'}${routingNumber ? `\nRouting Number: ${routingNumber}` : ''}\n\nLog in at https://${BRAND.domain}\n\nQuestions? Email ${BRAND.support}\n\n---\n${BRAND.name}\nMember FDIC`;

  return { html, text };
}

// ── 3. Password reset ─────────────────────────────────────────────────────────

function passwordResetTemplate({ name, resetUrl }) {
  const firstName = (name || 'Account Holder').split(' ')[0];
  const html = wrapper(`
    <tr>
      <td style="padding:0 24px 32px;">
        <h1 style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:20px;font-weight:700;color:${BRAND.textPrimary};margin:0 0 8px;">Reset your password</h1>
        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:${BRAND.textMuted};margin:0 0 24px;line-height:1.6;">
          Hi ${firstName}, we received a request to reset the password for your MCT Bank account.
          Click the button below to set a new password. This link expires in <strong>30 minutes</strong>.
        </p>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <a href="${resetUrl}" style="display:inline-block;background:${BRAND.navy};color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                Reset Password
              </a>
            </td>
          </tr>
        </table>

        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${BRAND.textMuted};margin:0 0 8px;line-height:1.6;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="font-family:'Courier New',Courier,monospace;font-size:11px;color:${BRAND.textMuted};margin:0 0 20px;word-break:break-all;">
          ${resetUrl}
        </p>

        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:${BRAND.textMuted};margin:0;line-height:1.6;">
          If you did not request a password reset, you can safely ignore this email.
          Your password will not change. If you are concerned about your account security,
          contact <a href="mailto:${BRAND.security}" style="color:${BRAND.navy};">${BRAND.security}</a>.
        </p>
      </td>
    </tr>`);

  const text = `MCT Bank — Password Reset\n\nHi ${firstName},\n\nClick the link below to reset your password (expires in 30 minutes):\n${resetUrl}\n\nIf you did not request this, ignore this email or contact ${BRAND.security}.\n\n---\n${BRAND.name}`;

  return { html, text };
}

// ── 4. Transaction notification ───────────────────────────────────────────────

function transactionTemplate({ name, direction, amount, transactionType, counterparty, newBalance, reference }) {
  const firstName = (name || 'Account Holder').split(' ')[0];
  const isCredit  = direction === 'received' || direction === 'credit';
  const amtColor  = isCredit ? BRAND.green : '#B91C1C';
  const amtPrefix = isCredit ? '+' : '-';

  const html = wrapper(`
    <tr>
      <td style="padding:0 24px 32px;">
        <!-- Amount hero -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#F9FAFB;border:1px solid ${BRAND.border};border-radius:12px;margin-bottom:24px;">
          <tr>
            <td style="padding:20px;text-align:center;">
              <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:${BRAND.textMuted};letter-spacing:0.08em;text-transform:uppercase;">${transactionType}</p>
              <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:700;color:${amtColor};">${amtPrefix}${amount}</p>
              ${newBalance ? `<p style="margin:4px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${BRAND.textMuted};">New balance: <strong>${newBalance}</strong></p>` : ''}
            </td>
          </tr>
        </table>

        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:${BRAND.textMuted};margin:0 0 20px;line-height:1.6;">
          Hi ${firstName}, a transaction has been ${isCredit ? 'received on' : 'processed from'} your MCT Bank account.
        </p>

        <!-- Transaction details -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;margin-bottom:24px;">
          ${counterparty ? `<tr>
            <td style="padding:10px 16px;border-bottom:1px solid ${BRAND.border};">
              <table width="100%"><tr>
                <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${BRAND.textMuted};">${isCredit ? 'From' : 'To'}</td>
                <td align="right" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;font-weight:600;color:${BRAND.textPrimary};">${counterparty}</td>
              </tr></table>
            </td>
          </tr>` : ''}
          ${reference ? `<tr>
            <td style="padding:10px 16px;">
              <table width="100%"><tr>
                <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${BRAND.textMuted};">Reference</td>
                <td align="right" style="font-family:'Courier New',Courier,monospace;font-size:11px;color:${BRAND.textMuted};">${reference}</td>
              </tr></table>
            </td>
          </tr>` : ''}
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center">
              <a href="https://${BRAND.domain}/transactions" style="display:inline-block;background:${BRAND.navy};color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;">
                View Transaction
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`);

  const text = `MCT Bank — Transaction Alert\n\nHi ${firstName},\n\n${transactionType}: ${amtPrefix}${amount}${newBalance ? `\nNew balance: ${newBalance}` : ''}${counterparty ? `\n${isCredit ? 'From' : 'To'}: ${counterparty}` : ''}${reference ? `\nReference: ${reference}` : ''}\n\nView your transactions: https://${BRAND.domain}/transactions\n\n---\n${BRAND.name}`;

  return { html, text };
}

// ── 5. Login security alert ───────────────────────────────────────────────────

function loginAlertTemplate({ name, loginTime, loginIp, loginDevice }) {
  const firstName = (name || 'Account Holder').split(' ')[0];
  const html = wrapper(`
    <tr>
      <td style="padding:0 24px 32px;">
        <!-- Alert banner -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;margin-bottom:24px;">
          <tr>
            <td style="padding:16px 20px;">
              <table><tr>
                <td style="font-size:20px;padding-right:12px;">&#x26A0;&#xFE0F;</td>
                <td>
                  <p style="margin:0 0 2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:700;color:#991B1B;">New sign-in detected</p>
                  <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#B91C1C;">If this was not you, secure your account immediately.</p>
                </td>
              </tr></table>
            </td>
          </tr>
        </table>

        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:${BRAND.textMuted};margin:0 0 20px;line-height:1.6;">
          Hi ${firstName}, a new sign-in to your MCT Bank account was recorded with the following details:
        </p>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden;margin-bottom:24px;">
          ${loginTime ? `<tr><td style="padding:10px 16px;border-bottom:1px solid ${BRAND.border};"><table width="100%"><tr>
            <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${BRAND.textMuted};">Time</td>
            <td align="right" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${BRAND.textPrimary};">${loginTime}</td>
          </tr></table></td></tr>` : ''}
          ${loginIp ? `<tr><td style="padding:10px 16px;border-bottom:1px solid ${BRAND.border};"><table width="100%"><tr>
            <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${BRAND.textMuted};">IP Address</td>
            <td align="right" style="font-family:'Courier New',Courier,monospace;font-size:12px;color:${BRAND.textPrimary};">${loginIp}</td>
          </tr></table></td></tr>` : ''}
          ${loginDevice ? `<tr><td style="padding:10px 16px;"><table width="100%"><tr>
            <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${BRAND.textMuted};">Device</td>
            <td align="right" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${BRAND.textPrimary};">${loginDevice}</td>
          </tr></table></td></tr>` : ''}
        </table>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
          <tr>
            <td align="center">
              <a href="mailto:${BRAND.security}?subject=Unauthorized+Sign-In+Report" style="display:inline-block;background:#DC2626;color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;">
                This Wasn't Me — Secure My Account
              </a>
            </td>
          </tr>
        </table>

        <p style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:${BRAND.textMuted};text-align:center;margin:0;line-height:1.6;">
          If this was you, no action is needed.
        </p>
      </td>
    </tr>`);

  const text = `MCT Bank — Sign-In Alert\n\nHi ${firstName},\n\nA new sign-in was detected on your account.\n\nTime: ${loginTime || 'Unknown'}\nIP: ${loginIp || 'Unknown'}\nDevice: ${loginDevice || 'Unknown'}\n\nIf this was not you, contact ${BRAND.security} immediately.\n\n---\n${BRAND.name}`;

  return { html, text };
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  otpTemplate,
  welcomeTemplate,
  passwordResetTemplate,
  transactionTemplate,
  loginAlertTemplate,
};
