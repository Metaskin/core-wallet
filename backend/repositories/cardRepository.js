const { pool }             = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');

// ── Safe columns for list/detail queries ──────────────────────────────────────
// card_number and cvv are NEVER selected here — they are encrypted at rest and
// only fetched (then decrypted) by findByIdWithCVV, which requires PIN verification.
const SAFE_COLS = `
  c.id, c.account_id, c.card_type, c.last4, c.card_holder_name,
  c.expiry_month, c.expiry_year, c.is_active, c.status, c.balance,
  c.credit_limit, c.credit_used, c.is_virtual, c.design, c.created_at,
  a.balance AS account_balance
`;

const create = async ({
  accountId, cardNumber, cardHolderName,
  expiryMonth, expiryYear, cvv,
  cardType = 'debit', creditLimit = null,
  design = 'blue', balance = 0,
}, client = pool) => {
  const last4          = String(cardNumber).replace(/\s/g, '').slice(-4);
  const encryptedNum   = encrypt(cardNumber);
  const encryptedCvv   = encrypt(cvv);

  const { rows } = await client.query(
    `INSERT INTO cards (
       account_id, card_type, card_number, last4, card_holder_name,
       expiry_month, expiry_year, cvv,
       credit_limit, design, balance
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id, account_id, card_type, last4, card_holder_name,
               expiry_month, expiry_year, is_active, status, balance,
               credit_limit, credit_used, is_virtual, design, created_at`,
    [accountId, cardType, encryptedNum, last4, cardHolderName,
     expiryMonth, expiryYear, encryptedCvv, creditLimit, design, balance]
  );
  return rows[0];
};

const findByAccountId = async (accountId, client = pool) => {
  const { rows } = await client.query(
    `SELECT ${SAFE_COLS}
     FROM cards c
     LEFT JOIN accounts a ON c.account_id = a.id
     WHERE c.account_id = $1
     ORDER BY c.created_at DESC`,
    [accountId]
  );
  return rows;
};

const findById = async (id, client = pool) => {
  const { rows } = await client.query(
    `SELECT ${SAFE_COLS}
     FROM cards c
     LEFT JOIN accounts a ON c.account_id = a.id
     WHERE c.id = $1`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Fetches the encrypted card_number and cvv, decrypts them in-process,
 * and returns a row with the plaintext values.
 * Only called by the PIN-verified secure-details endpoint.
 * Card details are NEVER logged here.
 */
const findByIdWithCVV = async (id, client = pool) => {
  const { rows } = await client.query(
    `SELECT ${SAFE_COLS}, c.card_number AS card_number_enc, c.cvv AS cvv_enc
     FROM cards c
     LEFT JOIN accounts a ON c.account_id = a.id
     WHERE c.id = $1`,
    [id]
  );
  if (!rows[0]) return null;

  const row = { ...rows[0] };
  row.card_number = decrypt(row.card_number_enc); // plaintext after decryption
  row.cvv         = decrypt(row.cvv_enc);
  delete row.card_number_enc;
  delete row.cvv_enc;
  return row;
};

const updateStatus = async (id, status, client = pool) => {
  const { rows } = await client.query(
    `UPDATE cards
     SET status = $1, is_active = $2
     WHERE id = $3
     RETURNING id, account_id, card_type, last4, card_holder_name,
               expiry_month, expiry_year, is_active, status, balance,
               credit_limit, credit_used, is_virtual, design, created_at`,
    [status, status === 'active', id]
  );
  return rows[0];
};

const updateCreditUsed = async (id, creditUsed, client = pool) => {
  const { rows } = await client.query(
    `UPDATE cards SET credit_used = $1 WHERE id = $2
     RETURNING id, account_id, card_type, last4, card_holder_name,
               expiry_month, expiry_year, is_active, status, balance,
               credit_limit, credit_used, is_virtual, design, created_at`,
    [creditUsed, id]
  );
  return rows[0];
};

module.exports = {
  create, findByAccountId, findById, findByIdWithCVV,
  updateStatus, updateCreditUsed,
};
