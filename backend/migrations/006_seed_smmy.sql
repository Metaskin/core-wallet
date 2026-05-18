-- ============================================================
-- 006_seed_smmy.sql  (Neon-safe, no transaction wrapper)
-- ============================================================
-- Seeds demo data for smmy23538@gmail.com ONLY.
-- Each DO $$ block is fully isolated and auto-commits.
-- If one block fails it does NOT roll back the others.
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING.
-- Run the whole file at once or block-by-block.
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- BLOCK 0 — Verify user exists before doing anything
-- ══════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE LOWER(email) = 'smmy23538@gmail.com'
  ) THEN
    RAISE EXCEPTION 'STOP: user smmy23538@gmail.com not found — check email or run registration first';
  END IF;
  RAISE NOTICE '✓ Block 0 — user verified';
END $$;


-- ══════════════════════════════════════════════════════════════
-- BLOCK 1 — Accounts (checking + savings)
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_uid  UUID;
  v_chk  UUID;
  v_sav  UUID;
BEGIN
  SELECT id INTO v_uid FROM users WHERE LOWER(email) = 'smmy23538@gmail.com';

  -- Checking
  SELECT id INTO v_chk FROM accounts
    WHERE user_id = v_uid AND account_type = 'checking';

  IF v_chk IS NULL THEN
    INSERT INTO accounts (
      user_id, account_number, balance, available_balance, pending_balance,
      currency, status, account_type, routing_number, nickname
    ) VALUES (
      v_uid,
      '4521' || LPAD((ABS(hashtext(v_uid::text)) % 1000000)::text, 6, '0'),
      67465.00, 67465.00, 0.00,
      'USD', 'active', 'checking', '026009593', 'Core Checking'
    )
    RETURNING id INTO v_chk;
    RAISE NOTICE '  → Checking account created: %', v_chk;
  ELSE
    UPDATE accounts SET
      balance           = 67465.00,
      available_balance = 67465.00,
      pending_balance   = 0.00,
      status            = 'active',
      nickname          = 'Core Checking'
    WHERE id = v_chk;
    RAISE NOTICE '  → Checking account updated: %', v_chk;
  END IF;

  -- Savings
  SELECT id INTO v_sav FROM accounts
    WHERE user_id = v_uid AND account_type = 'savings';

  IF v_sav IS NULL THEN
    INSERT INTO accounts (
      user_id, account_number, balance, available_balance, pending_balance,
      currency, status, account_type, routing_number, nickname
    ) VALUES (
      v_uid,
      '9881' || LPAD((ABS(hashtext(v_uid::text || 'sv')) % 1000000)::text, 6, '0'),
      17000.00, 17000.00, 0.00,
      'USD', 'active', 'savings', '026009593', 'Core Savings'
    )
    RETURNING id INTO v_sav;
    RAISE NOTICE '  → Savings account created: %', v_sav;
  ELSE
    UPDATE accounts SET
      balance           = 17000.00,
      available_balance = 17000.00,
      pending_balance   = 0.00,
      status            = 'active',
      nickname          = 'Core Savings'
    WHERE id = v_sav;
    RAISE NOTICE '  → Savings account updated: %', v_sav;
  END IF;

  RAISE NOTICE '✓ Block 1 — accounts ready';
END $$;


-- ══════════════════════════════════════════════════════════════
-- BLOCK 2 — Cards (physical debit only; user issues virtual)
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_uid  UUID;
  v_chk  UUID;
  v_name TEXT;
BEGIN
  SELECT u.id, u.full_name INTO v_uid, v_name
    FROM users u WHERE LOWER(u.email) = 'smmy23538@gmail.com';

  SELECT id INTO v_chk FROM accounts
    WHERE user_id = v_uid AND account_type = 'checking';

  IF v_chk IS NULL THEN
    RAISE EXCEPTION 'Block 2 aborted: checking account not found — run Block 1 first';
  END IF;

  -- Remove stale cards (wrong holder name, old credit card)
  DELETE FROM cards WHERE account_id = v_chk;

  -- Physical Visa Debit with real cardholder name
  INSERT INTO cards (
    account_id, card_type, card_holder_name,
    expiry_month, expiry_year, last4,
    status, is_active, is_virtual, design, balance
  ) VALUES (
    v_chk, 'debit', v_name,
    9, 2028, '4731',
    'active', true, false, 'blue', 0.00
  );

  RAISE NOTICE '  → Debit card •4731 issued to %', v_name;
  RAISE NOTICE '✓ Block 2 — cards ready';
