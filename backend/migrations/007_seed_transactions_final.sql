-- ================================================================
-- 007_seed_transactions_final.sql
-- CoreWallet — Full transaction seed for smmy23538@gmail.com
-- ================================================================
-- Neon PostgreSQL compatible
-- Flat SQL only — no DO $$ blocks, no BEGIN/COMMIT wrapper
-- Every statement auto-commits independently
-- Safe to rerun: soft-delete step hides old data, ON CONFLICT
--   DO NOTHING prevents any duplicate on subsequent runs
-- Reference range TXN-YYYY-910XXX reserved for demo/seed data
--   (live sequence starts at 1000, user refs use 000XXX range)
-- ================================================================
-- Run in Neon SQL editor — paste the entire file at once
-- ================================================================


-- ================================================================
-- SECTION 0: PRE-FLIGHT VERIFICATION
-- Confirm the target user and both accounts exist before proceeding
-- ================================================================

SELECT
  u.full_name,
  u.email,
  u.is_active
FROM users u
WHERE LOWER(u.email) = 'smmy23538@gmail.com';

SELECT
  a.account_type,
  a.balance,
  a.available_balance,
  a.account_number,
  a.status
FROM accounts a
WHERE a.user_id = (
  SELECT id FROM users WHERE LOWER(email) = 'smmy23538@gmail.com'
)
ORDER BY a.account_type;

SELECT '✓ Pre-flight complete — proceeding with seed' AS step;


-- ================================================================
-- SECTION 1: SOFT-DELETE PREVIOUS SEED TRANSACTIONS
-- Marks all existing transactions for this user as is_deleted=true
-- They remain in the ledger (immutable) but are hidden from the UI
-- The UPDATE only changes is_deleted — financial fields stay intact
-- The relaxed deny_transaction_mutation() trigger allows this
-- ================================================================

UPDATE transactions
SET    is_deleted = true
WHERE  is_deleted = false
  AND (
    receiver_account_id IN (
      SELECT id FROM accounts
      WHERE user_id = (SELECT id FROM users WHERE LOWER(email) = 'smmy23538@gmail.com')
    )
    OR
    sender_account_id IN (
      SELECT id FROM accounts
      WHERE user_id = (SELECT id FROM users WHERE LOWER(email) = 'smmy23538@gmail.com')
    )
  );

SELECT '✓ Section 1 — previous transactions soft-deleted' AS step;


-- ================================================================
-- SECTION 2: 2022 TRANSACTIONS  (35 rows — TXN-2022-910001..910035)
-- Salary: $5,500.00 / month
-- Inline subqueries resolve account IDs at insert time
-- CHK = checking account, SAV = savings account
-- ================================================================

-- ── January 2022 ──────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910001','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5500.00,'Payroll — Accenture Federal Services','completed','2022-01-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910002','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 134.22,'AEP Ohio — Electric Service','completed','2022-01-19 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910003','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 178.90,'Columbia Gas of Ohio — Heating','completed','2022-01-22 08:02:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── February 2022 ─────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910004','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5500.00,'Payroll — Accenture Federal Services','completed','2022-02-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910005','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 79.99,'Spectrum — Internet & Cable','completed','2022-02-15 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910006','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 34.67,'CVS Pharmacy #4521 — Prescription','completed','2022-02-18 11:30:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── March 2022 ────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910007','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5500.00,'Payroll — Accenture Federal Services','completed','2022-03-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910008','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 98.56,'AEP Ohio — Electric Service','completed','2022-03-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910009','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 103.45,'Meijer #0312 — Grocery','completed','2022-03-22 19:05:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── April 2022 ────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910010','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5500.00,'Payroll — Accenture Federal Services','completed','2022-04-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910011','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 245.00,'OhioHealth — FSA Reimbursement','completed','2022-04-15 10:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910012','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 9.99,'Spotify Premium — Monthly Subscription','completed','2022-04-22 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── May 2022 ──────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910013','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5500.00,'Payroll — Accenture Federal Services','completed','2022-05-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910014','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 79.99,'Spectrum — Internet & Cable','completed','2022-05-15 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910015','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 112.34,'Giant Eagle #0234 — Grocery','completed','2022-05-22 18:30:00+00')
ON CONFLICT (reference) DO NOTHING;

