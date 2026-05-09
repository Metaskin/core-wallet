// Expected transaction direction for each category.
// 'credit' = money coming IN to the account holder.
// 'debit'  = money going OUT from the account holder.
const CATEGORY_DIRECTION = {
  SEA_DRILL_INTL:   'credit',
  PEER_TRANSFER:    'credit',
  RETAIL_STORE:     'debit',
  FOOD_OUTLET:      'debit',
  UTILITY_PROVIDER: 'debit',
  AUTO_FINANCE:     'debit',
};

const DEV_MERCHANT_MAP = {
  SEA_DRILL_INTL:   ['SEA DRILL-INTL'],
  RETAIL_STORE:     ['Walmart', 'Target'],
  FOOD_OUTLET:      ['KFC'],
  UTILITY_PROVIDER: ['Power Company'],
  AUTO_FINANCE:     ['Auto Finance'],
  PEER_TRANSFER:    ['Sarah K.', 'John Fields', 'Mike Osborne'],
};

/**
 * Returns a human-readable display name for the external counterparty.
 *
 * Dev:  maps category keys to realistic names with random selection.
 * Prod: returns the raw external_reference — no brand names, no fake data.
 *
 * Returns null when there is no external_reference so callers can fall
 * back to tx.fromName / tx.toName without showing empty strings.
 */
export function getDisplayName(tx) {
  const ref = tx.externalReference || tx.external_reference;
  if (!ref) return null;

  if (!import.meta.env.DEV) {
    return ref;
  }

  const options = DEV_MERCHANT_MAP[ref];
  if (!options) return ref;

  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Returns the expected transaction direction for a given external_reference key.
 * Useful for validation and seeding; does not override tx.type at render time.
 */
export function getExpectedDirection(ref) {
  return CATEGORY_DIRECTION[ref] || null;
}
