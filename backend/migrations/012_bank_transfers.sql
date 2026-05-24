-- 012_bank_transfers.sql
-- Tables for Plaid-powered bank linking and external transfer records.
-- IMPORTANT: No real money moves through these tables; they record demo transfer
-- attempts only. The is_demo flag is always true unless ENABLE_REAL_TRANSFERS=true.

DO $$ BEGIN
  CREATE TYPE bank_transfer_status AS ENUM ('pending','processing','completed','failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- One row per Plaid Link item (institution connection authorised by the user)
CREATE TABLE IF NOT EXISTS plaid_link_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token     TEXT NOT NULL,   -- treat as a secret; never expose in API responses
  item_id          TEXT NOT NULL UNIQUE,
  institution_id   TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual bank accounts the user has linked (via Plaid or manually)
CREATE TABLE IF NOT EXISTS linked_bank_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plaid_item_id         UUID REFERENCES plaid_link_items(id) ON DELETE SET NULL,
  institution_name      TEXT NOT NULL,
  account_name          TEXT NOT NULL,
  account_type          TEXT NOT NULL DEFAULT 'checking',
  -- Only last-4 of routing/account are stored; full numbers are never persisted
  routing_number_last4  CHAR(4),
  account_number_last4  CHAR(4),
  is_manual             BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- External bank transfer records
CREATE TABLE IF NOT EXISTS bank_transfers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_account_id       UUID REFERENCES accounts(id) ON DELETE SET NULL,
  linked_account_id     UUID REFERENCES linked_bank_accounts(id) ON DELETE SET NULL,
  -- Snapshot of destination at submission time (preserved even if account is unlinked)
  institution_name      TEXT NOT NULL,
  account_name          TEXT NOT NULL,
  routing_number_last4  CHAR(4),
  account_number_last4  CHAR(4),
  amount                NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  memo                  TEXT,
  direction             TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound','outbound')),
  status                bank_transfer_status NOT NULL DEFAULT 'pending',
  is_demo               BOOLEAN NOT NULL DEFAULT true,
  failure_reason        TEXT,
  estimated_arrival     DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_transfers_user    ON bank_transfers(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_linked_accounts_user   ON linked_bank_accounts(user_id);
