const cardService     = require('../services/cardService');
const securityService = require('../services/securityService');
const asyncHandler    = require('../utils/asyncHandler');
const AppError        = require('../utils/AppError');
const { pool }        = require('../config/database');
const { notify }      = require('../services/notificationService');

const issueCard = asyncHandler(async (req, res) => {
  if (!req.account) throw new AppError('Account not found', 404);
  const { type, cardType, design, creditLimit } = req.body;
  const card = await cardService.issueCard({
    userId:    req.user.id,
    accountId: req.account.id,
    cardType:  cardType || type || 'debit',
    design:    design   || 'blue',
    creditLimit,
  });
  res.status(201).json({
    status:  'success',
    message: 'Card issued. Save the full number and CVV — shown once only.',
    data:    { card },
  });
});

const getMyCards = asyncHandler(async (req, res) => {
  if (!req.account) return res.json({ status: 'success', data: { cards: [] } });
  try {
    const cards = await cardService.getMyCards(req.account.id);
    res.json({ status: 'success', data: { cards } });
  } catch (err) {
    if (err.code === '42703' || err.code === '42P01') {
      console.error('[Cards] Schema not ready (restart server to auto-migrate):', err.message);
      return res.json({ status: 'success', data: { cards: [] } });
    }
    throw err;
  }
});

/**
 * POST /api/cards/:id/details
 * POST /api/cards/:id/secure-details  (legacy alias)
 *
 * Verifies the user's transaction PIN, then returns the decrypted card fields.
 * Card number, CVV, and expiry are NEVER logged — not here, not in the service.
 *
 * Rate-limited by middleware: 10 attempts per 15-minute window per user.
 */
const getSecureDetails = asyncHandler(async (req, res) => {
  if (!req.account) throw new AppError('Account not found', 404);

  const { pin } = req.body;
  if (!pin) throw new AppError('PIN is required', 400);

  // Throws 400 (no PIN set) or 401 (wrong PIN) — do not catch here
  await securityService.verifyPin(req.user.id, pin);

  const details = await cardService.getCardDetails(req.params.id, req.account.id);

  // Response matches the documented spec:
  // { status, data: { cardNumber, cvv, expiryMonth, expiryYear, expiry, … } }
  // No card fields are written to any log.
  res.json({
    status: 'success',
    data:   details,
  });
});

const toggleFreeze = asyncHandler(async (req, res) => {
  if (!req.account) throw new AppError('Account not found', 404);
  const card = await cardService.freezeCard(req.params.id, req.account.id);
  res.json({ status: 'success', data: { card } });
});

const requestReplacement = asyncHandler(async (req, res) => {
  if (!req.account) throw new AppError('Account not found', 404);

  const { reason } = req.body;

  // Find the card and verify it belongs to an account owned by this user
  const { rows: cardRows } = await pool.query(
    `SELECT c.* FROM cards c
     JOIN accounts a ON a.id = c.account_id
     WHERE c.id = $1 AND a.user_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!cardRows.length) throw new AppError('Card not found', 404);
  const card = cardRows[0];

  // If a replacement is already in progress (not 'none' or 'delivered')
  const blockedStatuses = ['requested', 'approved', 'printing', 'shipped'];
  if (blockedStatuses.includes(card.replacement_status)) {
    throw new AppError('A replacement is already in progress', 409);
  }

  const { rows: updatedRows } = await pool.query(
    `UPDATE cards
     SET replacement_status       = 'requested',
         replacement_requested_at = NOW(),
         updated_at               = NOW()
     WHERE id = $1
     RETURNING *`,
    [card.id]
  );
  const updatedCard = updatedRows[0];

  notify({
    userId:   req.user.id,
    type:     'card_replacement_requested',
    title:    'Card replacement requested',
    message:  `A replacement for your card ending in ${card.last_four || card.card_number_last4 || '****'} has been requested${reason ? ` (${reason})` : ''}.`,
    severity: 'info',
    metadata: { cardId: card.id, reason: reason || null },
  });

  res.status(200).json({ status: 'success', data: { card: updatedCard } });
});

const getReplacement = asyncHandler(async (req, res) => {
  if (!req.account) throw new AppError('Account not found', 404);

  const { rows: cardRows } = await pool.query(
    `SELECT c.* FROM cards c
     JOIN accounts a ON a.id = c.account_id
     WHERE c.id = $1 AND a.user_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!cardRows.length) throw new AppError('Card not found', 404);
  const card = cardRows[0];

  let expectedDelivery = null;
  if (card.replacement_requested_at) {
    const delivery = new Date(card.replacement_requested_at);
    delivery.setDate(delivery.getDate() + 5);
    expectedDelivery = delivery.toISOString();
  }

  res.status(200).json({
    status: 'success',
    data:   {
      replacementStatus:      card.replacement_status      || 'none',
      replacementRequestedAt: card.replacement_requested_at || null,
      expectedDelivery,
    },
  });
});

module.exports = { issueCard, getMyCards, getSecureDetails, toggleFreeze, requestReplacement, getReplacement };
