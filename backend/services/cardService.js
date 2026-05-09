const cardRepo    = require('../repositories/cardRepository');
const accountRepo = require('../repositories/accountRepository');
const AppError    = require('../utils/AppError');
const {
  generateCardNumber, formatCardNumber,
  generateCVV, generateExpiry,
} = require('../utils/generateCardNumber');
const { notify } = require('./notificationService');

const issueCard = async ({ userId, accountId, cardType = 'debit', design = 'blue', creditLimit = null }) => {
  const account = await accountRepo.findByUserId(userId);
  if (!account) throw new AppError('Account not found', 404);
  if (account.id !== accountId) throw new AppError('Forbidden', 403);
  if (account.status !== 'active') throw new AppError('Cannot issue card for inactive account', 403);

  const existing = await cardRepo.findByAccountId(accountId);
  const sameType = existing.filter(c => c.card_type === cardType && c.is_active);
  if (sameType.length >= 2) {
    throw new AppError(`Maximum active ${cardType} cards reached`, 400);
  }

  const rawCvv    = generateCVV();
  const rawNumber = generateCardNumber(cardType);
  const { month, year } = generateExpiry();

  const card = await cardRepo.create({
    accountId,
    cardNumber:     rawNumber,
    cardHolderName: account.full_name || 'CARD HOLDER',
    expiryMonth:    month,
    expiryYear:     year,
    cvv:            rawCvv,
    cardType,
    creditLimit: cardType === 'credit' ? (creditLimit || 5000) : null,
    design,
    balance: 0,
  });

  notify({
    userId,
    type:     'card_issued',
    title:    'New card issued',
    message:  `Your ${cardType} card (${design} design) has been issued successfully. Save the full card number and CVV — they are shown once only.`,
    severity: 'success',
    metadata: { cardId: card.id, cardType, design, last4: card.last4 },
  });

  // Plaintext values only exposed once at issuance — never stored unencrypted.
  // Do NOT log rawNumber or rawCvv.
  return {
    ...sanitizeCard(card),
    fullNumber: formatCardNumber(rawNumber),
    cvv:        rawCvv,
  };
};

const getMyCards = async (accountId) => {
  const cards = await cardRepo.findByAccountId(accountId);
  return cards.map(sanitizeCard);
};

/**
 * Returns decrypted card_number + cvv.
 * Only called AFTER PIN has been verified by the controller.
 * Card details are never logged.
 */
const getCardDetails = async (cardId, accountId) => {
  const card = await cardRepo.findByIdWithCVV(cardId);
  if (!card) throw new AppError('Card not found', 404);
  if (card.account_id !== accountId) throw new AppError('Forbidden', 403);
  if (!card.card_number || !card.cvv) throw new AppError('Card details unavailable', 500);

  return {
    ...sanitizeCard(card),
    cardNumber:  formatCardNumber(card.card_number),
    cvv:         card.cvv,
    expiryMonth: card.expiry_month,
    expiryYear:  card.expiry_year,
    expiry:      fmtExpiry(card.expiry_month, card.expiry_year),
  };
};

const freezeCard = async (cardId, accountId) => {
  const card = await cardRepo.findById(cardId);
  if (!card) throw new AppError('Card not found', 404);
  if (card.account_id !== accountId) throw new AppError('Forbidden', 403);

  const newStatus = card.status === 'frozen' ? 'active' : 'frozen';
  const updated   = await cardRepo.updateStatus(cardId, newStatus);
  return sanitizeCard(updated);
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const sanitizeCard = (c) => {
  const creditLimit = c.credit_limit ? parseFloat(c.credit_limit) : null;
  const creditUsed  = parseFloat(c.credit_used || 0);
  const isCredit    = c.card_type === 'credit';

  // last4 comes from the dedicated column (set on creation).
  // Fallback: if column missing, try to extract from a plaintext card_number.
  const last4 = c.last4
    || (c.card_number && !String(c.card_number).includes(':')
      ? String(c.card_number).replace(/\s/g, '').slice(-4)
      : null);

  return {
    id:             c.id,
    cardType:       c.card_type,
    design:         c.design || 'blue',
    maskedNumber:   last4 ? `•••• •••• •••• ${last4}` : '•••• •••• •••• ••••',
    last4:          last4 || '••••',
    cardHolderName: c.card_holder_name,
    expiryMonth:    c.expiry_month,
    expiryYear:     c.expiry_year,
    expiry:         fmtExpiry(c.expiry_month, c.expiry_year),
    status:         c.status,
    isActive:       c.is_active,
    balance:        parseFloat(c.balance || 0),
    availableBalance: isCredit
      ? (creditLimit !== null ? creditLimit - creditUsed : null)
      : parseFloat(c.account_balance || c.balance || 0),
    isVirtual:      c.is_virtual,
    creditLimit,
    creditUsed,
    availableCredit: creditLimit !== null ? creditLimit - creditUsed : null,
    createdAt:      c.created_at,
  };
};

const fmtExpiry = (month, year) => {
  if (!month || !year) return '••/••';
  return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
};

module.exports = { issueCard, getMyCards, getCardDetails, freezeCard };
