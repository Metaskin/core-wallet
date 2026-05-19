-- ══════════════════════════════════════════════════════════════════════════════
-- 009_fixes_and_settings.sql
-- 1. Settings tables: user_profiles, user_notification_preferences,
--    user_security_settings
-- 2. Credit score history fix (score → 700, correct metrics)
-- 3. Remove mock loans/mortgage (user has no active loans)
-- 4. Add pending Bosphorus Maritime wire (+$7,500, Feb 27 2025)
-- 5. Add 3 failed Istanbul ATM withdrawals (Jan–Feb 2025)
-- Idempotent — safe to re-run on Neon PostgreSQL
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. USER PROFILES TABLE ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id                         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                    UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone                      VARCHAR(20),
  date_of_birth              DATE,
  nationality                VARCHAR(60),
  occupation                 VARCHAR(100),
  employer                   VARCHAR(150),
  address_line1              VARCHAR(200),
  address_line2              VARCHAR(100),
  city                       VARCHAR(100),
  state                      VARCHAR(50),
  zip_code                   VARCHAR(10),
  country                    VARCHAR(60)  DEFAULT 'United States',
  mailing_same_as_primary    BOOLEAN      DEFAULT true,
  mailing_address_line1      VARCHAR(200),
  mailing_city               VARCHAR(100),
  mailing_state              VARCHAR(50),
  mailing_zip_code           VARCHAR(10),
  profile_photo_url          TEXT,
  preferred_language         VARCHAR(10)  DEFAULT 'en',
  timezone                   VARCHAR(50)  DEFAULT 'America/New_York',
  created_at                 TIMESTAMPTZ  DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ  DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 2. USER NOTIFICATION PREFERENCES TABLE ───────────────────────────────────
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID        UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_enabled          BOOLEAN     DEFAULT true,
  email_enabled         BOOLEAN     DEFAULT true,
  sms_enabled           BOOLEAN     DEFAULT false,
  deposit_alerts        BOOLEAN     DEFAULT true,
  transaction_alerts    BOOLEAN     DEFAULT true,
  security_alerts       BOOLEAN     DEFAULT true,
  weekly_summary        BOOLEAN     DEFAULT true,
  monthly_summary       BOOLEAN     DEFAULT true,
  marketing             BOOLEAN     DEFAULT false,
  quiet_hours_enabled   BOOLEAN     DEFAULT false,
  quiet_hours_start     TIME        DEFAULT '22:00',
  quiet_hours_end       TIME        DEFAULT '08:00',
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. USER SECURITY SETTINGS TABLE ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_security_settings (
  id                     UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID        UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  two_factor_enabled     BOOLEAN     DEFAULT false,
  two_factor_method      VARCHAR(20) DEFAULT 'none' CHECK (two_factor_method IN ('none','totp','sms')),
  auto_logout_minutes    INT         DEFAULT 30,
  biometric_enabled      BOOLEAN     DEFAULT false,
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════════════════════
-- SEED DATA for smmy23538@gmail.com
-- ══════════════════════════════════════════════════════════════════════════════

-- ── USER PROFILE ─────────────────────────────────────────────────────────────
INSERT INTO user_profiles (user_id, phone, date_of_birth, nationality, occupation, employer,
  address_line1, city, state, zip_code, country)
SELECT u.id, '(614) 555-0194', '1988-03-15', 'American',
       'Senior IT Consultant', 'Accenture Federal Services',
       '4721 Riverside Dr', 'Columbus', 'Ohio', '43219', 'United States'
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- ── NOTIFICATION PREFERENCES (default on) ────────────────────────────────────
INSERT INTO user_notification_preferences (user_id)
SELECT u.id FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- ── SECURITY SETTINGS ────────────────────────────────────────────────────────
INSERT INTO user_security_settings (user_id, two_factor_enabled, auto_logout_minutes)
SELECT u.id, false, 30 FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- CREDIT SCORE HISTORY FIX
-- Target: score=700, utilization=21%, payment_history=98%,
--         credit_age=6yr, hard_inquiries=1
-- Update all seeded months with a realistic 680→700 trend
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 680, '2024-12', 28.5, 97.0, 5.2, 2
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 683, '2025-01', 27.2, 97.0, 5.3, 2
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 686, '2025-02', 25.8, 97.5, 5.3, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 689, '2025-03', 24.3, 98.0, 5.4, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 691, '2025-04', 23.1, 98.0, 5.5, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 693, '2025-05', 22.4, 98.0, 5.5, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 695, '2025-06', 21.9, 98.0, 5.6, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 696, '2025-07', 22.5, 98.0, 5.7, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 698, '2025-08', 21.2, 98.0, 5.7, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 699, '2025-09', 21.8, 98.0, 5.8, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 700, '2025-10', 21.5, 98.0, 5.8, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 699, '2025-11', 21.7, 98.0, 5.9, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 698, '2025-12', 22.1, 97.5, 6.0, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 699, '2026-01', 21.4, 98.0, 6.1, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 700, '2026-02', 21.1, 98.0, 6.1, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 700, '2026-03', 21.3, 98.0, 6.2, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 700, '2026-04', 21.0, 98.0, 6.2, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 700, '2026-05', 21.0, 98.0, 6.0, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO UPDATE SET
  score = EXCLUDED.score, utilization_pct = EXCLUDED.utilization_pct,
  payment_history_pct = EXCLUDED.payment_history_pct,
  credit_age_years = EXCLUDED.credit_age_years, hard_inquiries = EXCLUDED.hard_inquiries;

-- ══════════════════════════════════════════════════════════════════════════════
-- REMOVE MOCK MORTGAGE LOAN (user has no active loans)
-- loan_payments cascade deletes automatically
-- ══════════════════════════════════════════════════════════════════════════════
DELETE FROM loans WHERE loan_number = 'WF-2023-0847291';

-- Remove any other seeded loans for this user
DELETE FROM loans WHERE user_id = (
  SELECT id FROM users WHERE LOWER(TRIM(email)) = 'smmy23538@gmail.com'
);

-- ══════════════════════════════════════════════════════════════════════════════
-- FAILED ISTANBUL ATM WITHDRAWALS (Jan–Feb 2025, do NOT affect balance)
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO transactions (reference, type, sender_account_id, amount, description, status, created_at)
SELECT
  'ATM-FAIL-2025-001', 'debit',
  (SELECT id FROM accounts WHERE user_id =
    (SELECT id FROM users WHERE LOWER(TRIM(email)) = 'smmy23538@gmail.com')
    AND account_type = 'checking'),
  500.00,
  'ATM Withdrawal — Garanti BBVA ATM Istanbul Turkey',
  'failed',
  '2025-01-15 09:15:00+00'
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference, type, sender_account_id, amount, description, status, created_at)
SELECT
  'ATM-FAIL-2025-002', 'debit',
  (SELECT id FROM accounts WHERE user_id =
    (SELECT id FROM users WHERE LOWER(TRIM(email)) = 'smmy23538@gmail.com')
    AND account_type = 'checking'),
  500.00,
  'ATM Withdrawal — İşbank ATM Istanbul Turkey',
  'failed',
  '2025-01-28 14:22:00+00'
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference, type, sender_account_id, amount, description, status, created_at)
SELECT
  'ATM-FAIL-2025-003', 'debit',
  (SELECT id FROM accounts WHERE user_id =
    (SELECT id FROM users WHERE LOWER(TRIM(email)) = 'smmy23538@gmail.com')
    AND account_type = 'checking'),
  500.00,
  'ATM Withdrawal — Akbank ATM Istanbul Turkey',
  'failed',
  '2025-02-05 11:44:00+00'
ON CONFLICT (reference) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════════════════
-- PENDING INCOMING WIRE — Bosphorus Maritime Holdings (+$7,500, Feb 27 2025)
-- Status = 'pending' so it does NOT affect available balance
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO transactions (reference, type, receiver_account_id, amount, description, status, created_at)
SELECT
  'WR-EXT-2025-000001', 'credit',
  (SELECT id FROM accounts WHERE user_id =
    (SELECT id FROM users WHERE LOWER(TRIM(email)) = 'smmy23538@gmail.com')
    AND account_type = 'checking'),
  7500.00,
  'Bosphorus Maritime Holdings — International Wire Transfer',
  'pending',
  '2025-02-27 10:30:00+00'
ON CONFLICT (reference) DO NOTHING;