-- Transfer: checking → savings
INSERT INTO transactions (reference,type,sender_account_id,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910016','transfer',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='savings'),
 1000.00,'Transfer to Core Savings','completed','2022-05-28 12:00:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── June 2022 ─────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910017','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5500.00,'Payroll — Accenture Federal Services','completed','2022-06-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910018','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 145.78,'AEP Ohio — Electric Service','completed','2022-06-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910019','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 52.40,'Speedway #7734 — Fuel','completed','2022-06-22 07:45:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── July 2022 ─────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910020','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5500.00,'Payroll — Accenture Federal Services','completed','2022-07-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910021','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 167.50,'AEP Ohio — Electric Service','completed','2022-07-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── August 2022 ───────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910022','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5500.00,'Payroll — Accenture Federal Services','completed','2022-08-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910023','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 167.89,'Costco Wholesale #0612 — Bulk Grocery','completed','2022-08-18 10:45:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910024','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 28.45,'Bob Evans Restaurant — Westerville OH','completed','2022-08-22 12:30:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── September 2022 ────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910025','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5500.00,'Payroll — Accenture Federal Services','completed','2022-09-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910026','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 79.99,'Spectrum — Internet & Cable','completed','2022-09-15 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── October 2022 ──────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910027','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5500.00,'Payroll — Accenture Federal Services','completed','2022-10-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910028','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 156.78,'Columbia Gas of Ohio — Heating','completed','2022-10-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910029','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 14.99,'Amazon Prime — Monthly Membership','completed','2022-10-23 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── November 2022 ─────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910030','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5500.00,'Payroll — Accenture Federal Services','completed','2022-11-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910031','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 134.56,'Walmart Supercenter #3421 — Grocery','completed','2022-11-17 17:45:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910032','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 17.99,'Hulu — Monthly Subscription','completed','2022-11-21 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910033','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 200.00,'ATM Withdrawal — Fifth Third Bank Columbus OH','completed','2022-11-25 09:15:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── December 2022 ─────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910034','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5500.00,'Payroll — Accenture Federal Services','completed','2022-12-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-910035','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 212.67,'Columbia Gas of Ohio — Heating','completed','2022-12-16 08:02:00+00')
ON CONFLICT (reference) DO NOTHING;

SELECT '✓ Section 2 — 2022 transactions seeded (35 rows)' AS step;


-- ================================================================
-- SECTION 3: 2023 TRANSACTIONS  (32 rows — TXN-2023-910001..910032)
-- Salary: $5,812.50 / month  (+5.7% raise)
-- ================================================================

-- ── January 2023 ──────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910001','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5812.50,'Payroll — Accenture Federal Services','completed','2023-01-13 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910002','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 145.67,'AEP Ohio — Electric Service','completed','2023-01-18 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910003','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 189.34,'Columbia Gas of Ohio — Heating','completed','2023-01-21 08:02:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── February 2023 ─────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910004','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5812.50,'Payroll — Accenture Federal Services','completed','2023-02-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910005','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 84.99,'Spectrum — Internet & Cable','completed','2023-02-15 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910006','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 45.78,'CVS Pharmacy #4521 — Prescription','completed','2023-02-22 14:30:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── March 2023 ────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910007','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5812.50,'Payroll — Accenture Federal Services','completed','2023-03-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910008','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 95.23,'Giant Eagle #0234 — Grocery','completed','2023-03-18 19:20:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910009','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 13.99,'Disney+ — Monthly Subscription','completed','2023-03-25 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── April 2023 ────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910010','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5812.50,'Payroll — Accenture Federal Services','completed','2023-04-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910011','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 312.50,'OhioHealth — FSA Reimbursement','completed','2023-04-15 10:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910012','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 78.34,'Target #0891 — General Merchandise','completed','2023-04-22 17:55:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── May 2023 ──────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910013','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5812.50,'Payroll — Accenture Federal Services','completed','2023-05-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910014','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 84.99,'Spectrum — Internet & Cable','completed','2023-05-15 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910015','transfer',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='savings'),
 750.00,'Transfer to Core Savings','completed','2023-05-25 12:00:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── June 2023 ─────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910016','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5812.50,'Payroll — Accenture Federal Services','completed','2023-06-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910017','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 167.89,'AEP Ohio — Electric Service','completed','2023-06-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910018','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 58.40,'Speedway #7734 — Fuel','completed','2023-06-22 07:45:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── July 2023 ─────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910019','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5812.50,'Payroll — Accenture Federal Services','completed','2023-07-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910020','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 178.90,'AEP Ohio — Electric Service','completed','2023-07-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910021','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 112.67,'Meijer #0312 — Grocery','completed','2023-07-22 19:30:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── August 2023 ───────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910022','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5812.50,'Payroll — Accenture Federal Services','completed','2023-08-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910023','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 412.00,'Delta Air Lines — Flight CMH-MIA','completed','2023-08-15 06:30:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── September 2023 ────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910024','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5812.50,'Payroll — Accenture Federal Services','completed','2023-09-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910025','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 213.00,'Marriott Columbus Downtown — 2 Nights','completed','2023-09-12 14:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910026','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 200.00,'ATM Withdrawal — Fifth Third Bank Columbus OH','completed','2023-09-22 09:15:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── October 2023 ──────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910027','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5812.50,'Payroll — Accenture Federal Services','completed','2023-10-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910028','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 178.45,'Columbia Gas of Ohio — Heating','completed','2023-10-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910029','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 14.99,'Amazon Prime — Monthly Membership','completed','2023-10-25 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── November 2023 ─────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910030','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5812.50,'Payroll — Accenture Federal Services','completed','2023-11-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910031','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 156.78,'Walmart Supercenter #3421 — Grocery','completed','2023-11-20 17:45:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── December 2023 ─────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-910032','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 5812.50,'Payroll — Accenture Federal Services','completed','2023-12-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

SELECT '✓ Section 3 — 2023 transactions seeded (32 rows)' AS step;


-- ================================================================
-- SECTION 4: 2024 TRANSACTIONS  (30 rows — TXN-2024-910001..910030)
-- Salary: $6,123.00 / month  (+5.3% raise)
-- ================================================================

-- ── January 2024 ──────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910001','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6123.00,'Payroll — Accenture Federal Services','completed','2024-01-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910002','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 189.45,'AEP Ohio — Electric Service','completed','2024-01-18 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910003','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 201.34,'Columbia Gas of Ohio — Heating','completed','2024-01-21 08:02:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── February 2024 ─────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910004','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6123.00,'Payroll — Accenture Federal Services','completed','2024-02-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910005','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 84.99,'Spectrum — Internet & Cable','completed','2024-02-15 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910006','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 67.89,'CVS Pharmacy #4521 — Prescription','completed','2024-02-22 11:30:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── March 2024 ────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910007','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6123.00,'Payroll — Accenture Federal Services','completed','2024-03-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910008','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 112.45,'Giant Eagle #0234 — Grocery','completed','2024-03-18 19:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910009','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 13.99,'YouTube Premium — Monthly Subscription','completed','2024-03-22 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── April 2024 ────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910010','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6123.00,'Payroll — Accenture Federal Services','completed','2024-04-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910011','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 489.00,'OhioHealth — FSA Reimbursement','completed','2024-04-15 10:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910012','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 94.50,'Amazon.com — Online Order','completed','2024-04-20 15:45:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── May 2024 ──────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910013','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6123.00,'Payroll — Accenture Federal Services','completed','2024-05-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910014','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 84.99,'Spectrum — Internet & Cable','completed','2024-05-15 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910015','transfer',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='savings'),
 1000.00,'Transfer to Core Savings','completed','2024-05-25 12:00:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── June 2024 ─────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910016','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6123.00,'Payroll — Accenture Federal Services','completed','2024-06-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910017','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 167.34,'AEP Ohio — Electric Service','completed','2024-06-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910018','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 54.20,'Speedway #7734 — Fuel','completed','2024-06-22 07:45:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── July 2024 ─────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910019','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6123.00,'Payroll — Accenture Federal Services','completed','2024-07-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910020','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 189.56,'AEP Ohio — Electric Service','completed','2024-07-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

-- International ATM withdrawal — Banco Santander, Madrid Spain (completed, outside US)
INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910021','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 300.00,'ATM Withdrawal — Banco Santander Madrid Spain','completed','2024-07-25 15:30:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── August 2024 ───────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910022','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6123.00,'Payroll — Accenture Federal Services','completed','2024-08-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910023','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 287.00,'Southwest Airlines — Flight CMH-ORD','completed','2024-08-12 10:00:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── September 2024 ────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910024','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6123.00,'Payroll — Accenture Federal Services','completed','2024-09-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── October 2024 ──────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910025','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6123.00,'Payroll — Accenture Federal Services','completed','2024-10-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910026','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 167.89,'Columbia Gas of Ohio — Heating','completed','2024-10-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910027','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 2.99,'Apple iCloud+ — Monthly Subscription','completed','2024-10-23 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── November 2024 ─────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910028','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6123.00,'Payroll — Accenture Federal Services','completed','2024-11-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910029','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 287.45,'Costco Wholesale #0612 — Bulk Grocery','completed','2024-11-28 13:45:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── December 2024 ─────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-910030','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6123.00,'Payroll — Accenture Federal Services','completed','2024-12-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

SELECT '✓ Section 4 — 2024 transactions seeded (30 rows)' AS step;


-- ================================================================
-- SECTION 5: 2025 TRANSACTIONS  (32 rows — TXN-2025-910001..910032)
-- Salary: $6,400.00 / month  (+4.5% raise)
-- Includes 5 FAILED gift card purchases in December 2025
-- ================================================================

-- ── January 2025 ──────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910001','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6400.00,'Payroll — Accenture Federal Services','completed','2025-01-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910002','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 198.56,'AEP Ohio — Electric Service','completed','2025-01-18 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910003','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 213.45,'Columbia Gas of Ohio — Heating','completed','2025-01-21 08:02:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── February 2025 ─────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910004','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6400.00,'Payroll — Accenture Federal Services','completed','2025-02-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910005','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 84.99,'Spectrum — Internet & Cable','completed','2025-02-15 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── March 2025 ────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910006','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6400.00,'Payroll — Accenture Federal Services','completed','2025-03-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910007','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 567.00,'OhioHealth — FSA Reimbursement','completed','2025-03-20 10:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910008','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 98.67,'Giant Eagle #0234 — Grocery','completed','2025-03-22 18:45:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── April 2025 ────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910009','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6400.00,'Payroll — Accenture Federal Services','completed','2025-04-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910010','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 45.67,'CVS Pharmacy #4521 — Prescription','completed','2025-04-22 14:30:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── May 2025 ──────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910011','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6400.00,'Payroll — Accenture Federal Services','completed','2025-05-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910012','transfer',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='savings'),
 500.00,'Transfer to Core Savings','completed','2025-05-25 12:00:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── June 2025 ─────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910013','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6400.00,'Payroll — Accenture Federal Services','completed','2025-06-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910014','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 178.90,'AEP Ohio — Electric Service','completed','2025-06-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910015','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 16.78,'Chipotle Mexican Grill — Columbus OH','completed','2025-06-20 12:50:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── July 2025 ─────────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910016','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6400.00,'Payroll — Accenture Federal Services','completed','2025-07-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910017','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 9.99,'Spotify Premium — Monthly Subscription','completed','2025-07-22 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910018','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 300.00,'ATM Withdrawal — Huntington Bank Columbus OH','completed','2025-07-26 09:30:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── August 2025 ───────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910019','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6400.00,'Payroll — Accenture Federal Services','completed','2025-08-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910020','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 489.00,'Delta Air Lines — Flight CMH-LAX','completed','2025-08-12 06:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910021','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 289.00,'Marriott Cincinnati — 2 Nights','completed','2025-08-18 14:00:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── September 2025 ────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910022','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6400.00,'Payroll — Accenture Federal Services','completed','2025-09-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910023','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 267.89,'Costco Wholesale #0612 — Bulk Grocery','completed','2025-09-14 13:45:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910024','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 134.56,'Columbia Gas of Ohio — Heating','completed','2025-09-16 08:02:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── October 2025 ──────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910025','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6400.00,'Payroll — Accenture Federal Services','completed','2025-10-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910026','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 145.00,'Progressive Insurance — Auto Coverage','completed','2025-10-16 08:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910027','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 78.34,'Walgreens #2341 — Prescription','completed','2025-10-22 11:20:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── November 2025 ─────────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910028','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6400.00,'Payroll — Accenture Federal Services','completed','2025-11-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910029','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 234.56,'Amazon.com — Online Order','completed','2025-11-22 16:30:00+00')
ON CONFLICT (reference) DO NOTHING;

-- Transfer back from savings for holiday spending
INSERT INTO transactions (reference,type,sender_account_id,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910030','transfer',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='savings'),
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 2000.00,'Transfer from Core Savings','completed','2025-11-25 12:00:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── December 2025 — payroll + normal spending ─────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910031','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6400.00,'Payroll — Accenture Federal Services','completed','2025-12-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910032','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 24.56,'Panera Bread — Easton Town Center','completed','2025-12-03 12:15:00+00')
ON CONFLICT (reference) DO NOTHING;

-- ── December 2025 — FAILED gift card fraud cluster ────────────
-- Five rapid declined attempts: pattern consistent with account takeover test
-- All flagged as status='failed'; no funds were moved

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910033','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 100.00,'Amazon Gift Card — $100 Digital','failed','2025-12-12 02:14:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910034','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 200.00,'Amazon Gift Card — $200 Digital','failed','2025-12-12 02:16:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910035','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 50.00,'Apple Gift Card — $50 App Store','failed','2025-12-12 02:18:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910036','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 100.00,'Apple Gift Card — $100 iTunes','failed','2025-12-12 02:21:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910037','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 250.00,'Amazon Gift Card — $250 Digital','failed','2025-12-12 02:24:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-910038','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 223.45,'AEP Ohio — Electric Service','completed','2025-12-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

SELECT '✓ Section 5 — 2025 transactions seeded (38 rows, 5 failed gift cards)' AS step;


-- ================================================================
-- SECTION 6: 2026 TRANSACTIONS  (5 rows — TXN-2026-910001..910005)
-- Salary: $6,500.00 / month  (Jan 2026 — new raise)
-- Two FAILED ATM withdrawals ($500 each) in January 2026
-- ================================================================

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2026-910001','credit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 6500.00,'Payroll — Accenture Federal Services','completed','2026-01-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

-- FAILED ATM withdrawal #1 — Chase Bank, Chicago IL
INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2026-910002','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 500.00,'ATM Withdrawal — Chase Bank Chicago IL','failed','2026-01-17 03:22:00+00')
ON CONFLICT (reference) DO NOTHING;