END $$;


-- ══════════════════════════════════════════════════════════════
-- BLOCK 3 — Transactions 2022  (refs 900001–900046, 46 rows)
-- Payroll: $5,500.00/mo net
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_uid UUID;
  v_chk UUID;
  v_sav UUID;
BEGIN
  SELECT id INTO v_uid FROM users WHERE LOWER(email) = 'smmy23538@gmail.com';
  SELECT id INTO v_chk FROM accounts WHERE user_id = v_uid AND account_type = 'checking';
  SELECT id INTO v_sav FROM accounts WHERE user_id = v_uid AND account_type = 'savings';

  IF v_chk IS NULL THEN
    RAISE EXCEPTION 'Block 3 aborted: checking account not found — run Block 1 first';
  END IF;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900001','credit',v_chk,5500.00,'Payroll — Accenture Federal Services','completed','2022-01-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900002','debit',v_chk,89.47,'Kroger #0342 — Grocery','completed','2022-01-17 18:23:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900003','debit',v_chk,134.22,'AEP Ohio — Electric Service','completed','2022-01-20 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900004','debit',v_chk,79.99,'Spectrum Internet — Monthly Service','completed','2022-01-20 08:01:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900005','debit',v_chk,52.40,'Speedway #7734 — Fuel','completed','2022-01-25 07:45:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900006','credit',v_chk,5500.00,'Payroll — Accenture Federal Services','completed','2022-02-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900007','debit',v_chk,156.88,'Columbia Gas of Ohio — Heating','completed','2022-02-15 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900008','debit',v_chk,17.99,'Hulu — Monthly Subscription','completed','2022-02-17 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900009','debit',v_chk,67.34,'Target #0891 — Household Supplies','completed','2022-02-22 14:12:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900010','credit',v_chk,5500.00,'Payroll — Accenture Federal Services','completed','2022-03-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900011','debit',v_chk,79.99,'Spectrum Internet — Monthly Service','completed','2022-03-16 08:01:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900012','debit',v_chk,34.67,'CVS Pharmacy #4521 — Prescription','completed','2022-03-19 11:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900013','debit',v_chk,103.45,'Meijer #0312 — Grocery','completed','2022-03-22 19:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900014','credit',v_chk,5500.00,'Payroll — Accenture Federal Services','completed','2022-04-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900015','credit',v_chk,245.00,'OhioHealth — FSA Reimbursement','completed','2022-04-15 10:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900016','debit',v_chk,78.23,'Walmart Supercenter #3421 — Grocery','completed','2022-04-18 17:55:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900017','debit',v_chk,9.99,'Spotify Premium — Monthly','completed','2022-04-22 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900018','credit',v_chk,5500.00,'Payroll — Accenture Federal Services','completed','2022-05-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900019','debit',v_chk,112.45,'Kroger #0342 — Grocery','completed','2022-05-16 18:40:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900020','debit',v_chk,89.50,'AEP Ohio — Electric Service','completed','2022-05-20 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900021','transfer',v_chk,v_sav,500.00,'Transfer to Core Savings','completed','2022-05-28 12:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900022','credit',v_chk,5500.00,'Payroll — Accenture Federal Services','completed','2022-06-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900023','debit',v_chk,79.99,'Spectrum Internet — Monthly Service','completed','2022-06-16 08:01:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900024','debit',v_chk,28.45,'Bob Evans Restaurant — Dublin OH','completed','2022-06-18 12:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900025','credit',v_chk,5500.00,'Payroll — Accenture Federal Services','completed','2022-07-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900026','debit',v_chk,156.78,'AEP Ohio — Electric Service (summer)','completed','2022-07-15 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900027','debit',v_chk,167.89,'Costco Wholesale #0612','completed','2022-07-18 11:20:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900028','credit',v_chk,5500.00,'Payroll — Accenture Federal Services','completed','2022-08-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900029','debit',v_chk,378.50,'Delta Air Lines — Flight CMH to LAS','completed','2022-08-15 06:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900030','debit',v_chk,213.00,'Marriott Columbus Downtown — 2 Nights','completed','2022-08-18 14:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900031','credit',v_chk,5500.00,'Payroll — Accenture Federal Services','completed','2022-09-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900032','debit',v_chk,134.50,'Progressive Insurance — Auto Monthly','completed','2022-09-16 08:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900033','debit',v_chk,98.67,'Giant Eagle #0234 — Grocery','completed','2022-09-20 17:45:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900034','credit',v_chk,5500.00,'Payroll — Accenture Federal Services','completed','2022-10-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900035','debit',v_chk,156.23,'Columbia Gas of Ohio — Heating','completed','2022-10-15 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900036','debit',v_chk,14.99,'Amazon Prime — Monthly Membership','completed','2022-10-22 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900037','debit',v_chk,47.30,'Marathon #2341 — Fuel','completed','2022-10-26 08:10:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900038','credit',v_chk,5500.00,'Payroll — Accenture Federal Services','completed','2022-11-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900039','debit',v_chk,189.45,'AEP Ohio — Electric Service','completed','2022-11-16 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900040','debit',v_chk,96.78,'Meijer #0312 — Grocery','completed','2022-11-19 16:55:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900041','debit',v_chk,13.99,'Disney+ — Monthly Subscription','completed','2022-11-22 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900042','debit',v_chk,16.78,'Wendys #0445 — Dublin OH','completed','2022-11-25 12:45:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900043','credit',v_chk,5500.00,'Payroll — Accenture Federal Services','completed','2022-12-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900044','debit',v_chk,201.34,'Columbia Gas of Ohio — Heating (winter)','completed','2022-12-15 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900045','debit',v_chk,145.78,'Giant Eagle #0234 — Holiday Grocery','completed','2022-12-19 15:20:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2022-900046','debit',v_chk,178.90,'Costco Wholesale #0612 — Holiday','completed','2022-12-20 13:45:00+00')
  ON CONFLICT (reference) DO NOTHING;

  RAISE NOTICE '✓ Block 3 — 2022 transactions done (46 rows)';
