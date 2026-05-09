-- ============================================================
-- Fix cards table: add all required columns safely
-- Run against your live database BEFORE restarting the server
-- ============================================================

BEGIN;

-- 1. card_type — rename from "type" if it exists, else add fresh
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cards' AND column_name='type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cards' AND column_name='card_type'
  ) THEN
    ALTER TABLE cards RENAME COLUMN type TO card_type;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cards' AND column_name='card_type'
  ) THEN
    ALTER TABLE cards ADD COLUMN card_type VARCHAR(20) NOT NULL DEFAULT 'debit'
      CHECK (card_type IN ('debit', 'credit'));
  END IF;
END $$;

-- 2. expiry_month as INT (add if missing, convert from VARCHAR if needed)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cards' AND column_name='expiry_month'
  ) THEN
    ALTER TABLE cards ADD COLUMN expiry_month INT NOT NULL
      DEFAULT EXTRACT(MONTH FROM NOW())::INT
      CHECK (expiry_month BETWEEN 1 AND 12);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cards' AND column_name='expiry_month'
      AND data_type IN ('character varying', 'character', 'text')
  ) THEN
    ALTER TABLE cards
      ALTER COLUMN expiry_month TYPE INT
      USING NULLIF(TRIM(expiry_month), '')::INT;
  END IF;
END $$;

-- 3. expiry_year as INT (add if missing, convert from VARCHAR if needed)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cards' AND column_name='expiry_year'
  ) THEN
    ALTER TABLE cards ADD COLUMN expiry_year INT NOT NULL
      DEFAULT (EXTRACT(YEAR FROM NOW())::INT + 3);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cards' AND column_name='expiry_year'
      AND data_type IN ('character varying', 'character', 'text')
  ) THEN
    ALTER TABLE cards
      ALTER COLUMN expiry_year TYPE INT
      USING NULLIF(TRIM(expiry_year), '')::INT;
  END IF;
END $$;

-- 4. cvv — plain text (demo app; do NOT use for real card data)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cards' AND column_name='cvv'
  ) THEN
    ALTER TABLE cards ADD COLUMN cvv VARCHAR(10);
  END IF;
END $$;

-- 5. balance — card-level balance (debit mirrors account balance, credit = available)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cards' AND column_name='balance'
  ) THEN
    ALTER TABLE cards ADD COLUMN balance NUMERIC(15,2) NOT NULL DEFAULT 0.00;
  END IF;
END $$;

-- 6. is_active — boolean view of status
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cards' AND column_name='is_active'
  ) THEN
    ALTER TABLE cards ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    -- Back-fill from status if it exists
    BEGIN
      UPDATE cards SET is_active = (status = 'active');
    EXCEPTION WHEN undefined_column THEN NULL;
    END;
  END IF;
END $$;

-- 7. design — card colour theme
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cards' AND column_name='design'
  ) THEN
    ALTER TABLE cards ADD COLUMN design VARCHAR(20) NOT NULL DEFAULT 'blue'
      CHECK (design IN ('blue', 'black', 'gold'));
  END IF;
END $$;

-- 8. card_holder_name — safety net
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cards' AND column_name='card_holder_name'
  ) THEN
    ALTER TABLE cards ADD COLUMN card_holder_name VARCHAR(255) NOT NULL DEFAULT 'CARD HOLDER';
  END IF;
END $$;

-- 9. card_number — safety net
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cards' AND column_name='card_number'
  ) THEN
    ALTER TABLE cards ADD COLUMN card_number VARCHAR(20) UNIQUE;
  END IF;
END $$;

-- 10. Drop stale cvv_hash column (optional — only if you want to clean up)
-- ALTER TABLE cards DROP COLUMN IF EXISTS cvv_hash;

COMMIT;
