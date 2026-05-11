-- ============================================================
-- CoreWallet migration 003 — fix cards table schema conflicts
-- Safe to run repeatedly (all operations are idempotent)
-- Run against RDS before restarting the server:
--   psql "host=<RDS_HOST> dbname=corewallet user=postgres sslmode=require" -f backend/migrations/003_fix_cvv_hash.sql
-- ============================================================

BEGIN;

-- 1. cvv_hash: NOT NULL but never populated — the encrypted value lives in 'cvv'.
--    Drop the constraint so inserts succeed.
DO $$ BEGIN
  ALTER TABLE cards ALTER COLUMN cvv_hash DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. expiry_date: redundant — expiry_month + expiry_year are the canonical columns.
ALTER TABLE cards DROP COLUMN IF EXISTS expiry_date;

-- 3. used_credit: duplicate of credit_used — keep credit_used (used by all queries).
ALTER TABLE cards DROP COLUMN IF EXISTS used_credit;

-- 4. Ensure status defaults to 'active' so new inserts don't leave it NULL.
DO $$ BEGIN
  ALTER TABLE cards ALTER COLUMN status SET DEFAULT 'active';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. Ensure is_active defaults to true.
DO $$ BEGIN
  ALTER TABLE cards ALTER COLUMN is_active SET DEFAULT true;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMIT;
