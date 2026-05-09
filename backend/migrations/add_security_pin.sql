-- ============================================================
-- Add transaction PIN system
-- ============================================================

BEGIN;

-- 1. user_security_settings — stores hashed PIN per user
CREATE TABLE IF NOT EXISTS user_security_settings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  pin_hash   VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON user_security_settings(user_id);

-- updated_at trigger for the new table
DROP TRIGGER IF EXISTS trg_user_security_updated_at ON user_security_settings;
CREATE TRIGGER trg_user_security_updated_at
  BEFORE UPDATE ON user_security_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Allow 'virtual' as a card_type (safe — drops & re-adds constraint)
DO $$ BEGIN
  ALTER TABLE cards DROP CONSTRAINT IF EXISTS cards_card_type_check;
  ALTER TABLE cards ADD CONSTRAINT cards_card_type_check
    CHECK (card_type IN ('debit', 'credit', 'virtual'));
EXCEPTION WHEN others THEN NULL;
END $$;

COMMIT;
