const { withTransaction } = require('../config/database');
const accountRepo     = require('../repositories/accountRepository');
const transactionRepo = require('../repositories/transactionRepository');
const AppError        = require('../utils/AppError');
const { TRANSFER }    = require('../config/constants');
const { notify }      = require('./notificationService');

/** Generate unique transaction reference */
const genRef = async (client) => {
  const { rows } = await client.query('SELECT generate_transaction_reference() AS ref');
  return rows[0].ref;
};

// ─── Transfer (user → user) ──────────────────────────────────────────────────
const transfer = async ({ senderAccountNumber, toAccountNumber, amount, description, userId }) => {
  if (amount < TRANSFER.MIN_AMOUNT) {
    throw new AppError(`Minimum transfer amount is $${TRANSFER.MIN_AMOUNT}`, 400);
  }
  if (amount > TRANSFER.MAX_AMOUNT) {
    throw new AppError(`Maximum transfer amount is $${TRANSFER.MAX_AMOUNT}`, 400);
  }

  // Captured inside the closure so we can fire notifications after commit
  let _notif = null;

  const tx = await withTransaction(async (client) => {
    // Lock both rows in consistent order to prevent deadlocks
    const [acc1, acc2] = [senderAccountNumber, toAccountNumber].sort();
    await accountRepo.findByNumberForUpdate(acc1, client);
    if (acc1 !== acc2) await accountRepo.findByNumberForUpdate(acc2, client);

    const sender = await accountRepo.findByNumber(senderAccountNumber, client);
    if (!sender) throw new AppError('Sender account not found', 404);
    if (sender.status !== 'active') throw new AppError('Sender account is not active', 403);

    // Ownership check: the logged-in user must own the sender account
    if (userId && sender.user_id !== userId) {
      throw new AppError('You do not own this account', 403);
    }

    const receiver = await accountRepo.findByNumber(toAccountNumber, client);
    if (!receiver) throw new AppError('Recipient account not found', 404);
    if (receiver.status !== 'active') throw new AppError('Recipient account is not active', 403);

    if (sender.id === receiver.id) {
      throw new AppError('Cannot transfer to your own account', 400);
    }

    const senderBalBefore    = parseFloat(sender.balance);
    const receiverBalBefore  = parseFloat(receiver.balance);

    if (senderBalBefore < amount) {
      throw new AppError('Insufficient balance', 400);
    }

    const senderBalAfter   = senderBalBefore   - amount;
    const receiverBalAfter = receiverBalBefore + amount;

    await accountRepo.updateBalance(sender.id,   senderBalAfter,   client);
    await accountRepo.updateBalance(receiver.id, receiverBalAfter, client);

    const reference = await genRef(client);

    const tx = await transactionRepo.create({
      reference,
      type:             'transfer',
      senderAccountId:  sender.id,
      receiverAccountId: receiver.id,
      amount,
      currency:         sender.currency,
      description:      description || 'Transfer',
      status:           'completed',
      senderBalBefore,
      senderBalAfter,
      receiverBalBefore,
      receiverBalAfter,
    }, client);

    _notif = {
      senderUserId:   sender.user_id,
      receiverUserId: receiver.user_id,
      currency:       sender.currency || 'USD',
      reference:      tx.reference,
      senderAccNum:   senderAccountNumber,
      receiverAccNum: toAccountNumber,
    };

    return tx;
  });

  if (_notif) {
    const fmt = `$${parseFloat(amount).toFixed(2)} ${_notif.currency}`;
    notify({
      userId:   _notif.senderUserId,
      type:     'transaction_sent',
      title:    'Money sent',
      message:  `You sent ${fmt} to account •••${_notif.receiverAccNum.slice(-4)}.`,
      severity: 'info',
      metadata: { reference: _notif.reference, amount, toAccountNumber },
    });
    notify({
      userId:   _notif.receiverUserId,
      type:     'transaction_received',
      title:    'Money received',
      message:  `You received ${fmt} from account •••${_notif.senderAccNum.slice(-4)}.`,
      severity: 'success',
      metadata: { reference: _notif.reference, amount, fromAccountNumber: _notif.senderAccNum },
    });
  }

  return tx;
};

// ─── Admin credit ─────────────────────────────────────────────────────────────
const adminCredit = async ({ accountId, amount, description, adminId, externalReference }) => {
  let _notif = null;

  const tx = await withTransaction(async (client) => {
    const account = await accountRepo.findByIdForUpdate(accountId, client);
    if (!account) throw new AppError('Account not found', 404);
    if (account.status !== 'active') throw new AppError('Account is not active', 403);

    const balBefore = parseFloat(account.balance);
    const balAfter  = balBefore + amount;

    await accountRepo.updateBalance(account.id, balAfter, client);

    const reference = await genRef(client);

    const tx = await transactionRepo.create({
      reference,
      type:              'credit',
      receiverAccountId: account.id,
      adminId,
      amount,
      currency:          account.currency,
      description:       description || 'Admin credit',
      status:            'completed',
      receiverBalBefore: balBefore,
      receiverBalAfter:  balAfter,
      externalReference: externalReference || null,
    }, client);

    await client.query(
      `INSERT INTO admin_logs (admin_id, action, target_account_id, transaction_id, details)
       VALUES ($1, 'ACCOUNT_CREDIT', $2, $3, $4)`,
      [adminId, account.id, tx.id, JSON.stringify({ amount, description })]
    );

    _notif = { userId: account.user_id, currency: account.currency || 'USD', reference: tx.reference, balAfter };
    return tx;
  });

  if (_notif) {
    notify({
      userId:   _notif.userId,
      type:     'account_credited',
      title:    'Account credited',
      message:  `$${parseFloat(amount).toFixed(2)} ${_notif.currency} was added to your account. New balance: $${parseFloat(_notif.balAfter).toFixed(2)}.`,
      severity: 'success',
      metadata: { reference: _notif.reference, amount },
    });
  }

  return tx;
};