END $$;


-- ══════════════════════════════════════════════════════════════
-- BLOCK 4 — Transactions 2023  (refs 900047–900086, 40 rows)
-- Payroll raised to $5,812.50/mo
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_uid UUID;
  v_chk UUID;
  v_sav UUID;
BEGIN
  SELECT id INTO v_uid FROM users WHERE LOWER(email) = 'smmy23538@gmail.com';
  SELECT id INTO v_chk FROM accounts WHERE user_id = v_uid AND account_type = 'checking';
  SELECT id INTO v_sav FROM accounts WHERE user_id = v_uid AND account_type = 'savings';

  IF v_chk IS NULL THEN
    RAISE EXCEPTION 'Block 4 aborted: checking account not found — run Block 1 first';
  END IF;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900047','credit',v_chk,5812.50,'Payroll — Accenture Federal Services','completed','2023-01-13 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900048','debit',v_chk,145.67,'AEP Ohio — Electric Service','completed','2023-01-16 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900049','debit',v_chk,79.99,'Spectrum Internet — Monthly Service','completed','2023-01-18 08:01:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900050','credit',v_chk,5812.50,'Payroll — Accenture Federal Services','completed','2023-02-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900051','debit',v_chk,178.34,'Columbia Gas of Ohio — Heating','completed','2023-02-15 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900052','debit',v_chk,12.45,'Wendys #0445 — Dublin OH','completed','2023-02-19 13:10:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900053','credit',v_chk,5812.50,'Payroll — Accenture Federal Services','completed','2023-03-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900054','debit',v_chk,95.23,'Kroger #0342 — Grocery','completed','2023-03-16 18:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900055','debit',v_chk,10.99,'Disney+ — Monthly Subscription','completed','2023-03-20 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900056','credit',v_chk,5812.50,'Payroll — Accenture Federal Services','completed','2023-04-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900057','debit',v_chk,98.45,'AEP Ohio — Electric Service','completed','2023-04-16 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900058','transfer',v_chk,v_sav,750.00,'Transfer to Core Savings','completed','2023-04-20 12:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900059','credit',v_chk,5812.50,'Payroll — Accenture Federal Services','completed','2023-05-15 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900060','debit',v_chk,85.67,'Walmart Supercenter #3421 — Grocery','completed','2023-05-16 17:20:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900061','debit',v_chk,14.99,'Amazon Prime — Monthly Membership','completed','2023-05-22 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900062','credit',v_chk,5812.50,'Payroll — Accenture Federal Services','completed','2023-06-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900063','debit',v_chk,123.45,'Target #0891 — Household and Apparel','completed','2023-06-15 14:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900064','debit',v_chk,412.00,'Delta Air Lines — Flight CMH to MIA','completed','2023-06-18 06:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900065','credit',v_chk,5812.50,'Payroll — Accenture Federal Services','completed','2023-07-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900066','debit',v_chk,178.90,'AEP Ohio — Electric Service (summer peak)','completed','2023-07-17 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900067','debit',v_chk,16.78,'Chipotle Mexican Grill — Columbus OH','completed','2023-07-20 12:50:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900068','debit',v_chk,13.99,'YouTube Premium — Monthly','completed','2023-07-22 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900069','credit',v_chk,5812.50,'Payroll — Accenture Federal Services','completed','2023-08-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900070','debit',v_chk,79.99,'Spectrum Internet — Monthly Service','completed','2023-08-15 08:01:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900071','debit',v_chk,98.34,'Meijer #0312 — Grocery','completed','2023-08-19 16:10:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900072','credit',v_chk,5812.50,'Payroll — Accenture Federal Services','completed','2023-09-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900073','debit',v_chk,67.89,'Columbia Gas of Ohio — Service','completed','2023-09-15 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900074','debit',v_chk,58.23,'Marathon #2341 — Fuel','completed','2023-09-19 07:50:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900075','credit',v_chk,5812.50,'Payroll — Accenture Federal Services','completed','2023-10-13 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900076','credit',v_chk,178.50,'Nationwide Insurance — Healthcare Reimbursement','completed','2023-10-16 10:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900077','debit',v_chk,79.99,'Spectrum Internet — Monthly Service','completed','2023-10-18 08:01:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900078','debit',v_chk,32.45,'Bob Evans Restaurant — Columbus OH','completed','2023-10-22 18:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900079','credit',v_chk,5812.50,'Payroll — Accenture Federal Services','completed','2023-11-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900080','debit',v_chk,167.45,'AEP Ohio — Electric Service','completed','2023-11-16 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900081','debit',v_chk,17.99,'Hulu — Monthly Subscription','completed','2023-11-18 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900082','debit',v_chk,28.90,'Walgreens #5234 — Pharmacy','completed','2023-11-22 11:15:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900083','credit',v_chk,5812.50,'Payroll — Accenture Federal Services','completed','2023-12-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900084','debit',v_chk,198.45,'Columbia Gas of Ohio — Heating (winter)','completed','2023-12-15 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900085','debit',v_chk,145.78,'Giant Eagle #0234 — Holiday Grocery','completed','2023-12-19 16:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2023-900086','debit',v_chk,189.45,'Costco Wholesale #0612 — Holiday','completed','2023-12-21 12:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  RAISE NOTICE '✓ Block 4 — 2023 transactions done (40 rows)';
