-- ══════════════════════════════════════════════════════════════════════════════
-- 011_force_seed_transactions.sql
-- Definitive idempotent seed for the 4 required transactions.
--
-- WHY this migration exists:
--   Migration 009 used a scalar subquery (SELECT ...) with no FROM clause.
--   If the subquery returned NULL (account not found) the INSERT violated the
--   has_party CHECK constraint and FAILED SILENTLY inside the migration runner
--   catch block.  Migration 010 used ON CONFLICT DO NOTHING, which is also
--   wrong: if a previous run left the transaction with a null/wrong account ID
--   the conflict fires and the bad row is kept.
--
-- THIS migration uses ON CONFLICT (reference) DO UPDATE SET <account_id> =
-- EXCLUDED.<account_id>.  This means:
--   • If the row does not exist → INSERT it (account must be found by CTE)
--   • If the row exists with wrong account ID → UPDATE it to the correct one
--   • If the CTE returns 0 rows (no account found) → 0 rows to insert/update
--     (safe no-op, no error)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Garanti BBVA ATM – failed debit $500 ─────────────────────────────────────
WITH uc AS (
  SELECT a.id AS acct_id
  FROM   accounts a
  JOIN   users    u ON u.id = a.user_id
  WHERE  LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
  AND    a.account_type = 'checking'
  ORDER BY a.created_at ASC
  LIMIT  1
)
INSERT INTO transactions
  (reference, type, sender_account_id, amount, currency, description, status, created_at)
SELECT
  'ATM-FAIL-2025-001', 'debit', uc.acct_id,
  500.00, 'USD',
  'ATM Withdrawal — Garanti BBVA ATM Istanbul Turkey',
  'failed', '2025-01-15 09:15:00+00'
FROM uc
ON CONFLICT (reference) DO UPDATE SET
  sender_account_id = EXCLUDED.sender_account_id;

-- ── İşbank ATM – failed debit $500 ───────────────────────────────────────────
WITH uc AS (
  SELECT a.id AS acct_id
  FROM   accounts a
  JOIN   users    u ON u.id = a.user_id
  WHERE  LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
  AND    a.account_type = 'checking'
  ORDER BY a.created_at ASC
  LIMIT  1
)
INSERT INTO transactions
  (reference, type, sender_account_id, amount, currency, description, status, created_at)
SELECT
  'ATM-FAIL-2025-002', 'debit', uc.acct_id,
  500.00, 'USD',
  'ATM Withdrawal — İşbank ATM Istanbul Turkey',
  'failed', '2025-01-28 14:22:00+00'
FROM uc
ON CONFLICT (reference) DO UPDATE SET
  sender_account_id = EXCLUDED.sender_account_id;

-- ── Akbank ATM – failed debit $500 ───────────────────────────────────────────
WITH uc AS (
  SELECT a.id AS acct_id
  FROM   accounts a
  JOIN   users    u ON u.id = a.user_id
  WHERE  LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
  AND    a.account_type = 'checking'
  ORDER BY a.created_at ASC
  LIMIT  1
)
INSERT INTO transactions
  (reference, type, sender_account_id, amount, currency, description, status, created_at)
SELECT
  'ATM-FAIL-2025-003', 'debit', uc.acct_id,
  500.00, 'USD',
  'ATM Withdrawal — Akbank ATM Istanbul Turkey',
  'failed', '2025-02-05 11:44:00+00'
FROM uc
ON CONFLICT (reference) DO UPDATE SET
  sender_account_id = EXCLUDED.sender_account_id;

-- ── Bosphorus Maritime Holdings – pending credit wire $7,500 ─────────────────
WITH uc AS (
  SELECT a.id AS acct_id
  FROM   accounts a
  JOIN   users    u ON u.id = a.user_id
  WHERE  LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
  AND    a.account_type = 'checking'
  ORDER BY a.created_at ASC
  LIMIT  1
)
INSERT INTO transactions
  (reference, type, receiver_account_id, amount, currency,
   description, status, created_at, external_reference)
SELECT
  'WR-EXT-2025-000001', 'credit', uc.acct_id,
  7500.00, 'USD',
  'Bosphorus Maritime Holdings — International consulting payment pending clearance',
  'pending', '2025-02-27 10:30:00+00',
  'Bosphorus Maritime Holdings'
FROM uc
ON CONFLICT (reference) DO UPDATE SET
  receiver_account_id = EXCLUDED.receiver_account_id,
  external_reference  = EXCLUDED.external_reference,
  description         = EXCLUDED.description;
