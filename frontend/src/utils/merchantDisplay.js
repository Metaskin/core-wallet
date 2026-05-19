// ─── Legacy helpers (kept for any existing imports) ──────────────────────────

const CATEGORY_DIRECTION = {
  SEA_DRILL_INTL:   'credit',
  PEER_TRANSFER:    'credit',
  RETAIL_STORE:     'debit',
  FOOD_OUTLET:      'debit',
  UTILITY_PROVIDER: 'debit',
  AUTO_FINANCE:     'debit',
};

export function getExpectedDirection(ref) {
  return CATEGORY_DIRECTION[ref] || null;
}

export function getDisplayName(tx) {
  const ref = tx.externalReference || tx.external_reference;
  if (!ref || ref === 'System') return null;
  return ref;
}

// ─── Transaction classification ───────────────────────────────────────────────

const BILL_PATTERNS = [
  'insurance', 'electric service', 'gas of ohio', 'internet', 'heating',
  'monthly subscription', 'monthly service', 'monthly membership',
  'hulu', 'spotify', 'disney+', 'netflix', 'youtube premium',
  'amazon prime', 'apple icloud', 'spectrum',
];

const DIRECT_DEPOSIT_PATTERNS = ['payroll', 'direct deposit', 'salary', 'wages'];
const REFUND_PATTERNS          = ['refund', 'reimbursement', 'fsa reimbursement'];

function inferTxType(desc, type) {
  if (type === 'transfer') return 'Internal Transfer';
  const lower = (desc || '').toLowerCase();
  if (type === 'credit') {
    if (DIRECT_DEPOSIT_PATTERNS.some(p => lower.includes(p))) return 'Direct Deposit';
    if (REFUND_PATTERNS.some(p => lower.includes(p)))         return 'Refund';
    return 'ACH Credit';
  }
  if (lower.includes('atm'))  return 'ATM Withdrawal';
  if (lower.includes('wire')) return 'Wire Transfer';
  if (BILL_PATTERNS.some(p => lower.includes(p)))             return 'Bill Payment';
  return 'Card Purchase';
}

// When these appear before " — " they are transaction-type labels, not merchant names.
// The counterparty/location after the dash is the real merchant display name.
const TX_TYPE_PREFIXES = new Set(['payroll', 'atm withdrawal', 'wire transfer']);

function parseMerchantAndDetail(desc, type) {
  if (!desc) return { merchantName: null, subDetail: null };

  // "Transfer to/from X"
  const xfer = desc.match(/^Transfer (?:to|from) (.+)$/i);
  if (xfer) return { merchantName: xfer[1].trim(), subDetail: null };

  // "Entity — Detail"  (U+2014 em dash with surrounding spaces)
  const sep = desc.indexOf(' — ');
  if (sep !== -1) {
    const first  = desc.slice(0, sep).trim();
    const second = desc.slice(sep + 3).trim();
    // "Payroll — Company" or "ATM Withdrawal — Bank Location" → second part is the name
    if (TX_TYPE_PREFIXES.has(first.toLowerCase())) return { merchantName: second, subDetail: null };
    return { merchantName: first, subDetail: second };
  }

  // Fallback: use entire description as merchant
  return { merchantName: desc.trim(), subDetail: null };
}

function cleanBackendName(name) {
  if (!name || name === 'System') return null;
  return name
    .replace(/_(INTL|FAILED|INT|EXT)$/i, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim() || null;
}

/**
 * Derives structured display info from a transaction object.
 *
 * Returns:
 *   merchantName  — clean merchant / counterparty name (title case, no raw keys)
 *   txType        — banking classification (Card Purchase, Direct Deposit, …)
 *   subDetail     — optional secondary detail (category, memo, location)
 */
export function classifyTransaction(tx) {
  const desc = tx.description || '';
  const type = tx.type        || 'debit';

  const { merchantName: fromDesc, subDetail } = parseMerchantAndDetail(desc, type);

  let merchantName = fromDesc;

  if (!merchantName) {
    const raw = type === 'credit'
      ? (tx.fromName || tx.externalReference || tx.external_reference)
      : (tx.toName   || tx.externalReference || tx.external_reference);
    merchantName = cleanBackendName(raw);
  }

  return {
    merchantName: merchantName || 'Unknown',
    txType:       inferTxType(desc, type),
    subDetail:    subDetail || null,
  };
}

// Kept for backward compatibility — prefer classifyTransaction()
export function labelFromDescription(description) {
  if (!description) return null;
  const xfer = description.match(/^Transfer (?:to|from) (.+)$/i);
  if (xfer) return xfer[1].trim();
  const sep = description.indexOf(' — ');
  if (sep === -1) return description;
  const first  = description.slice(0, sep).trim();
  const second = description.slice(sep + 3).trim();
  if (first.toLowerCase() === 'payroll') return second;
  return first;
}
