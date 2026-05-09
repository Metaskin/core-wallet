const accountRepo = require('../repositories/accountRepository');
const AppError    = require('../utils/AppError');
const { notify }  = require('./notificationService');

const getMyAccount = async (userId) => {
  const account = await accountRepo.findByUserId(userId);
  if (!account) throw new AppError('Account not found', 404);

  // ledger = settled balance (the authoritative `balance` column, updated by every tx)
  // pending = authorized-but-not-settled holds (stored separately, defaults 0)
  // available = ledger only — pending is NOT spendable
  // total = what the user "sees" as their overall balance = ledger + pending
  //
  // We intentionally ignore the `available_balance` DB column: it is seeded once
  // at account creation and never updated by updateBalance, so it goes stale after
  // the first transaction. Deriving it here from ledger is always accurate.
  const ledger    = parseFloat(account.balance);
  const pending   = parseFloat(account.pending_balance ?? 0);
  const available = ledger;
  const total     = ledger + pending;

  return {
    id:               account.id,
    accountNumber:    account.account_number,
    balance:          ledger,      // backward-compat alias
    ledgerBalance:    ledger,
    availableBalance: available,
    pendingBalance:   pending,
    totalBalance:     total,
    currency:         account.currency,
    status:           account.status,
    owner: {
      fullName:    account.full_name,
      email:       account.email,
      avatarColor: account.avatar_color,
    },
  };
};

const toggleStatus = async (accountId) => {
  const account = await accountRepo.findById(accountId);
  if (!account) throw new AppError('Account not found', 404);

  const newStatus = account.status === 'frozen' ? 'active' : 'frozen';
  const updated = await accountRepo.updateStatus(accountId, newStatus);

  const isFrozen = newStatus === 'frozen';
  notify({
    userId:   account.user_id,
    type:     isFrozen ? 'account_frozen' : 'account_unfrozen',
    title:    isFrozen ? 'Account frozen' : 'Account reactivated',
    message:  isFrozen
      ? 'Your account has been frozen by an administrator. You cannot send or receive money while frozen. Contact support if this is unexpected.'
      : 'Your account has been reactivated. You can now send and receive money as normal.',
    severity: isFrozen ? 'critical' : 'success',
    metadata: { accountId, accountNumber: account.account_number },
  });

  return updated;
};

module.exports = { getMyAccount, toggleStatus };
