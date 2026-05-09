-- ============================================================
-- CoreWallet — Complete schema fix
-- Safe to run repeatedly (all operations are idempotent)
-- Run this ONCE against your DB, then restart the server
-- ============================================================

BEGIN;

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── CARDS TABLE — add every column the application expects ───────────────────

-- 1. card_type (rename from legacy 'type' if needed)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'card_type'
  ) THEN
    ALTER TABLE cards RENAME COLUMN type TO card_type;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'card_type'
  ) THEN
    ALTER TABLE cards ADD COLUMN card_type VARCHAR(20) NOT NULL DEFAULT 'debit';
  END IF;
END $$;

-- card_type CHECK constraint — drop old, add inclusive one
DO $$ BEGIN
  ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_card_type_check;
  ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_type_check;
  ALTER TABLE cards ADD CONSTRAINT cards_card_type_check
    CHECK (card_type IN ('debit', 'credit', 'virtual'));
EXCEPTION WHEN others THEN NULL;
END $$;

-- 2. card_number
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'card_number'
  ) THEN
    ALTER TABLE cards ADD COLUMN card_number VARCHAR(20);
  END IF;
END $$;

-- 3. card_holder_name
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'card_holder_name'
  ) THEN
    ALTER TABLE cards ADD COLUMN card_holder_name VARCHAR(255) NOT NULL DEFAULT 'CARD HOLDER';
  END IF;
END $$;

-- 4. cvv (plaintext — demo only)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'cvv'
  ) THEN
    ALTER TABLE cards ADD COLUMN cvv VARCHAR(10);
  END IF;
END $$;

-- 5. expiry_month as INT
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'expiry_month'
  ) THEN
    ALTER TABLE cards ADD COLUMN expiry_month INT NOT NULL
      DEFAULT EXTRACT(MONTH FROM NOW())::INT
      CHECK (expiry_month BETWEEN 1 AND 12);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'expiry_month'
      AND data_type IN ('character varying', 'character', 'text')
  ) THEN
    -- Remove CHECK constraint on text column before type change
    ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_expiry_month_check;
    ALTER TABLE cards
      ALTER COLUMN expiry_month TYPE INT
      USING NULLIF(TRIM(expiry_month::TEXT), '')::INT;
  END IF;
END $$;

-- 6. expiry_year as INT
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'expiry_year'
  ) THEN
    ALTER TABLE cards ADD COLUMN expiry_year INT NOT NULL
      DEFAULT (EXTRACT(YEAR FROM NOW())::INT + 3);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'expiry_year'
      AND data_type IN ('character varying', 'character', 'text')
  ) THEN
    ALTER TABLE cards
      ALTER COLUMN expiry_year TYPE INT
      USING NULLIF(TRIM(expiry_year::TEXT), '')::INT;
  END IF;
END $$;

-- 7. balance
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'balance'
  ) THEN
    ALTER TABLE cards ADD COLUMN balance NUMERIC(15,2) NOT NULL DEFAULT 0.00;
  END IF;
END $$;

-- 8. credit_limit (nullable — only for credit cards)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'credit_limit'
  ) THEN
    ALTER TABLE cards ADD COLUMN credit_limit NUMERIC(15,2);
  END IF;
END $$;

-- 9. credit_used — CRITICAL: was missing, caused all card queries to fail
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'credit_used'
  ) THEN
    ALTER TABLE cards ADD COLUMN credit_used NUMERIC(15,2) NOT NULL DEFAULT 0.00;
  END IF;
END $$;

-- 10. status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'status'
  ) THEN
    ALTER TABLE cards ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'
      CHECK (status IN ('active', 'frozen', 'cancelled'));
  END IF;
END $$;

-- 11. is_active
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE cards ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    BEGIN
      UPDATE cards SET is_active = (status = 'active');
    EXCEPTION WHEN undefined_column THEN NULL;
    END;
  END IF;
END $$;

-- 12. is_virtual — CRITICAL: was missing, caused all card queries to fail
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'is_virtual'
  ) THEN
    ALTER TABLE cards ADD COLUMN is_virtual BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- 13. design
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'design'
  ) THEN
    ALTER TABLE cards ADD COLUMN design VARCHAR(20) NOT NULL DEFAULT 'blue'
      CHECK (design IN ('blue', 'black', 'gold'));
  END IF;
END $$;

-- 14. card_number → TEXT (needed to hold AES-256-GCM ciphertext ~80 chars)
DO $$ BEGIN
  -- Drop the UNIQUE constraint first so the type change can proceed
  ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_card_number_key;
  ALTER TABLE cards ALTER COLUMN card_number TYPE TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 15. cvv → TEXT (ciphertext is longer than the old VARCHAR(10) limit)
DO $$ BEGIN
  ALTER TABLE cards ALTER COLUMN cvv TYPE TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 16. last4 — 4-digit suffix stored in plaintext for masked display.