-- FAILED ATM withdrawal #2 — Wells Fargo, Cincinnati OH
INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2026-910003','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 500.00,'ATM Withdrawal — Wells Fargo Cincinnati OH','failed','2026-01-17 03:31:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2026-910004','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 245.67,'AEP Ohio — Electric Service','completed','2026-01-20 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2026-910005','debit',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 89.45,'Kroger #0342 — Grocery','completed','2026-01-25 14:30:00+00')
ON CONFLICT (reference) DO NOTHING;

SELECT '✓ Section 6 — 2026 transactions seeded (5 rows, 2 failed ATM)' AS step;


-- ================================================================
-- SECTION 7: NOTIFICATIONS
-- Fixed UUIDs — idempotent via ON CONFLICT (id) DO NOTHING
-- ================================================================

INSERT INTO notifications (id, user_id, type, title, message, severity, is_read, created_at)
VALUES (
  '00000001-0000-4000-8000-000000000001',
  (SELECT id FROM users WHERE LOWER(email) = 'smmy23538@gmail.com'),
  'account_ready',
  'Welcome to CoreWallet',
  'Your checking and savings accounts are set up and ready to use.',
  'success',
  true,
  '2022-01-14 09:00:00+00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, user_id, type, title, message, severity, is_read, created_at)
VALUES (
  '00000001-0000-4000-8000-000000000002',
  (SELECT id FROM users WHERE LOWER(email) = 'smmy23538@gmail.com'),
  'deposit_received',
  'Direct Deposit Received',
  'A direct deposit of $5,500.00 from Accenture Federal Services has been credited to your checking account.',
  'success',
  true,
  '2022-01-14 09:06:00+00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, user_id, type, title, message, severity, is_read, created_at)
VALUES (
  '00000001-0000-4000-8000-000000000003',
  (SELECT id FROM users WHERE LOWER(email) = 'smmy23538@gmail.com'),
  'transfer_complete',
  'Transfer Complete',
  '$1,000.00 has been moved from your Checking Account to your Core Savings account.',
  'info',
  true,
  '2022-05-28 12:01:00+00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, user_id, type, title, message, severity, is_read, created_at)
VALUES (
  '00000001-0000-4000-8000-000000000004',
  (SELECT id FROM users WHERE LOWER(email) = 'smmy23538@gmail.com'),
  'savings_milestone',
  'Savings Milestone',
  'Your savings account balance has passed $10,000. Great progress toward your financial goals.',
  'success',
  true,
  '2024-12-01 09:00:00+00'
) ON CONFLICT (id) DO NOTHING;

-- Security alerts for the Dec 2025 failed gift card cluster
INSERT INTO notifications (id, user_id, type, title, message, severity, is_read, created_at)
VALUES (
  '00000001-0000-4000-8000-000000000005',
  (SELECT id FROM users WHERE LOWER(email) = 'smmy23538@gmail.com'),
  'security_alert',
  'Unusual Activity Detected',
  '5 gift card purchase attempts were declined on your account early this morning. If this wasn''t you, please contact support immediately.',
  'critical',
  false,
  '2025-12-12 06:00:00+00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, user_id, type, title, message, severity, is_read, created_at)
VALUES (
  '00000001-0000-4000-8000-000000000006',
  (SELECT id FROM users WHERE LOWER(email) = 'smmy23538@gmail.com'),
  'security_alert',
  'ATM Withdrawal Blocked',
  'Two ATM withdrawal attempts of $500.00 each were declined on Jan 17. If this wasn''t you, your card may be compromised.',
  'critical',
  false,
  '2026-01-17 04:00:00+00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, user_id, type, title, message, severity, is_read, created_at)
VALUES (
  '00000001-0000-4000-8000-000000000007',
  (SELECT id FROM users WHERE LOWER(email) = 'smmy23538@gmail.com'),
  'account_review',
  'Account Review Recommended',
  'We recommend reviewing your recent transactions and updating your PIN for added security.',
  'warning',
  false,
  '2026-01-17 08:00:00+00'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (id, user_id, type, title, message, severity, is_read, created_at)
VALUES (
  '00000001-0000-4000-8000-000000000008',
  (SELECT id FROM users WHERE LOWER(email) = 'smmy23538@gmail.com'),
  'deposit_received',
  'Direct Deposit Received',
  'Your January payroll of $6,500.00 from Accenture Federal Services has been deposited.',
  'success',
  false,
  '2026-01-14 09:06:00+00'
) ON CONFLICT (id) DO NOTHING;

SELECT '✓ Section 7 — 8 notifications seeded' AS step;


-- ================================================================
-- SECTION 8: FINAL SANITY CHECKS
-- Run these to confirm all data landed correctly
-- ================================================================

-- Total transaction count by year (should show 35/32/30/38/5)
SELECT
  LEFT(reference, 8)                     AS year_prefix,
  COUNT(*)                               AS total,
  COUNT(*) FILTER (WHERE status='completed') AS completed,
  COUNT(*) FILTER (WHERE status='failed')    AS failed,
  COUNT(*) FILTER (WHERE is_deleted=true)    AS soft_deleted
FROM transactions
WHERE reference LIKE 'TXN-%-910%'
  AND (
    receiver_account_id IN (
      SELECT id FROM accounts WHERE user_id = (SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com')
    )
    OR
    sender_account_id IN (
      SELECT id FROM accounts WHERE user_id = (SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com')
    )
  )
GROUP BY LEFT(reference, 8)
ORDER BY LEFT(reference, 8);

-- Unread notification count
SELECT COUNT(*) AS unread_notifications
FROM notifications
WHERE user_id = (SELECT id FROM users WHERE LOWER(email) = 'smmy23538@gmail.com')
  AND is_read = false;

-- Account balances (unchanged — seed only adds transactions, not balance updates)
SELECT account_type, balance, available_balance
FROM accounts
WHERE user_id = (SELECT id FROM users WHERE LOWER(email) = 'smmy23538@gmail.com')
ORDER BY account_type;

-- Card status check
SELECT card_type, last4, status, card_holder_name, expiry_month, expiry_year
FROM cards
WHERE account_id IN (
  SELECT id FROM accounts WHERE user_id = (SELECT id FROM users WHERE LOWER(email) = 'smmy23538@gmail.com')
);

SELECT '✓ Seed complete — CoreWallet demo data ready' AS final_status;