// ─── Admin debit ──────────────────────────────────────────────────────────────
const adminDebit = async ({ accountId, amount, description, adminId, externalReference }) => {
  let _notif = null;

  const tx = await withTransaction(async (client) => {
    const account = await accountRepo.findByIdForUpdate(accountId, client);
    if (!account) throw new AppError('Account not found', 404);
    if (account.status !== 'active') throw new AppError('Account is not active', 403);

    const balBefore = parseFloat(account.balance);
    if (balBefore < amount) throw new AppError('Insufficient balance for debit', 400);

    const balAfter = balBefore - amount;

    await accountRepo.updateBalance(account.id, balAfter, client);

    const reference = await genRef(client);

    const tx = await transactionRepo.create({
      reference,
      type:            'debit',
      senderAccountId: account.id,
      adminId,
      amount,
      currency:        account.currency,
      description:     description || 'Admin debit',
      status:          'completed',
      senderBalBefore: balBefore,
      senderBalAfter:  balAfter,
      externalReference: externalReference || null,
    }, client);

    await client.query(
      `INSERT INTO admin_logs (admin_id, action, target_account_id, transaction_id, details)
       VALUES ($1, 'ACCOUNT_DEBIT', $2, $3, $4)`,
      [adminId, account.id, tx.id, JSON.stringify({ amount, description })]
    );

    _notif = { userId: account.user_id, currency: account.currency || 'USD', reference: tx.reference, balAfter };
    return tx;
  });

  if (_notif) {
    notify({
      userId:   _notif.userId,
      type:     'account_debited',
      title:    'Account debited',
      message:  `$${parseFloat(amount).toFixed(2)} ${_notif.currency} was deducted from your account. New balance: $${parseFloat(_notif.balAfter).toFixed(2)}.`,
      severity: 'warning',
      metadata: { reference: _notif.reference, amount },
    });
  }

  return tx;
};

// ─── External inflow (Stripe / crypto / bank wire → user account) ─────────────
// No sender account — external_reference names the source (e.g. "Stripe", "Bitcoin")
const externalInflow = async ({ accountId, amount, description, externalReference }) => {
  return withTransaction(async (client) => {
    const account = await accountRepo.findByIdForUpdate(accountId, client);
    if (!account) throw new AppError('Account not found', 404);
    if (account.status !== 'active') throw new AppError('Account is not active', 403);

    const balBefore = parseFloat(account.balance);
    const balAfter  = balBefore + amount;

    await accountRepo.updateBalance(account.id, balAfter, client);

    const reference = await genRef(client);

    const tx = await transactionRepo.create({
      reference,
      type:              'credit',
      receiverAccountId: account.id,
      amount,
      currency:          account.currency,
      description:       description || `Deposit via ${externalReference || 'external source'}`,
      status:            'completed',
      receiverBalBefore: balBefore,
      receiverBalAfter:  balAfter,
      externalReference,
    }, client);

    return tx;
  });
};

// ─── External outflow (user account → bank wire / external destination) ────────
// No receiver account — external_reference names the destination
const externalOutflow = async ({ accountId, amount, description, externalReference }) => {
  return withTransaction(async (client) => {
    const account = await accountRepo.findByIdForUpdate(accountId, client);
    if (!account) throw new AppError('Account not found', 404);
    if (account.status !== 'active') throw new AppError('Account is not active', 403);

    const balBefore = parseFloat(account.balance);
    if (balBefore < amount) throw new AppError('Insufficient balance', 400);

    const balAfter = balBefore - amount;

    await accountRepo.updateBalance(account.id, balAfter, client);

    const reference = await genRef(client);

    const tx = await transactionRepo.create({
      reference,
      type:            'debit',
      senderAccountId: account.id,
      amount,
      currency:        account.currency,
      description:     description || `Withdrawal to ${externalReference || 'external destination'}`,
      status:          'completed',
      senderBalBefore: balBefore,
      senderBalAfter:  balAfter,
      externalReference,
    }, client);

    return tx;
  });
};

// ─── Get transactions for a user account ─────────────────────────────────────
const getMyTransactions = async (accountId, { page, limit } = {}) =>
  transactionRepo.findByAccountId(accountId, { page, limit });

const getAllTransactions = async ({ page, limit } = {}) =>
  transactionRepo.findAll({ page, limit });

// ─── Soft-delete (user hides transaction from their view) ─────────────────────
const deleteTransaction = async ({ transactionId, accountId }) => {
  const raw = await transactionRepo.findRawById(transactionId);
  if (!raw) throw new AppError('Transaction not found', 404);
  if (raw.is_deleted) throw new AppError('Transaction already deleted', 404);

  const isParty =
    raw.sender_account_id   === accountId ||
    raw.receiver_account_id === accountId;

  if (!isParty) throw new AppError('Not authorised to delete this transaction', 403);

  await transactionRepo.softDelete(transactionId);
};

module.exports = { transfer, adminCredit, adminDebit, externalInflow, externalOutflow, getMyTransactions, getAllTransactions, deleteTransaction };
