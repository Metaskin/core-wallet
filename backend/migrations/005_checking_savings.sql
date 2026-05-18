-- ============================================================
-- 005_checking_savings.sql  (Neon-safe, no transaction wrapper)
-- ============================================================
-- Each statement runs and auto-commits independently.
-- Safe to re-run: all operations are fully idempotent.
-- Run each block in sequence in the Neon SQL editor.
-- ============================================================


-- ── Step 1: account_type column ───────────────────────────────
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) NOT NULL DEFAULT 'checking';

SELECT '✓ Step 1 — account_type column ready' AS progress;


-- ── Step 2: routing_number column ────────────────────────────
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS routing_number VARCHAR(20) NOT NULL DEFAULT '026009593';

SELECT '✓ Step 2 — routing_number column ready' AS progress;


-- ── Step 3: nickname column ───────────────────────────────────
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);

SELECT '✓ Step 3 — nickname column ready' AS progress;


-- ── Step 4: back-fill nicknames ───────────────────────────────
UPDATE accounts
SET nickname = CASE account_type
  WHEN 'savings' THEN 'Savings Account'
  ELSE                'Checking Account'
END
WHERE nickname IS NULL;

SELECT '✓ Step 4 — nicknames back-filled' AS progress;


-- ── Step 5: drop old single-account constraint (if present) ──
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE  conname    = 'accounts_user_id_key'
    AND    conrelid   = 'accounts'::regclass
  ) THEN
    ALTER TABLE accounts DROP CONSTRAINT accounts_user_id_key;
    RAISE NOTICE '✓ Step 5 — dropped accounts_user_id_key';
  ELSE
    RAISE NOTICE '✓ Step 5 — accounts_user_id_key not present (already removed)';
  END IF;
END $$;


-- ── Step 6: add composite unique (user_id, account_type) ─────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE  conname  = 'accounts_user_type_unique'
    AND    conrelid = 'accounts'::regclass
  ) THEN
    ALTER TABLE accounts
      ADD CONSTRAINT accounts_user_type_unique UNIQUE (user_id, account_type);
    RAISE NOTICE '✓ Step 6 — added accounts_user_type_unique constraint';
  ELSE
    RAISE NOTICE '✓ Step 6 — accounts_user_type_unique already exists';
  END IF;
END $$;


SELECT '✓ Migration 005 complete — checking/savings architecture ready' AS result;
