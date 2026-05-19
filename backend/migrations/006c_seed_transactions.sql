-- ============================================================
-- 006c_seed_transactions.sql
-- ============================================================
-- Flat SQL — no DO $$ blocks, no variables, no BEGIN/COMMIT.
-- Each INSERT is a completely standalone statement.
-- Account IDs resolved inline via subquery.
-- ON CONFLICT (reference) DO NOTHING = safe to re-run.
-- Run AFTER 006_seed_smmy.sql (accounts must exist first).
-- ============================================================

-- Quick sanity check — should return 2 rows before running
SELECT account_type, balance FROM accounts
WHERE user_id = (SELECT id FROM users WHERE LOWER(email) = 'smmy23538@gmail.com');


-- ── 2022 TRANSACTIONS ─────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900001','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5500.00,'Payroll — Accenture Federal Services','completed','2022-01-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900002','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),89.47,'Kroger #0342 — Grocery','completed','2022-01-17 18:23:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900003','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),134.22,'AEP Ohio — Electric Service','completed','2022-01-20 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900004','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),79.99,'Spectrum Internet — Monthly Service','completed','2022-01-20 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900005','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),52.40,'Speedway #7734 — Fuel','completed','2022-01-25 07:45:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900006','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5500.00,'Payroll — Accenture Federal Services','completed','2022-02-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900007','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),156.88,'Columbia Gas of Ohio — Heating','completed','2022-02-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900008','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),17.99,'Hulu — Monthly Subscription','completed','2022-02-17 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900009','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),67.34,'Target #0891 — Household Supplies','completed','2022-02-22 14:12:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900010','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5500.00,'Payroll — Accenture Federal Services','completed','2022-03-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900011','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),79.99,'Spectrum Internet — Monthly Service','completed','2022-03-16 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900012','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),34.67,'CVS Pharmacy #4521 — Prescription','completed','2022-03-19 11:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900013','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),103.45,'Meijer #0312 — Grocery','completed','2022-03-22 19:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900014','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5500.00,'Payroll — Accenture Federal Services','completed','2022-04-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900015','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),245.00,'OhioHealth — FSA Reimbursement','completed','2022-04-15 10:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900016','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),78.23,'Walmart Supercenter #3421 — Grocery','completed','2022-04-18 17:55:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900017','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),9.99,'Spotify Premium — Monthly','completed','2022-04-22 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900018','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5500.00,'Payroll — Accenture Federal Services','completed','2022-05-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900019','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),112.45,'Kroger #0342 — Grocery','completed','2022-05-16 18:40:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900020','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),89.50,'AEP Ohio — Electric Service','completed','2022-05-20 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900021','transfer',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='savings'),
 500.00,'Transfer to Core Savings','completed','2022-05-28 12:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900022','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5500.00,'Payroll — Accenture Federal Services','completed','2022-06-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900023','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),79.99,'Spectrum Internet — Monthly Service','completed','2022-06-16 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900024','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),28.45,'Bob Evans Restaurant — Dublin OH','completed','2022-06-18 12:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900025','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5500.00,'Payroll — Accenture Federal Services','completed','2022-07-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900026','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),156.78,'AEP Ohio — Electric Service (summer)','completed','2022-07-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900027','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),167.89,'Costco Wholesale #0612','completed','2022-07-18 11:20:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900028','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5500.00,'Payroll — Accenture Federal Services','completed','2022-08-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900029','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),378.50,'Delta Air Lines — Flight CMH to LAS','completed','2022-08-15 06:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900030','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),213.00,'Marriott Columbus Downtown — 2 Nights','completed','2022-08-18 14:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900031','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5500.00,'Payroll — Accenture Federal Services','completed','2022-09-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900032','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),134.50,'Progressive Insurance — Auto Monthly','completed','2022-09-16 08:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900033','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),98.67,'Giant Eagle #0234 — Grocery','completed','2022-09-20 17:45:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900034','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5500.00,'Payroll — Accenture Federal Services','completed','2022-10-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900035','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),156.23,'Columbia Gas of Ohio — Heating','completed','2022-10-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900036','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),14.99,'Amazon Prime — Monthly Membership','completed','2022-10-22 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900037','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),47.30,'Marathon #2341 — Fuel','completed','2022-10-26 08:10:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900038','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5500.00,'Payroll — Accenture Federal Services','completed','2022-11-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900039','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),189.45,'AEP Ohio — Electric Service','completed','2022-11-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900040','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),96.78,'Meijer #0312 — Grocery','completed','2022-11-19 16:55:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900041','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),13.99,'Disney+ — Monthly Subscription','completed','2022-11-22 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900042','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),16.78,'Wendys #0445 — Dublin OH','completed','2022-11-25 12:45:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900043','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5500.00,'Payroll — Accenture Federal Services','completed','2022-12-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900044','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),201.34,'Columbia Gas of Ohio — Heating (winter)','completed','2022-12-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900045','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),145.78,'Giant Eagle #0234 — Holiday Grocery','completed','2022-12-19 15:20:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2022-900046','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),178.90,'Costco Wholesale #0612 — Holiday','completed','2022-12-20 13:45:00+00')