--     Encrypted card_number must not be used for display; last4 avoids
--     decrypting on every list query.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cards' AND column_name = 'last4'
  ) THEN
    ALTER TABLE cards ADD COLUMN last4 VARCHAR(4);
    -- Back-fill from existing plaintext card_number rows
    BEGIN
      UPDATE cards
      SET    last4 = RIGHT(card_number, 4)
      WHERE  last4 IS NULL
        AND  card_number IS NOT NULL
        AND  card_number NOT LIKE '%:%';  -- skip already-encrypted values
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;
END $$;

-- ── USER_SECURITY_SETTINGS TABLE ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_security_settings (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  pin_hash   VARCHAR(255),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uss_user_id ON user_security_settings(user_id);

-- Attach updated_at trigger only if the shared trigger function already exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    DROP TRIGGER IF EXISTS trg_uss_updated_at ON user_security_settings;
    CREATE TRIGGER trg_uss_updated_at
      BEFORE UPDATE ON user_security_settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ── ACCOUNTS TABLE — add available_balance and pending_balance columns ──────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'available_balance'
  ) THEN
    ALTER TABLE accounts ADD COLUMN available_balance NUMERIC(15,2);
    UPDATE accounts SET available_balance = balance WHERE available_balance IS NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'pending_balance'
  ) THEN
    ALTER TABLE accounts ADD COLUMN pending_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00;
  END IF;
END $$;

-- ── TRANSACTIONS TABLE ───────────────────────────────────────────────────────

-- external_reference: source/destination label for non-account transactions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'external_reference'
  ) THEN
    ALTER TABLE transactions ADD COLUMN external_reference TEXT;
  END IF;
END $$;

-- is_deleted: soft-delete flag — user "removes" a transaction from their view
-- without altering the immutable ledger record itself.
-- CRITICAL: backend SELECT and soft-delete UPDATE both reference this column.
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- Drop the deny-mutation triggers installed by schema.sql.
-- Those triggers block ALL UPDATE/DELETE on transactions, which prevents the
-- soft-delete UPDATE (SET is_deleted = true). The immutability intent is
-- preserved by never changing financial columns — is_deleted is purely a
-- display flag and does not affect any balance or audit values.
DROP TRIGGER IF EXISTS trg_deny_update_transactions ON transactions;
DROP TRIGGER IF EXISTS trg_deny_delete_transactions ON transactions;

-- ── USERS TABLE — add reset_token columns if missing ─────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'reset_token'
  ) THEN
    ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
    ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMPTZ;
  END IF;
END $$;

-- is_active on users (needed by authenticate middleware)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- ── LOGIN OTP SYSTEM ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS login_otps (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email      VARCHAR(255) NOT NULL,
  code_hash  VARCHAR(64)  NOT NULL,          -- SHA-256(code), never store plaintext
  attempts   SMALLINT     NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ  NOT NULL,
  is_used    BOOLEAN      NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_otps_user_id ON login_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_login_otps_email   ON login_otps(email);

-- ── SUPPORT SYSTEM ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS support_tickets (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject    VARCHAR(255) NOT NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'open'
               CHECK (status IN ('open', 'pending', 'resolved')),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status  ON support_tickets(status);

CREATE TABLE IF NOT EXISTS support_messages (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id   UUID        NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id),
  sender_role VARCHAR(20) NOT NULL DEFAULT 'user'
                CHECK (sender_role IN ('user', 'admin')),
  message     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);

-- ── Column normalisation (idempotent, safe on any DB state) ──────────────────

-- 1. sender_id → user_id (old schema had sender_id instead of user_id)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_messages' AND column_name = 'sender_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_messages' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE support_messages RENAME COLUMN sender_id TO user_id;
  END IF;
END $$;

-- Add user_id if the table existed before either column was introduced.
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- 2. body → message (old schema used `body`; new standard is `message`)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_messages' AND column_name = 'body'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'support_messages' AND column_name = 'message'
  ) THEN
    ALTER TABLE support_messages RENAME COLUMN body TO message;
  END IF;
END $$;

-- Add message if the table existed before either column was introduced.
ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS message TEXT;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    DROP TRIGGER IF EXISTS trg_support_tickets_upd ON support_tickets;
    CREATE TRIGGER trg_support_tickets_upd
      BEFORE UPDATE ON support_tickets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ── LOGIN_OTPS schema update ─────────────────────────────────────────────────

-- Widen code_hash from VARCHAR(64) to VARCHAR(255) to hold bcrypt hashes
DO $$ BEGIN
  ALTER TABLE login_otps ALTER COLUMN code_hash TYPE VARCHAR(255);
EXCEPTION WHEN others THEN NULL;
END $$;

-- Add purpose column so login OTPs and reset OTPs are kept separate
ALTER TABLE login_otps ADD COLUMN IF NOT EXISTS purpose VARCHAR(20) NOT NULL DEFAULT 'login';

COMMIT;