END $$;


-- ══════════════════════════════════════════════════════════════
-- BLOCK 5 — Transactions 2024  (refs 900087–900122, 36 rows)
-- Payroll raised to $6,123.00/mo
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_uid UUID;
  v_chk UUID;
  v_sav UUID;
BEGIN
  SELECT id INTO v_uid FROM users WHERE LOWER(email) = 'smmy23538@gmail.com';
  SELECT id INTO v_chk FROM accounts WHERE user_id = v_uid AND account_type = 'checking';
  SELECT id INTO v_sav FROM accounts WHERE user_id = v_uid AND account_type = 'savings';

  IF v_chk IS NULL THEN
    RAISE EXCEPTION 'Block 5 aborted: checking account not found — run Block 1 first';
  END IF;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900087','credit',v_chk,6123.00,'Payroll — Accenture Federal Services','completed','2024-01-12 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900088','debit',v_chk,152.34,'AEP Ohio — Electric Service','completed','2024-01-16 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900089','debit',v_chk,17.99,'Hulu — Monthly Subscription','completed','2024-01-18 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900090','credit',v_chk,6123.00,'Payroll — Accenture Federal Services','completed','2024-02-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900091','debit',v_chk,189.45,'Columbia Gas of Ohio — Heating','completed','2024-02-15 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900092','transfer',v_chk,v_sav,1000.00,'Transfer to Core Savings','completed','2024-02-18 12:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900093','credit',v_chk,6123.00,'Payroll — Accenture Federal Services','completed','2024-03-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900094','debit',v_chk,108.67,'Kroger #0342 — Grocery','completed','2024-03-15 17:50:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900095','debit',v_chk,9.99,'Spotify Premium — Monthly','completed','2024-03-18 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900096','credit',v_chk,6123.00,'Payroll — Accenture Federal Services','completed','2024-04-12 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900097','debit',v_chk,112.45,'AEP Ohio — Electric Service','completed','2024-04-15 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900098','debit',v_chk,2.99,'Apple iCloud — 50GB Storage Plan','completed','2024-04-18 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900099','credit',v_chk,6123.00,'Payroll — Accenture Federal Services','completed','2024-05-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900100','debit',v_chk,189.45,'Costco Wholesale #0612','completed','2024-05-15 11:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900101','debit',v_chk,61.23,'Speedway #7734 — Fuel','completed','2024-05-18 07:55:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900102','credit',v_chk,6123.00,'Payroll — Accenture Federal Services','completed','2024-06-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900103','debit',v_chk,289.00,'Southwest Airlines — Flight CMH to DEN','completed','2024-06-15 07:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900104','debit',v_chk,84.99,'Spectrum Internet — Monthly Service','completed','2024-06-18 08:01:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900105','credit',v_chk,6123.00,'Payroll — Accenture Federal Services','completed','2024-07-12 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900106','debit',v_chk,189.67,'AEP Ohio — Electric Service (summer peak)','completed','2024-07-15 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900107','debit',v_chk,32.45,'Bob Evans Restaurant — Westerville OH','completed','2024-07-18 18:45:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900108','credit',v_chk,6123.00,'Payroll — Accenture Federal Services','completed','2024-08-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900109','debit',v_chk,92.34,'Walmart Supercenter #3421 — Grocery','completed','2024-08-15 16:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900110','debit',v_chk,134.50,'Progressive Insurance — Auto Monthly','completed','2024-08-16 08:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900111','credit',v_chk,6123.00,'Payroll — Accenture Federal Services','completed','2024-09-13 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900112','debit',v_chk,89.25,'Nationwide Insurance — Renters Policy','completed','2024-09-14 08:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900113','debit',v_chk,67.45,'BP #4521 — Fuel','completed','2024-09-17 07:40:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900114','credit',v_chk,6123.00,'Payroll — Accenture Federal Services','completed','2024-10-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900115','debit',v_chk,45.23,'CVS Pharmacy #4521 — Prescription','completed','2024-10-15 11:20:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900116','debit',v_chk,21.56,'Panera Bread — Columbus OH','completed','2024-10-18 12:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900117','credit',v_chk,6123.00,'Payroll — Accenture Federal Services','completed','2024-11-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900118','debit',v_chk,134.56,'Giant Eagle #0234 — Grocery','completed','2024-11-15 17:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900119','debit',v_chk,18.90,'Chipotle Mexican Grill — Columbus OH','completed','2024-11-18 13:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900120','credit',v_chk,6123.00,'Payroll — Accenture Federal Services','completed','2024-12-13 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900121','debit',v_chk,213.45,'Columbia Gas of Ohio — Heating (winter)','completed','2024-12-14 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2024-900122','debit',v_chk,156.78,'Target #0891 — Holiday Shopping','completed','2024-12-19 15:10:00+00')
  ON CONFLICT (reference) DO NOTHING;

  RAISE NOTICE '✓ Block 5 — 2024 transactions done (36 rows)';
