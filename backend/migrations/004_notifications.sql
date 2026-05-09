-- ============================================================
-- CoreWallet migration 004 — notifications table
-- Safe to run repeatedly (all CREATE/ALTER are IF NOT EXISTS)
-- Run against the database before restarting the server:
--   psql "host=<host> dbname=corewallet user=postgres sslmode=require" \
--        -f backend/migrations/004_notifications.sql
-- ============================================================

BEGIN;

-- Enable gen_random_uuid() if not already available (PostgreSQL < 13 needs pgcrypto)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(60)  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     TEXT         NOT NULL,
  severity    VARCHAR(20)  NOT NULL DEFAULT 'info'
              CHECK (severity IN ('info', 'success', 'warning', 'critical')),
  metadata    JSONB,
  is_read     BOOLEAN      NOT NULL DEFAULT false,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Fast lookup: all unread for a user (the most common query — badge count + panel load)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read, created_at DESC);

-- Fast lookup: all recent for a user (full panel list, ordered newest-first)
CREATE INDEX IF NOT EXISTS idx_notifications_user_recent
  ON notifications (user_id, created_at DESC);

COMMIT;

-- Verify
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
