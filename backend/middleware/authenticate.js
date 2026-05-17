const authService  = require('../services/authService');
const userRepo     = require('../repositories/userRepository');
const accountRepo  = require('../repositories/accountRepository');
const AppError     = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token   = authHeader.slice(7);
  const payload = authService.verifyToken(token);

  const user = await userRepo.findById(payload.id);
  if (!user)           throw new AppError('User no longer exists', 401);
  if (!user.is_active) throw new AppError('Account suspended', 403);

  // All accounts (checking + savings)
  const allAccounts = await accountRepo.findAllByUserId(user.id);
  const primary     = allAccounts.find(a => a.account_type === 'checking') || allAccounts[0] || null;

  req.user     = user;
  req.account  = primary;       // backward-compat single account
  req.accounts = allAccounts;   // all accounts
  next();
});

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new AppError('Admin access required', 403));
  }
  next();
};

module.exports = { authenticate, requireAdmin };