END $$;


-- ══════════════════════════════════════════════════════════════
-- BLOCK 6 — Transactions 2025  (refs 900123–900158, 36 rows)
-- Payroll raised to $6,400.00/mo
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_uid UUID;
  v_chk UUID;
  v_sav UUID;
BEGIN
  SELECT id INTO v_uid FROM users WHERE LOWER(email) = 'smmy23538@gmail.com';
  SELECT id INTO v_chk FROM accounts WHERE user_id = v_uid AND account_type = 'checking';
  SELECT id INTO v_sav FROM accounts WHERE user_id = v_uid AND account_type = 'savings';

  IF v_chk IS NULL THEN
    RAISE EXCEPTION 'Block 6 aborted: checking account not found — run Block 1 first';
  END IF;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900123','credit',v_chk,6400.00,'Payroll — Accenture Federal Services','completed','2025-01-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900124','debit',v_chk,164.78,'AEP Ohio — Electric Service','completed','2025-01-16 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900125','debit',v_chk,198.45,'Columbia Gas of Ohio — Heating','completed','2025-01-17 08:01:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900126','credit',v_chk,6400.00,'Payroll — Accenture Federal Services','completed','2025-02-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900127','debit',v_chk,84.99,'Spectrum Internet — Monthly Service','completed','2025-02-15 08:01:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900128','credit',v_chk,312.00,'OhioHealth — Annual FSA Reimbursement','completed','2025-02-17 10:15:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900129','credit',v_chk,6400.00,'Payroll — Accenture Federal Services','completed','2025-03-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900130','debit',v_chk,112.34,'Kroger #0342 — Grocery','completed','2025-03-15 18:20:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900131','debit',v_chk,17.99,'Hulu — Monthly Subscription','completed','2025-03-17 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900132','credit',v_chk,6400.00,'Payroll — Accenture Federal Services','completed','2025-04-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900133','debit',v_chk,123.45,'AEP Ohio — Electric Service','completed','2025-04-15 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900134','debit',v_chk,14.99,'Amazon Prime — Monthly Membership','completed','2025-04-17 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900135','credit',v_chk,6400.00,'Payroll — Accenture Federal Services','completed','2025-05-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900136','debit',v_chk,89.45,'Meijer #0312 — Grocery','completed','2025-05-15 17:40:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900137','debit',v_chk,54.78,'Marathon #2341 — Fuel','completed','2025-05-18 07:35:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900138','credit',v_chk,6400.00,'Payroll — Accenture Federal Services','completed','2025-06-13 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900139','debit',v_chk,145.67,'Target #0891 — Household and Electronics','completed','2025-06-15 14:55:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900140','debit',v_chk,13.99,'YouTube Premium — Monthly','completed','2025-06-17 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900141','credit',v_chk,6400.00,'Payroll — Accenture Federal Services','completed','2025-07-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900142','debit',v_chk,201.34,'AEP Ohio — Electric Service (summer peak)','completed','2025-07-15 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900143','debit',v_chk,178.90,'Costco Wholesale #0612','completed','2025-07-17 12:20:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900144','credit',v_chk,6400.00,'Payroll — Accenture Federal Services','completed','2025-08-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900145','debit',v_chk,78.45,'Columbia Gas of Ohio — Service','completed','2025-08-15 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900146','transfer',v_chk,v_sav,500.00,'Transfer to Core Savings','completed','2025-08-17 12:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900147','credit',v_chk,6400.00,'Payroll — Accenture Federal Services','completed','2025-09-12 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900148','debit',v_chk,98.67,'Kroger #0342 — Grocery','completed','2025-09-14 18:10:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900149','debit',v_chk,58.34,'Speedway #7734 — Fuel','completed','2025-09-16 08:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900150','credit',v_chk,6400.00,'Payroll — Accenture Federal Services','completed','2025-10-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900151','debit',v_chk,38.90,'CVS Pharmacy #4521 — Prescription','completed','2025-10-15 10:45:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900152','debit',v_chk,13.99,'Disney+ — Monthly Subscription','completed','2025-10-17 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900153','debit',v_chk,64.20,'OhioHealth Urgent Care — Copay','completed','2025-10-28 09:30:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900154','credit',v_chk,6400.00,'Payroll — Accenture Federal Services','completed','2025-11-14 09:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900155','debit',v_chk,184.23,'AEP Ohio — Electric Service','completed','2025-11-15 08:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900156','debit',v_chk,134.67,'Giant Eagle #0234 — Grocery','completed','2025-11-16 17:05:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900157','debit',v_chk,9.99,'Spotify Premium — Monthly','completed','2025-11-18 00:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  INSERT INTO transactions (reference,type,sender_account_id,receiver_account_id,amount,description,status,created_at)
  VALUES ('TXN-2025-900158','transfer',v_sav,v_chk,2000.00,'Transfer from Core Savings','completed','2025-11-20 12:00:00+00')
  ON CONFLICT (reference) DO NOTHING;

  RAISE NOTICE '✓ Block 6 — 2025 transactions done (36 rows)';
