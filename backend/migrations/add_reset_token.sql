-- Safe migration: adds password-reset columns to users table
-- Run: psql -U postgres -d corewallet -f migrations/add_reset_token.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token         VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_reset_token
  ON users(reset_token)
  WHERE reset_token IS NOT NULL;
