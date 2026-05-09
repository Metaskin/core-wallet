-- Add card design variant to cards table
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS design VARCHAR(20) NOT NULL DEFAULT 'blue'
    CHECK (design IN ('blue', 'black', 'gold'));
