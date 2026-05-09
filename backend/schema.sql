-- ============================================================
-- CoreWallet v2 — Production Schema
-- Run this on a fresh database:
--   psql -U postgres -d corewallet -f schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'user'
                    CHECK (role IN ('admin', 'user')),
    is_active     BOOLEAN      NOT NULL DEFAULT true,
    is_verified   BOOLEAN      NOT NULL DEFAULT false,
    avatar_color  VARCHAR(7)   DEFAULT '#6366f1',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- ============================================================
-- SESSIONS  (token blacklisting / refresh token tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash    VARCHAR(255) UNIQUE NOT NULL,
    ip_address    INET,
    user_agent    TEXT,
    expires_at    TIMESTAMPTZ NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at    TIMESTAMPTZ
);

-- ============================================================
-- ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    account_number      VARCHAR(20) UNIQUE NOT NULL,
    balance             DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency            VARCHAR(3)  NOT NULL DEFAULT 'USD',
    status              VARCHAR(20) NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'frozen', 'closed')),
    external_account_id VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT positive_balance CHECK (balance >= 0)
);

-- ============================================================
-- TRANSACTIONS  (immutable ledger — no UPDATE, no DELETE)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference             VARCHAR(50) UNIQUE NOT NULL,
    type                  VARCHAR(20) NOT NULL
                            CHECK (type IN ('credit', 'debit', 'transfer')),

    sender_account_id     UUID REFERENCES accounts(id),
    receiver_account_id   UUID REFERENCES accounts(id),
    initiated_by_admin_id UUID REFERENCES users(id),

    amount      DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency    VARCHAR(3)    NOT NULL DEFAULT 'USD',
    fee         DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    status      VARCHAR(20)   NOT NULL DEFAULT 'completed'
                  CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),

    -- Balance snapshots for full audit trail
    sender_balance_before   DECIMAL(15,2),
    sender_balance_after    DECIMAL(15,2),
    receiver_balance_before DECIMAL(15,2),
    receiver_balance_after  DECIMAL(15,2),

    external_reference VARCHAR(255),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT has_party CHECK (
        sender_account_id IS NOT NULL OR receiver_account_id IS NOT NULL
    )
);

-- ============================================================
-- CARDS  (virtual debit + credit)
-- ============================================================
CREATE TABLE IF NOT EXISTS cards (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id       UUID        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    card_number      VARCHAR(16) UNIQUE NOT NULL,
    card_holder_name VARCHAR(255) NOT NULL,
    expiry_month     VARCHAR(2)  NOT NULL,
    expiry_year      VARCHAR(4)  NOT NULL,
    cvv_hash         VARCHAR(255) NOT NULL,
    type             VARCHAR(20) NOT NULL DEFAULT 'debit'
                       CHECK (type IN ('debit', 'credit')),
    status           VARCHAR(20) NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'frozen', 'expired', 'cancelled')),

    -- Credit card fields
    credit_limit     DECIMAL(15,2) CHECK (credit_limit > 0),
    credit_used      DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    is_virtual       BOOLEAN NOT NULL DEFAULT true,
    design           VARCHAR(20) NOT NULL DEFAULT 'blue'
                       CHECK (design IN ('blue', 'black', 'gold')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT credit_requires_limit CHECK (
        type != 'credit' OR credit_limit IS NOT NULL
    ),
    CONSTRAINT credit_used_within_limit CHECK (
        credit_limit IS NULL OR credit_used <= credit_limit
    )
);

-- ============================================================
-- ADMIN LOGS  (full audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id          UUID NOT NULL REFERENCES users(id),
    action            VARCHAR(100) NOT NULL,
    target_user_id    UUID REFERENCES users(id),
    target_account_id UUID REFERENCES accounts(id),
    transaction_id    UUID REFERENCES transactions(id),
    details           JSONB,
    ip_address        INET,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_accounts_user_id         ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_number  ON accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_accounts_status          ON accounts(status);

CREATE INDEX IF NOT EXISTS idx_transactions_sender      ON transactions(sender_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver    ON transactions(receiver_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at  ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference   ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_status      ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_cards_account_id         ON cards(account_id);
CREATE INDEX IF NOT EXISTS idx_cards_status             ON cards(status);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id         ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash      ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at      ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id      ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at    ON admin_logs(created_at DESC);

-- ============================================================
-- updated_at trigger (auto-update timestamp)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at    ON users;
DROP TRIGGER IF EXISTS trg_accounts_updated_at ON accounts;
DROP TRIGGER IF EXISTS trg_cards_updated_at    ON cards;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Transaction reference sequence  (TXN-YYYY-000001)
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS transaction_ref_seq START 1000;

CREATE OR REPLACE FUNCTION generate_transaction_reference()
RETURNS VARCHAR AS $$
BEGIN
    RETURN 'TXN-' || TO_CHAR(NOW(), 'YYYY') || '-'
           || LPAD(nextval('transaction_ref_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Prevent direct UPDATE/DELETE on transactions (immutable ledger)
-- ============================================================
CREATE OR REPLACE FUNCTION deny_transaction_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Transactions are immutable — use a reversal entry instead';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deny_update_transactions ON transactions;
DROP TRIGGER IF EXISTS trg_deny_delete_transactions ON transactions;

CREATE TRIGGER trg_deny_update_transactions
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION deny_transaction_mutation();

CREATE TRIGGER trg_deny_delete_transactions
    BEFORE DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION deny_transaction_mutation();
