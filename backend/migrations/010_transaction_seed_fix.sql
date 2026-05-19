-- ══════════════════════════════════════════════════════════════════════════════
-- 010_transaction_seed_fix.sql
-- Safe re-insertion of seeded transactions using CTE + LIMIT 1 so that:
--   • Multiple checking accounts do not break the subquery
--   • Missing accounts produce 0 rows (no error, no orphan row)
--   • ON CONFLICT DO NOTHING makes this fully idempotent
--
-- Inserts (4 transactions):
--   1. Garanti BBVA  ATM failed  –$500    Jan 15 2025
--   2. İşbank        ATM failed  –$500    Jan 28 2025
--   3. Akbank        ATM failed  –$500    Feb  5 2025
--   4. Bosphorus Maritime Holdings wire pending +$7,500 Feb 27 2025
-- ══════════════════════════════════════════════════════════════════════════════

-- Reusable CTE alias — find the primary checking account for our user
-- (oldest checking account wins via ORDER BY created_at ASC LIMIT 1)

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
  'failed',
  '2025-01-15 09:15:00+00'
FROM uc
ON CONFLICT (reference) DO NOTHING;

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
  'failed',
  '2025-01-28 14:22:00+00'
FROM uc
ON CONFLICT (reference) DO NOTHING;

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
  'failed',
  '2025-02-05 11:44:00+00'
FROM uc
ON CONFLICT (reference) DO NOTHING;

-- Bosphorus Maritime Holdings — incoming pending wire (credit to checking account)
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
  (reference, type, receiver_account_id, amount, currency, description, status, created_at)
SELECT
  'WR-EXT-2025-000001', 'credit', uc.acct_id,
  7500.00, 'USD',
  'Bosphorus Maritime Holdings — International Wire Transfer',
  'pending',
  '2025-02-27 10:30:00+00'
FROM uc
ON CONFLICT (reference) DO NOTHING;
