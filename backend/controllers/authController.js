const authService  = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { sendLoginAlertEmail } = require('../utils/email');
const { notify }   = require('../services/notificationService');

const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, avatarColor } = req.body;
  const result = await authService.register({ email, password, fullName, avatarColor });
  res.status(201).json({ status: 'success', data: result });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  res.json({ status: 'success', data: result });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { userId, code } = req.body;
  const result = await authService.verifyOtp({ userId, code });

  // Fire-and-forget login alert — auth truly completes here
  const ip     = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'Unknown';
  const device = req.headers['user-agent'] || 'Unknown device';
  const shortDevice = device.length > 80 ? device.substring(0, 80) + '…' : device;
  sendLoginAlertEmail(result.user.email, { name: result.user.fullName, ip, device, time: new Date() })
    .catch(err => console.error('[Email] Login alert failed:', err.message));

  notify({
    userId:   result.user.id,
    type:     'login_success',
    title:    'New sign-in to your account',
    message:  `Successful sign-in from ${ip}. Device: ${shortDevice}.`,
    severity: 'info',
    metadata: { ip, device: shortDevice },
  });

  res.json({ status: 'success', data: result });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    status: 'success',
    data: {
      user:    authService.sanitizeUser(req.user),
      account: req.account ? (() => {
        const ledger    = parseFloat(req.account.balance);
        const pending   = parseFloat(req.account.pending_balance ?? 0);
        const available = ledger;
        const total     = ledger + pending;
        return {
          id:               req.account.id,
          accountNumber:    req.account.account_number,
          balance:          ledger,
          ledgerBalance:    ledger,
          availableBalance: available,
          pendingBalance:   pending,
          totalBalance:     total,
          currency:         req.account.currency,
          status:           req.account.status,
        };
      })() : null,
    },
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword({ userId: req.user.id, currentPassword, newPassword });
  res.json({ status: 'success', message: 'Password updated successfully' });
});

const changeEmail = asyncHandler(async (req, res) => {
  const { newEmail } = req.body;
  const user = await authService.changeEmail({ userId: req.user.id, newEmail });
  res.json({ status: 'success', data: { user } });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword({ email });
  res.json({ status: 'success', data: { sent: true } });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword({ token, newPassword });
  res.json({ status: 'success', message: 'Password reset successfully' });
});

module.exports = { register, login, verifyOtp, me, changePassword, changeEmail, forgotPassword, resetPassword };