ON CONFLICT (reference) DO NOTHING;

SELECT '2022 complete — 46 rows attempted' AS checkpoint;


-- ── 2023 TRANSACTIONS ─────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900047','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5812.50,'Payroll — Accenture Federal Services','completed','2023-01-13 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900048','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),145.67,'AEP Ohio — Electric Service','completed','2023-01-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900049','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),79.99,'Spectrum Internet — Monthly Service','completed','2023-01-18 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900050','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5812.50,'Payroll — Accenture Federal Services','completed','2023-02-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900051','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),178.34,'Columbia Gas of Ohio — Heating','completed','2023-02-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900052','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),12.45,'Wendys #0445 — Dublin OH','completed','2023-02-19 13:10:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900053','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5812.50,'Payroll — Accenture Federal Services','completed','2023-03-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900054','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),95.23,'Kroger #0342 — Grocery','completed','2023-03-16 18:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900055','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),10.99,'Disney+ — Monthly Subscription','completed','2023-03-20 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900056','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5812.50,'Payroll — Accenture Federal Services','completed','2023-04-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900057','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),98.45,'AEP Ohio — Electric Service','completed','2023-04-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900058','transfer',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='savings'),
 750.00,'Transfer to Core Savings','completed','2023-04-20 12:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900059','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5812.50,'Payroll — Accenture Federal Services','completed','2023-05-15 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900060','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),85.67,'Walmart Supercenter #3421 — Grocery','completed','2023-05-16 17:20:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900061','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),14.99,'Amazon Prime — Monthly Membership','completed','2023-05-22 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900062','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5812.50,'Payroll — Accenture Federal Services','completed','2023-06-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900063','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),123.45,'Target #0891 — Household and Apparel','completed','2023-06-15 14:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900064','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),412.00,'Delta Air Lines — Flight CMH to MIA','completed','2023-06-18 06:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900065','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5812.50,'Payroll — Accenture Federal Services','completed','2023-07-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900066','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),178.90,'AEP Ohio — Electric Service (summer peak)','completed','2023-07-17 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900067','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),16.78,'Chipotle Mexican Grill — Columbus OH','completed','2023-07-20 12:50:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900068','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),13.99,'YouTube Premium — Monthly','completed','2023-07-22 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900069','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5812.50,'Payroll — Accenture Federal Services','completed','2023-08-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900070','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),79.99,'Spectrum Internet — Monthly Service','completed','2023-08-15 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900071','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),98.34,'Meijer #0312 — Grocery','completed','2023-08-19 16:10:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900072','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5812.50,'Payroll — Accenture Federal Services','completed','2023-09-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900073','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),67.89,'Columbia Gas of Ohio — Service','completed','2023-09-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900074','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),58.23,'Marathon #2341 — Fuel','completed','2023-09-19 07:50:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900075','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5812.50,'Payroll — Accenture Federal Services','completed','2023-10-13 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900076','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),178.50,'Nationwide Insurance — Healthcare Reimbursement','completed','2023-10-16 10:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900077','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),79.99,'Spectrum Internet — Monthly Service','completed','2023-10-18 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900078','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),32.45,'Bob Evans Restaurant — Columbus OH','completed','2023-10-22 18:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900079','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5812.50,'Payroll — Accenture Federal Services','completed','2023-11-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900080','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),167.45,'AEP Ohio — Electric Service','completed','2023-11-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900081','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),17.99,'Hulu — Monthly Subscription','completed','2023-11-18 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900082','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),28.90,'Walgreens #5234 — Pharmacy','completed','2023-11-22 11:15:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900083','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),5812.50,'Payroll — Accenture Federal Services','completed','2023-12-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900084','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),198.45,'Columbia Gas of Ohio — Heating (winter)','completed','2023-12-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900085','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),145.78,'Giant Eagle #0234 — Holiday Grocery','completed','2023-12-19 16:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2023-900086','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),189.45,'Costco Wholesale #0612 — Holiday','completed','2023-12-21 12:30:00+00')
