-- 005_checking_savings.sql
-- Adds proper checking/savings account architecture.
-- SAFE: fully idempotent — can be re-run on the same DB without error.

BEGIN;

-- 1. Add account_type column; existing accounts become 'checking' by default
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) NOT NULL DEFAULT 'checking';

-- 2. Add shared institution routing number
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS routing_number VARCHAR(20) NOT NULL DEFAULT '026009593';

-- 3. Add optional user-friendly nickname
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);

-- 4. Back-fill nicknames for existing rows
UPDATE accounts
SET nickname = CASE account_type
  WHEN 'savings'  THEN 'Savings Account'
  ELSE 'Checking Account'
END
WHERE nickname IS NULL;

-- 5. Drop the old single-account-per-user UNIQUE constraint on user_id
--    (allows one checking + one savings per user going forward)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'accounts_user_id_key'
    AND   conrelid = 'accounts'::regclass
  ) THEN
    ALTER TABLE accounts DROP CONSTRAINT accounts_user_id_key;
  END IF;
END $$;

-- 6. Add composite unique: at most one account of each type per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'accounts_user_type_unique'
    AND   conrelid = 'accounts'::regclass
  ) THEN
    ALTER TABLE accounts
      ADD CONSTRAINT accounts_user_type_unique UNIQUE (user_id, account_type);
  END IF;
END $$;

COMMIT;
