-- ══════════════════════════════════════════════════════════════════════════════
-- 008_banking_services.sql
-- Full Banking Services: autopay, loans, investments, beneficiaries,
-- travel_notices, check_deposits, wire_transfers, billers, bill_payments,
-- credit_score_history, cashback_rewards, card replacement columns
-- Idempotent — safe to re-run on Neon PostgreSQL (flat SQL, no DO $$ blocks)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. AUTOPAY ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS autopay (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID         NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  account_id   UUID         NOT NULL REFERENCES accounts(id)  ON DELETE CASCADE,
  name         VARCHAR(100) NOT NULL,
  biller       VARCHAR(150) NOT NULL,
  amount       DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  category     VARCHAR(50)  DEFAULT 'other'
                 CHECK (category IN ('utilities','mortgage','subscriptions','insurance','credit_card','other')),
  frequency    VARCHAR(20)  NOT NULL
                 CHECK (frequency IN ('weekly','biweekly','monthly','custom')),
  custom_day   INT          CHECK (custom_day BETWEEN 1 AND 31),
  next_due_date DATE        NOT NULL,
  status       VARCHAR(20)  DEFAULT 'active'
                 CHECK (status IN ('active','paused','cancelled')),
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_autopay_user_id  ON autopay(user_id);
CREATE INDEX IF NOT EXISTS idx_autopay_next_due ON autopay(next_due_date) WHERE status = 'active';

DROP TRIGGER IF EXISTS trg_autopay_updated_at ON autopay;
CREATE TRIGGER trg_autopay_updated_at
  BEFORE UPDATE ON autopay FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 2. LOANS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loans (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID         NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  account_id        UUID         REFERENCES accounts(id),
  loan_type         VARCHAR(30)  NOT NULL
                      CHECK (loan_type IN ('personal','mortgage','auto','student','home_equity')),
  lender            VARCHAR(150),
  loan_number       VARCHAR(50)  UNIQUE,
  principal         DECIMAL(15,2) NOT NULL CHECK (principal > 0),
  remaining_balance DECIMAL(15,2) NOT NULL CHECK (remaining_balance >= 0),
  interest_rate     DECIMAL(6,3) NOT NULL CHECK (interest_rate >= 0),
  monthly_payment   DECIMAL(15,2) NOT NULL CHECK (monthly_payment > 0),
  term_months       INT          NOT NULL,
  start_date        DATE         NOT NULL,
  next_due_date     DATE,
  status            VARCHAR(20)  DEFAULT 'active'
                      CHECK (status IN ('active','paid_off','defaulted','deferred')),
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);

DROP TRIGGER IF EXISTS trg_loans_updated_at ON loans;
CREATE TRIGGER trg_loans_updated_at
  BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS loan_payments (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id           UUID         NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount            DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  principal_paid    DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (principal_paid >= 0),
  interest_paid     DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (interest_paid >= 0),
  remaining_balance DECIMAL(15,2) NOT NULL CHECK (remaining_balance >= 0),
  status            VARCHAR(20)  DEFAULT 'completed'
                      CHECK (status IN ('pending','completed','failed')),
  payment_date      TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id);

-- ── 3. INVESTMENTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS investment_accounts (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_number      VARCHAR(20)  UNIQUE NOT NULL,
  balance             DECIMAL(15,2) DEFAULT 0.00 CHECK (balance >= 0),
  daily_gain_loss     DECIMAL(15,2) DEFAULT 0.00,
  daily_gain_loss_pct DECIMAL(8,4) DEFAULT 0.00,
  total_return        DECIMAL(15,2) DEFAULT 0.00,
  total_return_pct    DECIMAL(8,4) DEFAULT 0.00,
  status              VARCHAR(20)  DEFAULT 'active'
                        CHECK (status IN ('active','inactive')),
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_investment_accounts_updated_at ON investment_accounts;
CREATE TRIGGER trg_investment_accounts_updated_at
  BEFORE UPDATE ON investment_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS investment_holdings (
  id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_account_id UUID         NOT NULL REFERENCES investment_accounts(id) ON DELETE CASCADE,
  symbol                VARCHAR(10)  NOT NULL,
  name                  VARCHAR(100) NOT NULL,
  asset_type            VARCHAR(20)  DEFAULT 'stock'
                          CHECK (asset_type IN ('stock','etf','bond','mutual_fund','crypto','other')),
  shares                DECIMAL(15,6) NOT NULL CHECK (shares >= 0),
  avg_cost              DECIMAL(15,4) NOT NULL CHECK (avg_cost > 0),
  current_price         DECIMAL(15,4) NOT NULL CHECK (current_price > 0),
  current_value         DECIMAL(15,2) NOT NULL DEFAULT 0,
  gain_loss             DECIMAL(15,2) NOT NULL DEFAULT 0,
  gain_loss_pct         DECIMAL(8,4)  NOT NULL DEFAULT 0,
  allocation_pct        DECIMAL(8,4)  DEFAULT 0.00,
  updated_at            TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (investment_account_id, symbol)
);
CREATE INDEX IF NOT EXISTS idx_investment_holdings_account ON investment_holdings(investment_account_id);

CREATE TABLE IF NOT EXISTS investment_transactions (
  id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_account_id UUID         NOT NULL REFERENCES investment_accounts(id) ON DELETE CASCADE,
  type                  VARCHAR(20)  NOT NULL
                          CHECK (type IN ('buy','sell','dividend','deposit','withdrawal','transfer')),
  symbol                VARCHAR(10),
  name                  VARCHAR(100),
  shares                DECIMAL(15,6),
  price                 DECIMAL(15,4),
  amount                DECIMAL(15,2) NOT NULL,
  description           VARCHAR(255),
  status                VARCHAR(20)  DEFAULT 'completed'
                          CHECK (status IN ('pending','completed','failed')),
  created_at            TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_investment_tx_account ON investment_transactions(investment_account_id, created_at DESC);

-- ── 4. BENEFICIARIES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beneficiaries (
  id                   UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                 VARCHAR(100) NOT NULL,
  relationship         VARCHAR(50)  NOT NULL,
  date_of_birth        DATE,
  email                VARCHAR(255),
  phone                VARCHAR(20),
  address              TEXT,
  percentage           DECIMAL(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  is_emergency_contact BOOLEAN      DEFAULT false,
  created_at           TIMESTAMPTZ  DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user_id ON beneficiaries(user_id);

DROP TRIGGER IF EXISTS trg_beneficiaries_updated_at ON beneficiaries;
CREATE TRIGGER trg_beneficiaries_updated_at
  BEFORE UPDATE ON beneficiaries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 5. TRAVEL NOTICES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS travel_notices (
  id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination             VARCHAR(150) NOT NULL,
  destination_country     VARCHAR(3),
  start_date              DATE         NOT NULL,
  end_date                DATE         NOT NULL,
  emergency_contact_name  VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  notes                   TEXT,
  status                  VARCHAR(20)  DEFAULT 'active'
                            CHECK (status IN ('active','completed','cancelled')),
  created_at              TIMESTAMPTZ  DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_travel_notices_user_id ON travel_notices(user_id);

DROP TRIGGER IF EXISTS trg_travel_notices_updated_at ON travel_notices;
CREATE TRIGGER trg_travel_notices_updated_at
  BEFORE UPDATE ON travel_notices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 6. CHECK DEPOSITS ────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS deposit_reference_seq START 1;

CREATE TABLE IF NOT EXISTS check_deposits (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id        UUID         NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount            DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  check_number      VARCHAR(20),
  memo              TEXT,
  status            VARCHAR(20)  DEFAULT 'pending'
                      CHECK (status IN ('pending','reviewing','approved','rejected','cancelled')),
  front_image_data  TEXT,
  back_image_data   TEXT,
  rejection_reason  TEXT,
  availability_date DATE,
  reference         VARCHAR(30)  UNIQUE NOT NULL,
  created_at        TIMESTAMPTZ  DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_check_deposits_account ON check_deposits(account_id);

DROP TRIGGER IF EXISTS trg_check_deposits_updated_at ON check_deposits;
CREATE TRIGGER trg_check_deposits_updated_at
  BEFORE UPDATE ON check_deposits FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 7. WIRE TRANSFERS ────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS wire_reference_seq START 1;

CREATE TABLE IF NOT EXISTS wire_transfers (
  id                       UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id               UUID         NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type                     VARCHAR(20)  NOT NULL CHECK (type IN ('domestic','international')),
  recipient_name           VARCHAR(150) NOT NULL,
  recipient_bank           VARCHAR(150) NOT NULL,
  routing_number           VARCHAR(20),
  recipient_account_number VARCHAR(40)  NOT NULL,
  swift_bic                VARCHAR(11),
  iban                     VARCHAR(34),
  amount                   DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  currency                 VARCHAR(3)   DEFAULT 'USD',
  fee                      DECIMAL(15,2) DEFAULT 0.00,
  memo                     TEXT,
  reference                VARCHAR(30)  UNIQUE NOT NULL,
  status                   VARCHAR(30)  DEFAULT 'pending'
                             CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  estimated_delivery       DATE,
  created_at               TIMESTAMPTZ  DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wire_transfers_account ON wire_transfers(account_id);

DROP TRIGGER IF EXISTS trg_wire_transfers_updated_at ON wire_transfers;
CREATE TRIGGER trg_wire_transfers_updated_at
  BEFORE UPDATE ON wire_transfers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 8. BILL PAY ──────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS bill_reference_seq START 1;

CREATE TABLE IF NOT EXISTS billers (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           VARCHAR(150) NOT NULL,
  account_number VARCHAR(50),
  category       VARCHAR(50)  DEFAULT 'other'
                   CHECK (category IN ('utilities','insurance','rent','subscription','credit_card','phone','internet','other')),
  is_active      BOOLEAN      DEFAULT true,
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_billers_user_id ON billers(user_id);

CREATE TABLE IF NOT EXISTS bill_payments (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  biller_id      UUID         NOT NULL REFERENCES billers(id) ON DELETE CASCADE,
  account_id     UUID         NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  amount         DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  scheduled_date DATE         NOT NULL,
  payment_date   TIMESTAMPTZ,
  due_date       DATE,
  memo           TEXT,
  reference      VARCHAR(30)  UNIQUE NOT NULL,
  status         VARCHAR(20)  DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled','processing','completed','failed','cancelled')),
  is_recurring   BOOLEAN      DEFAULT false,
  frequency      VARCHAR(20)  CHECK (frequency IN ('weekly','biweekly','monthly')),
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bill_payments_biller  ON bill_payments(biller_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_account ON bill_payments(account_id);

DROP TRIGGER IF EXISTS trg_bill_payments_updated_at ON bill_payments;
CREATE TRIGGER trg_bill_payments_updated_at
  BEFORE UPDATE ON bill_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 9. CREDIT SCORE HISTORY ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_score_history (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score               INT         NOT NULL CHECK (score BETWEEN 300 AND 850),
  month_year          VARCHAR(7)  NOT NULL,
  utilization_pct     DECIMAL(5,2) DEFAULT 0,
  payment_history_pct DECIMAL(5,2) DEFAULT 100,
  credit_age_years    DECIMAL(4,1) DEFAULT 0,
  hard_inquiries      INT          DEFAULT 0,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (user_id, month_year)
);
CREATE INDEX IF NOT EXISTS idx_credit_score_user ON credit_score_history(user_id, month_year DESC);

-- ── 10. CASHBACK REWARDS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cashback_rewards (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance        DECIMAL(15,4) DEFAULT 0.0000,
  total_earned   DECIMAL(15,4) DEFAULT 0.0000,
  total_redeemed DECIMAL(15,4) DEFAULT 0.0000,
  tier           VARCHAR(20)  DEFAULT 'standard'
                   CHECK (tier IN ('standard','silver','gold','platinum')),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cashback_user ON cashback_rewards(user_id);

CREATE TABLE IF NOT EXISTS cashback_transactions (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID         REFERENCES transactions(id),
  type           VARCHAR(20)  NOT NULL
                   CHECK (type IN ('earned','redeemed','expired','bonus')),
  amount         DECIMAL(15,4) NOT NULL CHECK (amount > 0),
  merchant       VARCHAR(150),
  category       VARCHAR(50),
  multiplier     DECIMAL(4,2) DEFAULT 1.00,
  description    VARCHAR(255),
  created_at     TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cashback_tx_user ON cashback_transactions(user_id, created_at DESC);

-- ── 11. CARD REPLACEMENT COLUMNS ─────────────────────────────────────────────
ALTER TABLE cards ADD COLUMN IF NOT EXISTS replacement_status    VARCHAR(20)  DEFAULT 'none'
  CHECK (replacement_status IN ('none','requested','processing','shipping','delivered'));
ALTER TABLE cards ADD COLUMN IF NOT EXISTS replacement_requested_at TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_replacement        BOOLEAN      DEFAULT false;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS replaces_card_id      UUID         REFERENCES cards(id);

-- ══════════════════════════════════════════════════════════════════════════════
-- SEED DATA for smmy23538@gmail.com demo account
-- All inserts use ON CONFLICT DO NOTHING for idempotency
-- ══════════════════════════════════════════════════════════════════════════════

-- ── CREDIT SCORE HISTORY (18 months: 2024-12 → 2026-05) ─────────────────────
INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 704, '2024-12', 28.4, 100.0, 5.2, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 708, '2025-01', 27.1, 100.0, 5.3, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 711, '2025-02', 25.8, 100.0, 5.3, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 714, '2025-03', 24.2, 100.0, 5.4, 0
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 718, '2025-04', 22.9, 100.0, 5.5, 0
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 722, '2025-05', 21.5, 100.0, 5.5, 0
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 719, '2025-06', 23.1, 100.0, 5.6, 0
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 724, '2025-07', 20.8, 100.0, 5.7, 0
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 728, '2025-08', 19.4, 100.0, 5.7, 0
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 731, '2025-09', 18.7, 100.0, 5.8, 0
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 735, '2025-10', 17.2, 100.0, 5.8, 0
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 739, '2025-11', 16.8, 100.0, 5.9, 0
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 736, '2025-12', 18.1, 100.0, 6.0, 1
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 741, '2026-01', 15.9, 100.0, 6.1, 0
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 744, '2026-02', 15.2, 100.0, 6.1, 0
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 746, '2026-03', 14.8, 100.0, 6.2, 0
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 748, '2026-04', 14.3, 100.0, 6.2, 0
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

INSERT INTO credit_score_history (user_id, score, month_year, utilization_pct, payment_history_pct, credit_age_years, hard_inquiries)
SELECT u.id, 751, '2026-05', 13.9, 100.0, 6.3, 0
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id, month_year) DO NOTHING;

-- ── INVESTMENT ACCOUNT ───────────────────────────────────────────────────────
INSERT INTO investment_accounts (user_id, account_number, balance, daily_gain_loss, daily_gain_loss_pct, total_return, total_return_pct)
SELECT u.id, 'INV-76350825', 18472.35, 142.50, 0.78, 3472.35, 23.14
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Investment Holdings
INSERT INTO investment_holdings (investment_account_id, symbol, name, asset_type, shares, avg_cost, current_price, current_value, gain_loss, gain_loss_pct, allocation_pct)
SELECT ia.id, 'VOO', 'Vanguard S&P 500 ETF', 'etf', 14.250, 487.20, 512.84, 7308.00, 363.93, 5.24, 39.56
  FROM investment_accounts ia JOIN users u ON ia.user_id = u.id
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (investment_account_id, symbol) DO NOTHING;

INSERT INTO investment_holdings (investment_account_id, symbol, name, asset_type, shares, avg_cost, current_price, current_value, gain_loss, gain_loss_pct, allocation_pct)
SELECT ia.id, 'AAPL', 'Apple Inc.', 'stock', 22.000, 172.30, 189.45, 4167.90, 377.30, 9.96, 22.56
  FROM investment_accounts ia JOIN users u ON ia.user_id = u.id
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (investment_account_id, symbol) DO NOTHING;

INSERT INTO investment_holdings (investment_account_id, symbol, name, asset_type, shares, avg_cost, current_price, current_value, gain_loss, gain_loss_pct, allocation_pct)
SELECT ia.id, 'MSFT', 'Microsoft Corp.', 'stock', 8.500, 359.80, 415.26, 3529.70, 471.41, 15.41, 19.11
  FROM investment_accounts ia JOIN users u ON ia.user_id = u.id
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (investment_account_id, symbol) DO NOTHING;

INSERT INTO investment_holdings (investment_account_id, symbol, name, asset_type, shares, avg_cost, current_price, current_value, gain_loss, gain_loss_pct, allocation_pct)
SELECT ia.id, 'BND', 'Vanguard Total Bond Market ETF', 'bond', 40.000, 73.10, 74.87, 2994.80, 70.80, 2.42, 16.21
  FROM investment_accounts ia JOIN users u ON ia.user_id = u.id
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (investment_account_id, symbol) DO NOTHING;

INSERT INTO investment_holdings (investment_account_id, symbol, name, asset_type, shares, avg_cost, current_price, current_value, gain_loss, gain_loss_pct, allocation_pct)
SELECT ia.id, 'VTI', 'Vanguard Total Stock Market ETF', 'etf', 4.000, 238.50, 247.34, 989.36, 35.36, 3.70, 5.35
  FROM investment_accounts ia JOIN users u ON ia.user_id = u.id
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (investment_account_id, symbol) DO NOTHING;

-- Recent Investment Transactions
INSERT INTO investment_transactions (investment_account_id, type, symbol, name, shares, price, amount, description)
SELECT ia.id, 'deposit', NULL, NULL, NULL, NULL, 5000.00, 'Transfer from Checking — Initial Deposit'
  FROM investment_accounts ia JOIN users u ON ia.user_id = u.id
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO investment_transactions (investment_account_id, type, symbol, name, shares, price, amount, description, created_at)
SELECT ia.id, 'buy', 'VOO', 'Vanguard S&P 500 ETF', 5.000, 487.20, 2436.00, 'Market buy 5 shares VOO', NOW() - INTERVAL '45 days'
  FROM investment_accounts ia JOIN users u ON ia.user_id = u.id
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO investment_transactions (investment_account_id, type, symbol, name, shares, price, amount, description, created_at)
SELECT ia.id, 'dividend', 'VOO', 'Vanguard S&P 500 ETF', NULL, NULL, 32.45, 'Quarterly dividend — VOO', NOW() - INTERVAL '30 days'
  FROM investment_accounts ia JOIN users u ON ia.user_id = u.id
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO investment_transactions (investment_account_id, type, symbol, name, shares, price, amount, description, created_at)
SELECT ia.id, 'buy', 'AAPL', 'Apple Inc.', 4.000, 172.30, 689.20, 'Market buy 4 shares AAPL', NOW() - INTERVAL '15 days'
  FROM investment_accounts ia JOIN users u ON ia.user_id = u.id
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO investment_transactions (investment_account_id, type, symbol, name, shares, price, amount, description, created_at)
SELECT ia.id, 'dividend', 'BND', 'Vanguard Total Bond Market ETF', NULL, NULL, 11.20, 'Monthly dividend — BND', NOW() - INTERVAL '7 days'
  FROM investment_accounts ia JOIN users u ON ia.user_id = u.id
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

-- ── MORTGAGE LOAN ────────────────────────────────────────────────────────────
INSERT INTO loans (user_id, account_id, loan_type, lender, loan_number, principal, remaining_balance, interest_rate, monthly_payment, term_months, start_date, next_due_date, status)
SELECT
  u.id,
  a.id,
  'mortgage',
  'Wells Fargo Home Mortgage',
  'WF-2023-0847291',
  285000.00,
  271432.18,
  6.875,
  1873.50,
  360,
  '2023-03-01',
  '2026-06-01',
  'active'
FROM users u
JOIN accounts a ON a.user_id = u.id AND a.account_type = 'checking'
WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (loan_number) DO NOTHING;

-- Loan payment history (last 6 payments)
INSERT INTO loan_payments (loan_id, amount, principal_paid, interest_paid, remaining_balance, payment_date)
SELECT l.id, 1873.50, 241.36, 1632.14, 273746.42, NOW() - INTERVAL '5 months'
  FROM loans l WHERE l.loan_number = 'WF-2023-0847291';

INSERT INTO loan_payments (loan_id, amount, principal_paid, interest_paid, remaining_balance, payment_date)
SELECT l.id, 1873.50, 242.74, 1630.76, 273503.68, NOW() - INTERVAL '4 months'
  FROM loans l WHERE l.loan_number = 'WF-2023-0847291';

INSERT INTO loan_payments (loan_id, amount, principal_paid, interest_paid, remaining_balance, payment_date)
SELECT l.id, 1873.50, 244.13, 1629.37, 273259.55, NOW() - INTERVAL '3 months'
  FROM loans l WHERE l.loan_number = 'WF-2023-0847291';

INSERT INTO loan_payments (loan_id, amount, principal_paid, interest_paid, remaining_balance, payment_date)
SELECT l.id, 1873.50, 245.53, 1627.97, 273014.02, NOW() - INTERVAL '2 months'
  FROM loans l WHERE l.loan_number = 'WF-2023-0847291';

INSERT INTO loan_payments (loan_id, amount, principal_paid, interest_paid, remaining_balance, payment_date)
SELECT l.id, 1873.50, 246.94, 1626.56, 272767.08, NOW() - INTERVAL '1 month'
  FROM loans l WHERE l.loan_number = 'WF-2023-0847291';

INSERT INTO loan_payments (loan_id, amount, principal_paid, interest_paid, remaining_balance, payment_date)
SELECT l.id, 1873.50, 248.36, 1625.14, 272518.72, NOW() - INTERVAL '3 days'
  FROM loans l WHERE l.loan_number = 'WF-2023-0847291';

-- ── BENEFICIARIES ────────────────────────────────────────────────────────────
INSERT INTO beneficiaries (user_id, name, relationship, date_of_birth, email, phone, percentage, is_emergency_contact)
SELECT u.id, 'Sarah E. Craig', 'Spouse', '1986-07-14', 'sarah.craig@email.com', '(614) 555-0182', 60.00, true
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO beneficiaries (user_id, name, relationship, date_of_birth, email, phone, percentage, is_emergency_contact)
SELECT u.id, 'Michael T. Craig', 'Son', '2012-03-22', NULL, NULL, 40.00, false
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

-- ── SAVED BILLERS ────────────────────────────────────────────────────────────
INSERT INTO billers (user_id, name, account_number, category)
SELECT u.id, 'AEP Ohio', '4821-7734-09', 'utilities'
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO billers (user_id, name, account_number, category)
SELECT u.id, 'Columbia Gas of Ohio', '6612-0029-41', 'utilities'
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO billers (user_id, name, account_number, category)
SELECT u.id, 'Spectrum', '8851-2204-77', 'internet'
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO billers (user_id, name, account_number, category)
SELECT u.id, 'Progressive Insurance', 'OH-2204-9918', 'insurance'
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

-- ── AUTOPAY ──────────────────────────────────────────────────────────────────
INSERT INTO autopay (user_id, account_id, name, biller, amount, category, frequency, next_due_date, status)
SELECT u.id, a.id, 'AEP Ohio Electric', 'AEP Ohio', 135.00, 'utilities', 'monthly', '2026-06-01', 'active'
  FROM users u JOIN accounts a ON a.user_id = u.id AND a.account_type = 'checking'
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO autopay (user_id, account_id, name, biller, amount, category, frequency, next_due_date, status)
SELECT u.id, a.id, 'Columbia Gas', 'Columbia Gas of Ohio', 89.50, 'utilities', 'monthly', '2026-06-05', 'active'
  FROM users u JOIN accounts a ON a.user_id = u.id AND a.account_type = 'checking'
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO autopay (user_id, account_id, name, biller, amount, category, frequency, next_due_date, status)
SELECT u.id, a.id, 'Spectrum Internet', 'Spectrum', 79.99, 'subscriptions', 'monthly', '2026-06-12', 'active'
  FROM users u JOIN accounts a ON a.user_id = u.id AND a.account_type = 'checking'
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO autopay (user_id, account_id, name, biller, amount, category, frequency, next_due_date, status)
SELECT u.id, a.id, 'Progressive Auto', 'Progressive Insurance', 218.45, 'insurance', 'monthly', '2026-06-15', 'active'
  FROM users u JOIN accounts a ON a.user_id = u.id AND a.account_type = 'checking'
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

-- ── CASHBACK REWARDS ─────────────────────────────────────────────────────────
INSERT INTO cashback_rewards (user_id, balance, total_earned, total_redeemed, tier)
SELECT u.id, 127.4500, 342.8000, 215.3500, 'silver'
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Cashback transaction history
INSERT INTO cashback_transactions (user_id, type, amount, merchant, category, multiplier, description, created_at)
SELECT u.id, 'earned', 1.2500, 'Kroger', 'groceries', 1.00, '1% cashback on $125.00 grocery purchase', NOW() - INTERVAL '8 days'
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO cashback_transactions (user_id, type, amount, merchant, category, multiplier, description, created_at)
SELECT u.id, 'earned', 0.6200, 'Speedway', 'fuel', 1.00, '1% cashback on $62.00 fuel purchase', NOW() - INTERVAL '12 days'
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO cashback_transactions (user_id, type, amount, merchant, category, multiplier, description, created_at)
SELECT u.id, 'earned', 2.1500, 'Amazon', 'shopping', 2.00, '2% cashback on $107.50 online purchase', NOW() - INTERVAL '14 days'
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO cashback_transactions (user_id, type, amount, merchant, category, multiplier, description, created_at)
SELECT u.id, 'earned', 3.7400, 'Accenture Federal Services', 'direct_deposit', 1.00, 'Payroll direct deposit bonus', NOW() - INTERVAL '20 days'
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO cashback_transactions (user_id, type, amount, merchant, category, multiplier, description, created_at)
SELECT u.id, 'redeemed', 25.0000, NULL, NULL, 1.00, 'Redeemed $25.00 to checking account', NOW() - INTERVAL '30 days'
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO cashback_transactions (user_id, type, amount, merchant, category, multiplier, description, created_at)
SELECT u.id, 'earned', 1.8900, 'Giant Eagle', 'groceries', 1.00, '1% cashback on $189.00 grocery purchase', NOW() - INTERVAL '35 days'
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

INSERT INTO cashback_transactions (user_id, type, amount, merchant, category, multiplier, description, created_at)
SELECT u.id, 'bonus', 5.0000, NULL, NULL, 1.00, 'Monthly loyalty bonus — Silver tier', NOW() - INTERVAL '45 days'
  FROM users u WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com';

-- ── BILL PAYMENT HISTORY ─────────────────────────────────────────────────────
INSERT INTO bill_payments (biller_id, account_id, amount, scheduled_date, payment_date, due_date, reference, status)
SELECT b.id, a.id, 128.50, CURRENT_DATE - INTERVAL '32 days', NOW() - INTERVAL '32 days', CURRENT_DATE - INTERVAL '30 days',
       'BILL-2026-000001', 'completed'
  FROM billers b
  JOIN users u ON b.user_id = u.id
  JOIN accounts a ON a.user_id = u.id AND a.account_type = 'checking'
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com' AND b.name = 'AEP Ohio';

INSERT INTO bill_payments (biller_id, account_id, amount, scheduled_date, payment_date, due_date, reference, status)
SELECT b.id, a.id, 91.20, CURRENT_DATE - INTERVAL '28 days', NOW() - INTERVAL '28 days', CURRENT_DATE - INTERVAL '26 days',
       'BILL-2026-000002', 'completed'
  FROM billers b
  JOIN users u ON b.user_id = u.id
  JOIN accounts a ON a.user_id = u.id AND a.account_type = 'checking'
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com' AND b.name = 'Columbia Gas of Ohio';

INSERT INTO bill_payments (biller_id, account_id, amount, scheduled_date, payment_date, due_date, reference, status)
SELECT b.id, a.id, 79.99, CURRENT_DATE - INTERVAL '20 days', NOW() - INTERVAL '20 days', CURRENT_DATE - INTERVAL '18 days',
       'BILL-2026-000003', 'completed'
  FROM billers b
  JOIN users u ON b.user_id = u.id
  JOIN accounts a ON a.user_id = u.id AND a.account_type = 'checking'
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com' AND b.name = 'Spectrum';

INSERT INTO bill_payments (biller_id, account_id, amount, scheduled_date, due_date, reference, status)
SELECT b.id, a.id, 135.00, CURRENT_DATE + INTERVAL '12 days', CURRENT_DATE + INTERVAL '14 days',
       'BILL-2026-000004', 'scheduled'
  FROM billers b
  JOIN users u ON b.user_id = u.id
  JOIN accounts a ON a.user_id = u.id AND a.account_type = 'checking'
  WHERE LOWER(TRIM(u.email)) = 'smmy23538@gmail.com' AND b.name = 'AEP Ohio';