ON CONFLICT (reference) DO NOTHING;

SELECT '2023 complete — 40 rows attempted' AS checkpoint;


-- ── 2024 TRANSACTIONS ─────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900087','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6123.00,'Payroll — Accenture Federal Services','completed','2024-01-12 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900088','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),152.34,'AEP Ohio — Electric Service','completed','2024-01-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900089','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),17.99,'Hulu — Monthly Subscription','completed','2024-01-18 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900090','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6123.00,'Payroll — Accenture Federal Services','completed','2024-02-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900091','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),189.45,'Columbia Gas of Ohio — Heating','completed','2024-02-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900092','transfer',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='savings'),
 1000.00,'Transfer to Core Savings','completed','2024-02-18 12:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900093','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6123.00,'Payroll — Accenture Federal Services','completed','2024-03-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900094','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),108.67,'Kroger #0342 — Grocery','completed','2024-03-15 17:50:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900095','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),9.99,'Spotify Premium — Monthly','completed','2024-03-18 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900096','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6123.00,'Payroll — Accenture Federal Services','completed','2024-04-12 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900097','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),112.45,'AEP Ohio — Electric Service','completed','2024-04-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900098','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),2.99,'Apple iCloud — 50GB Storage Plan','completed','2024-04-18 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900099','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6123.00,'Payroll — Accenture Federal Services','completed','2024-05-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900100','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),189.45,'Costco Wholesale #0612','completed','2024-05-15 11:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900101','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),61.23,'Speedway #7734 — Fuel','completed','2024-05-18 07:55:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900102','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6123.00,'Payroll — Accenture Federal Services','completed','2024-06-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900103','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),289.00,'Southwest Airlines — Flight CMH to DEN','completed','2024-06-15 07:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900104','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),84.99,'Spectrum Internet — Monthly Service','completed','2024-06-18 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900105','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6123.00,'Payroll — Accenture Federal Services','completed','2024-07-12 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900106','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),189.67,'AEP Ohio — Electric Service (summer peak)','completed','2024-07-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900107','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),32.45,'Bob Evans Restaurant — Westerville OH','completed','2024-07-18 18:45:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900108','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6123.00,'Payroll — Accenture Federal Services','completed','2024-08-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900109','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),92.34,'Walmart Supercenter #3421 — Grocery','completed','2024-08-15 16:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900110','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),134.50,'Progressive Insurance — Auto Monthly','completed','2024-08-16 08:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900111','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6123.00,'Payroll — Accenture Federal Services','completed','2024-09-13 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900112','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),89.25,'Nationwide Insurance — Renters Policy','completed','2024-09-14 08:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900113','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),67.45,'BP #4521 — Fuel','completed','2024-09-17 07:40:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900114','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6123.00,'Payroll — Accenture Federal Services','completed','2024-10-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900115','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),45.23,'CVS Pharmacy #4521 — Prescription','completed','2024-10-15 11:20:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900116','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),21.56,'Panera Bread — Columbus OH','completed','2024-10-18 12:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900117','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6123.00,'Payroll — Accenture Federal Services','completed','2024-11-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900118','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),134.56,'Giant Eagle #0234 — Grocery','completed','2024-11-15 17:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900119','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),18.90,'Chipotle Mexican Grill — Columbus OH','completed','2024-11-18 13:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900120','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6123.00,'Payroll — Accenture Federal Services','completed','2024-12-13 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900121','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),213.45,'Columbia Gas of Ohio — Heating (winter)','completed','2024-12-14 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2024-900122','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),156.78,'Target #0891 — Holiday Shopping','completed','2024-12-19 15:10:00+00')
ON CONFLICT (reference) DO NOTHING;

SELECT '2024 complete — 36 rows attempted' AS checkpoint;


