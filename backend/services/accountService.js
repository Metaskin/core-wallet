const crypto      = require('crypto');
const accountRepo = require('../repositories/accountRepository');
const AppError    = require('../utils/AppError');
const { notify }  = require('./notificationService');
const { withTransaction } = require('../config/database');
const transactionRepo = require('../repositories/transactionRepository');
const { TRANSFER, ACCOUNT } = require('../config/constants');

const ROUTING_NUMBER = '026009593';

const generateAccountNumber = () => {
  const digits = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `${ACCOUNT.NUMBER_PREFIX}${digits}`;
};

// Compute all balance fields from a raw DB account row
const enrichAccount = (account) => {
  const ledger    = parseFloat(account.balance);
  const pending   = parseFloat(account.pending_balance ?? 0);
  const available = ledger;
  const total     = ledger + pending;
  return {
    id:               account.id,
    accountNumber:    account.account_number,
    accountType:      account.account_type   || 'checking',
    routingNumber:    account.routing_number || ROUTING_NUMBER,
    nickname:         account.nickname       || (account.account_type === 'savings' ? 'Savings Account' : 'Checking Account'),
    balance:          ledger,
    ledgerBalance:    ledger,
    availableBalance: available,
    pendingBalance:   pending,
    totalBalance:     total,
    currency:         account.currency,
    status:           account.status,
    ...(account.full_name ? {
      owner: {
        fullName:    account.full_name,
        email:       account.email,
        avatarColor: account.avatar_color,
      },
    } : {}),
  };
};

// ── Get all accounts for a user ───────────────────────────────────────────────
const getMyAccounts = async (userId) => {
  const accounts = await accountRepo.findAllByUserId(userId);
  if (!accounts.length) throw new AppError('Account not found', 404);
  return accounts.map(enrichAccount);
};

// ── Get primary account (backward-compat) ────────────────────────────────────
const getMyAccount = async (userId) => {
  const account = await accountRepo.findByUserId(userId);
  if (!account) throw new AppError('Account not found', 404);
  return enrichAccount(account);
};

// ── Open a savings account ────────────────────────────────────────────────────
const createSavingsAccount = async (userId) => {
  const existing = await accountRepo.findByUserIdAndType(userId, 'savings');
  if (existing) throw new AppError('You already have a savings account', 409);

  const accountNumber = generateAccountNumber();
  const account = await accountRepo.create({
    userId,
    accountNumber,
    currency:      'USD',
    initialBalance: 0,
    accountType:   'savings',
    routingNumber:  ROUTING_NUMBER,
    nickname:       'Savings Account',
  });

  notify({
    userId,
    type:     'account_opened',
    title:    'Savings account opened',
    message:  `Your CoreWallet Savings Account (${accountNumber}) has been created. Start saving today!`,
    severity: 'success',
    metadata: { accountNumber },
  });

  return enrichAccount(account);
};

// ── Internal transfer: checking ↔ savings ─────────────────────────────────────
const genRef = async (client) => {
  const { rows } = await client.query('SELECT generate_transaction_reference() AS ref');
  return rows[0].ref;
};

const internalTransfer = async ({ userId, fromAccountId, toAccountId, amount, description }) => {
  if (amount < TRANSFER.MIN_AMOUNT) throw new AppError(`Minimum transfer is $${TRANSFER.MIN_AMOUNT}`, 400);
  if (amount > TRANSFER.MAX_AMOUNT) throw new AppError(`Maximum transfer is $${TRANSFER.MAX_AMOUNT}`, 400);

  let _notif = null;

  const tx = await withTransaction(async (client) => {
    const sender   = await accountRepo.findByIdForUpdate(fromAccountId, client);
    const receiver = await accountRepo.findByIdForUpdate(toAccountId,   client);

    if (!sender)   throw new AppError('Source account not found', 404);
    if (!receiver) throw new AppError('Destination account not found', 404);

    if (sender.user_id !== userId)   throw new AppError('You do not own the source account', 403);
    if (receiver.user_id !== userId) throw new AppError('You do not own the destination account', 403);
    if (sender.id === receiver.id)   throw new AppError('Source and destination must be different', 400);
    if (sender.status !== 'active')  throw new AppError('Source account is not active', 403);
    if (receiver.status !== 'active') throw new AppError('Destination account is not active', 403);

    const senderBalBefore   = parseFloat(sender.balance);
    const receiverBalBefore = parseFloat(receiver.balance);

    if (senderBalBefore < amount) throw new AppError('Insufficient balance', 400);

    const senderBalAfter   = senderBalBefore   - amount;
    const receiverBalAfter = receiverBalBefore + amount;

    await accountRepo.updateBalance(sender.id,   senderBalAfter,   client);
    await accountRepo.updateBalance(receiver.id, receiverBalAfter, client);

    const reference = await genRef(client);

    const record = await transactionRepo.create({
      reference,
      type:              'transfer',
      senderAccountId:   sender.id,
      receiverAccountId: receiver.id,
      amount,
      currency:          sender.currency,
      description:       description || `Transfer to ${receiver.account_type || 'account'}`,
      status:            'completed',
      senderBalBefore,
      senderBalAfter,
      receiverBalBefore,
      receiverBalAfter,
    }, client);

    _notif = {
      userId,
      fromType:  sender.account_type   || 'checking',
      toType:    receiver.account_type || 'savings',
      currency:  sender.currency || 'USD',
      reference: record.reference,
    };

    return record;
  });

  if (_notif) {
    const fmt = `$${parseFloat(amount).toFixed(2)} ${_notif.currency}`;
    notify({
      userId:   _notif.userId,
      type:     'transaction_sent',
      title:    'Internal transfer complete',
      message:  `${fmt} moved from your ${_notif.fromType} to ${_notif.toType} account. Ref: ${_notif.reference}.`,
      severity: 'success',
      metadata: { reference: _notif.reference, amount },
    });
  }

  return tx;
};

// ── Toggle account status (admin) ─────────────────────────────────────────────
const toggleStatus = async (accountId) => {
  const account = await accountRepo.findById(accountId);
  if (!account) throw new AppError('Account not found', 404);

  const newStatus = account.status === 'frozen' ? 'active' : 'frozen';
  const updated   = await accountRepo.updateStatus(accountId, newStatus);

  const isFrozen = newStatus === 'frozen';
  notify({
    userId:   account.user_id,
    type:     isFrozen ? 'account_frozen' : 'account_unfrozen',
    title:    isFrozen ? 'Account frozen' : 'Account reactivated',
    message:  isFrozen
      ? 'Your account has been frozen by an administrator. Contact support if this is unexpected.'
      : 'Your account has been reactivated. You can now send and receive money as normal.',
    severity: isFrozen ? 'critical' : 'success',
    metadata: { accountId, accountNumber: account.account_number },
  });

  return updated;
};

module.exports = { getMyAccount, getMyAccounts, createSavingsAccount, internalTransfer, toggleStatus, enrichAccount };
