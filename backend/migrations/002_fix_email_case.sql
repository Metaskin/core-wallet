-- ============================================================
-- CoreWallet — Migration 002: Fix email case-sensitivity
-- 
-- WHY THIS IS NEEDED
-- ------------------
-- The users table was created with:
--   email VARCHAR(255) UNIQUE NOT NULL
-- PostgreSQL UNIQUE constraints are CASE-SENSITIVE.
-- This means 'alice@test.com' and 'Alice@Test.com' can both exist
-- as separate rows — they satisfy the UNIQUE constraint differently.
--
-- The login lookup (findByEmail) uses LOWER() on both sides, so it
-- correctly finds users regardless of how their email is cased.
-- BUT if two rows match the same lowercase email, Postgres returns
-- an unpredictable row — meaning one user gets the wrong password_hash
-- and login always fails for them even with the correct password.
--
-- THE FIX (3 steps)
-- ------------------
-- Step 1: Normalise all stored emails to lowercase.
-- Step 2: Identify and handle any duplicate emails that become visible
--         after normalisation (they were stored as different-case versions
--         of the same address).
-- Step 3: Replace the case-sensitive UNIQUE constraint with a functional
--         unique index on LOWER(email) — this is the standard PostgreSQL
--         approach for case-insensitive unique columns.
--
-- HOW TO RUN
-- ----------
-- Connect to your database and run:
--   psql -U postgres -d corewallet -f migrations/002_fix_email_case.sql
--
-- This script is SAFE TO RUN MULTIPLE TIMES (idempotent).
-- It will not change data that is already correct.
-- ============================================================

BEGIN;

-- ── STEP 1: Show which users have mixed-case emails (for your records) ────────
-- This SELECT prints a report before making any changes.
-- You will see any affected rows in the output.
DO $$
DECLARE
  mixed_count INT;
BEGIN
  SELECT COUNT(*) INTO mixed_count
  FROM users
  WHERE email != LOWER(email);

  IF mixed_count > 0 THEN
    RAISE NOTICE '⚠  Found % user(s) with mixed-case emails. They will be normalised to lowercase.', mixed_count;
  ELSE
    RAISE NOTICE '✓  All emails are already lowercase. No data changes needed.';
  END IF;
END $$;

-- ── STEP 2: Check for duplicate emails (case-insensitive) ────────────────────
-- If two rows have the same lowercase email, we cannot simply normalise them —
-- one would violate the new unique constraint.
-- This block raises an ERROR and ROLLS BACK if duplicates are found,
-- so you can review and resolve them manually before proceeding.
DO $$
DECLARE
  dup_count INT;
  dup_emails TEXT;
BEGIN
  SELECT COUNT(*), STRING_AGG(LOWER(email), ', ' ORDER BY LOWER(email))
  INTO dup_count, dup_emails
  FROM (
    SELECT LOWER(email) AS email
    FROM users
    GROUP BY LOWER(email)
    HAVING COUNT(*) > 1
  ) dupes;

  IF dup_count > 0 THEN
    RAISE EXCEPTION
      E'DUPLICATE EMAILS FOUND — migration aborted.\n'
      'The following email(s) appear more than once with different casing:\n  %\n\n'
      'ACTION REQUIRED:\n'
      '  1. Run the diagnostic query below to see the duplicate rows:\n'
      '     SELECT id, email, created_at FROM users\n'
      '     WHERE LOWER(email) IN (%)\n'
      '     ORDER BY LOWER(email), created_at;\n'
      '  2. Decide which account to keep (usually the older one).\n'
      '  3. Move any important data from the duplicate to the primary account.\n'
      '  4. DELETE the duplicate row.\n'
      '  5. Re-run this migration.\n',
      dup_emails, dup_emails;
  END IF;
END $$;

-- ── STEP 3: Normalise all emails to lowercase ─────────────────────────────────
UPDATE users
SET email = LOWER(TRIM(email))
WHERE email != LOWER(TRIM(email));

-- ── STEP 4: Drop the old case-sensitive unique constraint ─────────────────────
-- The constraint name is 'users_email_key' by PostgreSQL convention.
-- The DO block handles the case where it may have a custom name.
DO $$
BEGIN
  -- Drop by convention name first
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
EXCEPTION WHEN others THEN
  NULL; -- constraint may not exist with that name
END $$;

-- Also drop any other unique constraints on the email column
-- (handles databases where the constraint was named differently)
DO $$
DECLARE
  cname TEXT;
BEGIN
  FOR cname IN
    SELECT conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    WHERE t.relname = 'users'
      AND a.attname = 'email'
      AND c.contype = 'u'  -- unique constraint (not index-based)
  LOOP
    EXECUTE format('ALTER TABLE users DROP CONSTRAINT IF EXISTS %I', cname);
    RAISE NOTICE 'Dropped constraint: %', cname;
  END LOOP;
END $$;

-- Also drop any existing unique index on the raw email column
-- (in case it was created as an index rather than a constraint)
DROP INDEX IF EXISTS users_email_idx;
DROP INDEX IF EXISTS idx_users_email;

-- ── STEP 5: Create the correct case-insensitive unique index ──────────────────
-- A functional index on LOWER(email) enforces uniqueness across all
-- case variations ('alice@x.com', 'Alice@X.com', 'ALICE@X.COM' all
-- collide against this index). Postgres uses this index for
-- WHERE email = LOWER($1) queries — fast and correct.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower
  ON users (LOWER(email));

-- ── STEP 6: Verify ────────────────────────────────────────────────────────────
DO $$
DECLARE
  idx_exists BOOLEAN;
  remaining_mixed INT;
BEGIN
  -- Check the index was created
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'idx_users_email_lower'
  ) INTO idx_exists;

  -- Check no mixed-case emails remain
  SELECT COUNT(*) INTO remaining_mixed
  FROM users WHERE email != LOWER(email);

  IF idx_exists AND remaining_mixed = 0 THEN
    RAISE NOTICE '✓  Migration 002 completed successfully.';
    RAISE NOTICE '   - All emails normalised to lowercase.';
    RAISE NOTICE '   - Case-insensitive unique index applied.';
    RAISE NOTICE '   - Login will now work reliably for all users.';
  ELSE
    RAISE EXCEPTION 'Migration verification failed. idx_exists=%, remaining_mixed=%',
      idx_exists, remaining_mixed;
  END IF;
END $$;

COMMIT;