-- ── 2025 TRANSACTIONS ─────────────────────────────────────────

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900123','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6400.00,'Payroll — Accenture Federal Services','completed','2025-01-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900124','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),164.78,'AEP Ohio — Electric Service','completed','2025-01-16 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900125','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),198.45,'Columbia Gas of Ohio — Heating','completed','2025-01-17 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900126','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6400.00,'Payroll — Accenture Federal Services','completed','2025-02-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900127','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),84.99,'Spectrum Internet — Monthly Service','completed','2025-02-15 08:01:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900128','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),312.00,'OhioHealth — Annual FSA Reimbursement','completed','2025-02-17 10:15:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900129','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6400.00,'Payroll — Accenture Federal Services','completed','2025-03-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900130','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),112.34,'Kroger #0342 — Grocery','completed','2025-03-15 18:20:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900131','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),17.99,'Hulu — Monthly Subscription','completed','2025-03-17 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900132','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6400.00,'Payroll — Accenture Federal Services','completed','2025-04-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900133','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),123.45,'AEP Ohio — Electric Service','completed','2025-04-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900134','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),14.99,'Amazon Prime — Monthly Membership','completed','2025-04-17 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900135','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6400.00,'Payroll — Accenture Federal Services','completed','2025-05-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900136','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),89.45,'Meijer #0312 — Grocery','completed','2025-05-15 17:40:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900137','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),54.78,'Marathon #2341 — Fuel','completed','2025-05-18 07:35:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900138','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6400.00,'Payroll — Accenture Federal Services','completed','2025-06-13 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900139','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),145.67,'Target #0891 — Household and Electronics','completed','2025-06-15 14:55:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900140','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),13.99,'YouTube Premium — Monthly','completed','2025-06-17 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900141','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6400.00,'Payroll — Accenture Federal Services','completed','2025-07-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900142','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),201.34,'AEP Ohio — Electric Service (summer peak)','completed','2025-07-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900143','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),178.90,'Costco Wholesale #0612','completed','2025-07-17 12:20:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900144','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6400.00,'Payroll — Accenture Federal Services','completed','2025-08-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900145','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),78.45,'Columbia Gas of Ohio — Service','completed','2025-08-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900146','transfer',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='savings'),
 500.00,'Transfer to Core Savings','completed','2025-08-17 12:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900147','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6400.00,'Payroll — Accenture Federal Services','completed','2025-09-12 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900148','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),98.67,'Kroger #0342 — Grocery','completed','2025-09-14 18:10:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900149','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),58.34,'Speedway #7734 — Fuel','completed','2025-09-16 08:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900150','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6400.00,'Payroll — Accenture Federal Services','completed','2025-10-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900151','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),38.90,'CVS Pharmacy #4521 — Prescription','completed','2025-10-15 10:45:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900152','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),13.99,'Disney+ — Monthly Subscription','completed','2025-10-17 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900153','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),64.20,'OhioHealth Urgent Care — Copay','completed','2025-10-28 09:30:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900154','credit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),6400.00,'Payroll — Accenture Federal Services','completed','2025-11-14 09:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900155','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),184.23,'AEP Ohio — Electric Service','completed','2025-11-15 08:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900156','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),134.67,'Giant Eagle #0234 — Grocery','completed','2025-11-16 17:05:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900157','debit',(SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),9.99,'Spotify Premium — Monthly','completed','2025-11-18 00:00:00+00')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO transactions (reference,type,sender_account_id,receiver_account_id,amount,description,status,created_at) VALUES
('TXN-2025-900158','transfer',
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='savings'),
 (SELECT id FROM accounts WHERE user_id=(SELECT id FROM users WHERE LOWER(email)='smmy23538@gmail.com') AND account_type='checking'),
 2000.00,'Transfer from Core Savings','completed','2025-11-20 12:00:00+00')
ON CONFLICT (reference) DO NOTHING;

SELECT '2025 complete — 36 rows attempted' AS checkpoint;


-- ── FINAL COUNT ───────────────────────────────────────────────
SELECT
  a.account_type,
  a.nickname,
  a.balance,
  COUNT(t.id) AS tx_count
FROM accounts a
JOIN users u ON u.id = a.user_id
LEFT JOIN transactions t ON (t.sender_account_id = a.id OR t.receiver_account_id = a.id)
WHERE LOWER(u.email) = 'smmy23538@gmail.com'
GROUP BY a.account_type, a.nickname, a.balance
ORDER BY a.account_type;
