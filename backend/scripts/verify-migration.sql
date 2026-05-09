-- CoreWallet — verify-migration.sql
--
-- Run these queries against BOTH databases (local and RDS) and compare.
-- They are read-only SELECT queries — no writes.
--
-- pgAdmin: open a query window, select your server, paste and run.
-- psql:    psql -h <host> -U postgres -d corewallet -f scripts/verify-migration.sql

-- ── 1. Database identity ──────────────────────────────────────────────────────
SELECT
  current_database()  AS database_name,
  current_user        AS connected_as,
  inet_server_addr()  AS server_ip,
  inet_server_port()  AS server_port,
  version()           AS pg_version;

-- ── 2. Row counts for every table ─────────────────────────────────────────────
SELECT
  table_name,
  (xpath('/row/c/text()',
    query_to_xml(format('SELECT COUNT(*) AS c FROM %I', table_name), true, true, ''))
  )[1]::text::int AS row_count
FROM information_schema.tables
WHERE table_schema = 'current_schema()'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Simpler version (run each line individually if the above fails):
SELECT 'users'                 AS tbl, COUNT(*) FROM users;
SELECT 'accounts'              AS tbl, COUNT(*) FROM accounts;
SELECT 'transactions'          AS tbl, COUNT(*) FROM transactions;
SELECT 'cards'                 AS tbl, COUNT(*) FROM cards;
SELECT 'sessions'              AS tbl, COUNT(*) FROM sessions;
SELECT 'login_otps'            AS tbl, COUNT(*) FROM login_otps;
SELECT 'admin_logs'            AS tbl, COUNT(*) FROM admin_logs;
SELECT 'user_security_settings' AS tbl, COUNT(*) FROM user_security_settings;
SELECT 'support_tickets'       AS tbl, COUNT(*) FROM support_tickets;
SELECT 'support_messages'      AS tbl, COUNT(*) FROM support_messages;

-- ── 3. Users — email list and hash type ───────────────────────────────────────
SELECT
  id,
  LOWER(TRIM(email))                                        AS email,
  full_name,
  role,
  is_active,
  CASE WHEN password_hash LIKE '$2%' THEN 'bcrypt  ✓'
       ELSE                               'PLAIN TEXT ← upgrade needed'
  END                                                       AS hash_type,
  created_at
FROM users
ORDER BY created_at;

-- ── 4. Accounts — balances ────────────────────────────────────────────────────
SELECT
  a.id                 AS account_id,
  a.account_number,
  u.email              AS owner_email,
  a.balance,
  a.currency,
  a.status
FROM accounts a
JOIN users u ON u.id = a.user_id
ORDER BY a.created_at;

-- ── 5. Balance totals ─────────────────────────────────────────────────────────
SELECT
  COUNT(*)                     AS total_accounts,
  SUM(balance)::numeric(15,2)  AS total_funds_held,
  currency
FROM accounts
GROUP BY currency;

-- ── 6. Transactions — last 10 ─────────────────────────────────────────────────
SELECT
  t.reference,
  t.type,
  t.amount,
  t.currency,
  t.status,
  sa.account_number  AS from_account,
  ra.account_number  AS to_account,
  t.created_at
FROM transactions t
LEFT JOIN accounts sa ON sa.id = t.sender_account_id
LEFT JOIN accounts ra ON ra.id = t.receiver_account_id
ORDER BY t.created_at DESC
LIMIT 10;

-- ── 7. Cards per account ──────────────────────────────────────────────────────
SELECT
  c.id,
  c.last4,
  c.card_type,
  c.status,
  a.account_number
FROM cards c
JOIN accounts a ON a.id = c.account_id
ORDER BY c.created_at;

-- ── 8. Check for emails in local NOT in RDS (run on LOCAL db) ─────────────────
-- Run this on LOCAL postgres. If the result is empty after migration, all done.
--
-- SELECT LOWER(TRIM(email)) AS email, full_name, created_at
-- FROM users
-- WHERE LOWER(TRIM(email)) NOT IN (
--   -- Replace the dblink call with a subquery if dblink is not installed.
--   -- If you cannot run cross-database queries, compare the two outputs manually.
--   SELECT 'placeholder'  -- swap with actual RDS user list
-- )
-- ORDER BY email;

-- ── 9. Duplicate email detection (run on both databases) ──────────────────────
SELECT
  LOWER(TRIM(email)) AS normalized_email,
  COUNT(*)           AS occurrences,
  array_agg(id)      AS user_ids
FROM users
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1;
-- Expected: 0 rows (no duplicates)

-- ── 10. Foreign key integrity check ──────────────────────────────────────────
-- Accounts without a matching user (should be 0 rows)
SELECT a.id, a.user_id FROM accounts a
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = a.user_id);

-- Transactions referencing non-existent accounts (should be 0 rows)
SELECT t.id, t.sender_account_id, t.receiver_account_id FROM transactions t
WHERE (t.sender_account_id   IS NOT NULL AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = t.sender_account_id))
   OR (t.receiver_account_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = t.receiver_account_id));

-- Cards without a matching account (should be 0 rows)
SELECT c.id, c.account_id FROM cards c
WHERE NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = c.account_id);
