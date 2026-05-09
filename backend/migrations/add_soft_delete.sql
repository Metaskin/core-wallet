-- Safe migration: soft-delete support for transactions
-- Run: psql -U postgres -d corewallet -f migrations/add_soft_delete.sql

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_transactions_not_deleted
  ON transactions(is_deleted)
  WHERE is_deleted = false;

-- ─── Update the immutability trigger ─────────────────────────────────────────
-- The original trigger blocked ALL updates. We relax it to allow ONLY the
-- is_deleted flag to be toggled; all financial fields remain immutable.

CREATE OR REPLACE FUNCTION deny_transaction_mutation()
RETURNS TRIGGER AS $$
BEGIN
    -- Physical DELETEs are always forbidden
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Transactions cannot be physically deleted from the ledger';
    END IF;

    -- For UPDATEs: only is_deleted may change; every financial field must stay identical
    IF OLD.reference             != NEW.reference             OR
       OLD.type                  != NEW.type                  OR
       OLD.amount                != NEW.amount                OR
       OLD.currency              != NEW.currency              OR
       OLD.status                != NEW.status                OR
       OLD.sender_account_id     IS DISTINCT FROM NEW.sender_account_id     OR
       OLD.receiver_account_id   IS DISTINCT FROM NEW.receiver_account_id   OR
       OLD.initiated_by_admin_id IS DISTINCT FROM NEW.initiated_by_admin_id OR
       OLD.fee                   != NEW.fee                   OR
       OLD.created_at            != NEW.created_at
    THEN
        RAISE EXCEPTION 'Transactions are immutable — financial fields cannot be modified';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers (DROP IF EXISTS handles idempotency)
DROP TRIGGER IF EXISTS trg_deny_update_transactions ON transactions;
DROP TRIGGER IF EXISTS trg_deny_delete_transactions ON transactions;

CREATE TRIGGER trg_deny_update_transactions
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION deny_transaction_mutation();

CREATE TRIGGER trg_deny_delete_transactions
    BEFORE DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION deny_transaction_mutation();