END $$;


-- ══════════════════════════════════════════════════════════════
-- BLOCK 7 — Notifications (10 rows)
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM users WHERE LOWER(email) = 'smmy23538@gmail.com';

  INSERT INTO notifications (id,user_id,type,title,message,severity,is_read,created_at)
  VALUES ('a1000001-0000-4000-8000-000000000001',v_uid,'account_opened','Welcome to Core Wallet',
    'Your Core Checking account is active. Manage your money, send payments, and track spending all in one place.',
    'success',true,'2022-01-14 09:06:00+00')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO notifications (id,user_id,type,title,message,severity,is_read,created_at)
  VALUES ('a1000001-0000-4000-8000-000000000002',v_uid,'deposit_received','Direct Deposit Received',
    'Your payroll deposit of $5,500.00 from Accenture Federal Services has been credited to your Checking account.',
    'success',true,'2022-01-14 09:05:30+00')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO notifications (id,user_id,type,title,message,severity,is_read,created_at)
  VALUES ('a1000001-0000-4000-8000-000000000003',v_uid,'account_opened','Savings Account Opened',
    'Your Core Savings account is now active. Start building your emergency fund with automatic transfers.',
    'success',true,'2022-05-28 12:01:00+00')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO notifications (id,user_id,type,title,message,severity,is_read,created_at)
  VALUES ('a1000001-0000-4000-8000-000000000004',v_uid,'large_transaction','Large Purchase Detected',
    'A purchase of $378.50 was made at Delta Air Lines on Aug 15, 2022. If this was not you, contact support immediately.',
    'warning',true,'2022-08-15 06:31:00+00')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO notifications (id,user_id,type,title,message,severity,is_read,created_at)
  VALUES ('a1000001-0000-4000-8000-000000000005',v_uid,'transfer_complete','Transfer Complete',
    'Your transfer of $750.00 to Core Savings was completed successfully.',
    'success',true,'2023-04-20 12:01:00+00')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO notifications (id,user_id,type,title,message,severity,is_read,created_at)
  VALUES ('a1000001-0000-4000-8000-000000000006',v_uid,'balance_milestone','Balance Milestone Reached',
    'Congratulations! Your combined account balance has passed $50,000. You are on track to meet your savings goals.',
    'info',true,'2024-06-14 09:06:00+00')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO notifications (id,user_id,type,title,message,severity,is_read,created_at)
  VALUES ('a1000001-0000-4000-8000-000000000007',v_uid,'card_issued','Debit Card Activated',
    'Your Visa Debit Card ending in 4731 is active and ready to use. Set your PIN in the Cards section.',
    'info',true,'2022-01-14 09:07:00+00')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO notifications (id,user_id,type,title,message,severity,is_read,created_at)
  VALUES ('a1000001-0000-4000-8000-000000000008',v_uid,'deposit_received','Direct Deposit Received',
    'Your payroll deposit of $6,400.00 from Accenture Federal Services has been credited to your Checking account.',
    'success',false,'2025-11-14 09:05:30+00')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO notifications (id,user_id,type,title,message,severity,is_read,created_at)
  VALUES ('a1000001-0000-4000-8000-000000000009',v_uid,'transfer_complete','Transfer Received',
    'A transfer of $2,000.00 from Core Savings has been credited to your Checking account.',
    'success',false,'2025-11-20 12:01:00+00')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO notifications (id,user_id,type,title,message,severity,is_read,created_at)
  VALUES ('a1000001-0000-4000-8000-000000000010',v_uid,'security','Annual Account Review',
    'Your account is in good standing. Review your security settings and ensure your contact info is up to date.',
    'info',false,'2025-11-15 08:00:00+00')
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✓ Block 7 — notifications done (10 rows)';
END $$;


-- ══════════════════════════════════════════════════════════════
-- VERIFY — Final summary (run last to confirm everything landed)
-- ══════════════════════════════════════════════════════════════
SELECT
  a.account_type                                          AS type,
  a.nickname,
  a.balance,
  a.available_balance,
  (SELECT COUNT(*) FROM transactions t
   WHERE t.sender_account_id = a.id
      OR t.receiver_account_id = a.id)                   AS tx_count,
  (SELECT COUNT(*) FROM cards c WHERE c.account_id = a.id) AS card_count
FROM  accounts a
JOIN  users    u ON u.id = a.user_id
WHERE LOWER(u.email) = 'smmy23538@gmail.com'
ORDER BY a.account_type;
