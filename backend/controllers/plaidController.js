const { pool }       = require('../config/database');
const asyncHandler   = require('../utils/asyncHandler');
const AppError       = require('../utils/AppError');
const { notify }     = require('../services/notificationService');
const { plaidClient, PLAID_AVAILABLE } = require('../utils/plaidClient');

// ─── Static fallback institutions (used when PLAID_CLIENT_ID is not set) ────
const POPULAR_INSTITUTIONS = [
  { institution_id: 'demo_chase',    name: 'Chase',                     primary_color: '#117ACA', logo: null },
  { institution_id: 'demo_bofa',     name: 'Bank of America',           primary_color: '#012169', logo: null },
  { institution_id: 'demo_wells',    name: 'Wells Fargo',               primary_color: '#D71E28', logo: null },
  { institution_id: 'demo_citi',     name: 'Citibank',                  primary_color: '#003B70', logo: null },
  { institution_id: 'demo_usbank',   name: 'U.S. Bank',                 primary_color: '#00529B', logo: null },
  { institution_id: 'demo_pnc',      name: 'PNC Bank',                  primary_color: '#FF6600', logo: null },
  { institution_id: 'demo_td',       name: 'TD Bank',                   primary_color: '#00B140', logo: null },
  { institution_id: 'demo_cap1',     name: 'Capital One',               primary_color: '#D22B2B', logo: null },
  { institution_id: 'demo_usaa',     name: 'USAA',                      primary_color: '#003087', logo: null },
  { institution_id: 'demo_ally',     name: 'Ally Bank',                 primary_color: '#7B189F', logo: null },
  { institution_id: 'demo_navy',     name: 'Navy Federal Credit Union', primary_color: '#002B5C', logo: null },
  { institution_id: 'demo_truist',   name: 'Truist',                    primary_color: '#4B0082', logo: null },
  { institution_id: 'demo_regions',  name: 'Regions Bank',              primary_color: '#004C97', logo: null },
  { institution_id: 'demo_fifth',    name: 'Fifth Third Bank',          primary_color: '#00843D', logo: null },
  { institution_id: 'demo_key',      name: 'KeyBank',                   primary_color: '#C8102E', logo: null },
  { institution_id: 'demo_citizens', name: 'Citizens Bank',             primary_color: '#0072CE', logo: null },
  { institution_id: 'demo_suntrust', name: 'SunTrust',                  primary_color: '#6B0E5C', logo: null },
  { institution_id: 'demo_bbt',      name: 'BB&T',                      primary_color: '#8B0000', logo: null },
  { institution_id: 'demo_svb',      name: 'Silicon Valley Bank',       primary_color: '#003366', logo: null },
  { institution_id: 'demo_discover', name: 'Discover Bank',             primary_color: '#FF6600', logo: null },
];

// ─── Async demo simulation (fire-and-forget) ────────────────────────────────
const simulateTransferFailure = async (transferId, userId, amount, institutionName) => {
  try {
    await new Promise(r => setTimeout(r, 2000));
    await pool.query(
      `UPDATE bank_transfers SET status = 'processing', updated_at = NOW() WHERE id = $1`,
      [transferId]
    );
    notify({
      userId,
      type:     'bank_transfer_processing',
      title:    'Transfer processing',
      message:  `Your transfer of $${parseFloat(amount).toFixed(2)} to ${institutionName} is now processing.`,
      severity: 'info',
      metadata: { transferId, amount, institution: institutionName },
    });

    await new Promise(r => setTimeout(r, 5000));
    await pool.query(
      `UPDATE bank_transfers
       SET status         = 'failed',
           failure_reason = $2,
           updated_at     = NOW()
       WHERE id = $1`,
      [transferId, 'No real payment rail is connected — this is a demo account. No money was moved.']
    );
    notify({
      userId,
      type:     'bank_transfer_failed',
      title:    'Transfer could not be processed',
      message:  `Your transfer of $${parseFloat(amount).toFixed(2)} to ${institutionName} could not be completed. This is a demo — no money was moved.`,
      severity: 'warning',
      metadata: { transferId, amount, institution: institutionName },
    });
  } catch (err) {
    console.error('[PlaidController] Demo simulation error:', err.message);
  }
};

// ─── GET /api/plaid/search?q= ────────────────────────────────────────────────
const searchInstitutions = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();

  if (PLAID_AVAILABLE && plaidClient) {
    const response = await plaidClient.institutionsSearch({
      query:         q || 'bank',
      country_codes: ['US'],
      options:       { include_optional_metadata: false },
    });
    const institutions = (response.data.institutions || []).slice(0, 20).map(i => ({
      institution_id: i.institution_id,
      name:           i.name,
      primary_color:  i.primary_color,
      logo:           i.logo,
    }));
    return res.json({ status: 'success', data: { institutions, isDemo: false } });
  }

  // Demo fallback
  const lowerQ = q.toLowerCase();
  const results = q
    ? POPULAR_INSTITUTIONS.filter(i => i.name.toLowerCase().includes(lowerQ))
    : POPULAR_INSTITUTIONS;

  res.json({ status: 'success', data: { institutions: results.slice(0, 20), isDemo: true } });
});

// ─── POST /api/plaid/link-token ───────────────────────────────────────────────
const createLinkToken = asyncHandler(async (req, res) => {
  if (!PLAID_AVAILABLE || !plaidClient) {
    throw new AppError('Plaid is not configured on this server. Use manual account entry.', 503);
  }
  const response = await plaidClient.linkTokenCreate({
    user:         { client_user_id: req.user.id },
    client_name:  'MCT Bank',
    products:     ['auth'],
    country_codes: ['US'],
    language:     'en',
  });
  res.json({ status: 'success', data: { link_token: response.data.link_token } });
});

// ─── POST /api/plaid/exchange-token ──────────────────────────────────────────
const exchangeToken = asyncHandler(async (req, res) => {
  if (!PLAID_AVAILABLE || !plaidClient) {
    throw new AppError('Plaid is not configured on this server. Use manual account entry.', 503);
  }
  const { public_token, institution_id, institution_name } = req.body;
  if (!public_token) throw new AppError('public_token is required', 400);

  const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token });
  const { access_token, item_id } = exchangeRes.data;

  // Save link item
  const { rows: itemRows } = await pool.query(
    `INSERT INTO plaid_link_items (user_id, access_token, item_id, institution_id, institution_name)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (item_id) DO UPDATE
       SET access_token = EXCLUDED.access_token, updated_at = NOW()
     RETURNING *`,
    [req.user.id, access_token, item_id, institution_id || '', institution_name || '']
  );
  const item = itemRows[0];

  // Fetch auth data (routing + account numbers)
  const authRes  = await plaidClient.authGet({ access_token });
  const accounts = authRes.data.accounts || [];
  const achNums  = authRes.data.numbers?.ach || [];

  const linked = [];
  for (const acct of accounts) {
    const ach = achNums.find(n => n.account_id === acct.account_id);
    const routing_last4 = ach?.routing ? ach.routing.slice(-4) : null;
    const account_last4 = ach?.account ? ach.account.slice(-4) : null;

    const { rows } = await pool.query(
      `INSERT INTO linked_bank_accounts
         (user_id, plaid_item_id, institution_name, account_name, account_type,
          routing_number_last4, account_number_last4, is_manual)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false)
       RETURNING *`,
      [req.user.id, item.id, institution_name || '', acct.name,
       acct.subtype || 'checking', routing_last4, account_last4]
    );
    linked.push(rows[0]);
  }

  notify({
    userId:   req.user.id,
    type:     'bank_linked',
    title:    'Bank account linked',
    message:  `${institution_name || 'Bank'} has been connected to your account.`,
    severity: 'success',
    metadata: { institution: institution_name, accounts: linked.length },
  });

  res.status(201).json({ status: 'success', data: { accounts: linked } });
});

// ─── GET /api/plaid/accounts ──────────────────────────────────────────────────
const getLinkedAccounts = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, institution_name, account_name, account_type,
            routing_number_last4, account_number_last4, is_manual, created_at
     FROM linked_bank_accounts
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ status: 'success', data: { accounts: rows } });
});

// ─── POST /api/plaid/manual-account ──────────────────────────────────────────
const addManualAccount = asyncHandler(async (req, res) => {
  const { institutionName, accountName, accountType, routingNumber, accountNumber } = req.body;

  if (!institutionName || !accountName || !routingNumber || !accountNumber) {
    throw new AppError('institutionName, accountName, routingNumber, and accountNumber are required', 400);
  }
  if (!/^\d{9}$/.test(routingNumber)) {
    throw new AppError('Routing number must be exactly 9 digits', 400);
  }
  if (!/^\d{4,17}$/.test(accountNumber)) {
    throw new AppError('Account number must be 4–17 digits', 400);
  }
  const type = accountType || 'checking';
  if (!['checking', 'savings'].includes(type)) {
    throw new AppError('accountType must be "checking" or "savings"', 400);
  }

  const routing_last4 = routingNumber.slice(-4);
  const account_last4 = accountNumber.slice(-4);

  const { rows } = await pool.query(
    `INSERT INTO linked_bank_accounts
       (user_id, institution_name, account_name, account_type,
        routing_number_last4, account_number_last4, is_manual)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING id, institution_name, account_name, account_type,
               routing_number_last4, account_number_last4, is_manual, created_at`,
    [req.user.id, institutionName.trim(), accountName.trim(), type,
     routing_last4, account_last4]
  );

  notify({
    userId:   req.user.id,
    type:     'bank_linked',
    title:    'Bank account linked',
    message:  `${institutionName} (${accountName}) has been linked to your account.`,
    severity: 'success',
    metadata: { institution: institutionName, account_last4 },
  });

  res.status(201).json({ status: 'success', data: { account: rows[0] } });
});

// ─── DELETE /api/plaid/accounts/:id ──────────────────────────────────────────
const unlinkAccount = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `DELETE FROM linked_bank_accounts
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [req.params.id, req.user.id]
  );
  if (!rows.length) throw new AppError('Linked account not found', 404);
  res.json({ status: 'success', message: 'Account unlinked' });
});

// ─── POST /api/plaid/transfers ────────────────────────────────────────────────
const createTransfer = asyncHandler(async (req, res) => {
  const { linkedAccountId, fromAccountId, amount, memo } = req.body;

  if (!linkedAccountId) throw new AppError('linkedAccountId is required', 400);
  if (!fromAccountId)   throw new AppError('fromAccountId is required', 400);
  const parsedAmount = parseFloat(amount);
  if (!parsedAmount || parsedAmount <= 0) throw new AppError('Amount must be a positive number', 400);
  if (parsedAmount > 25000) throw new AppError('Single transfer limit is $25,000', 400);

  // Verify linked account ownership
  const { rows: linkedRows } = await pool.query(
    `SELECT * FROM linked_bank_accounts WHERE id = $1 AND user_id = $2`,
    [linkedAccountId, req.user.id]
  );
  if (!linkedRows.length) throw new AppError('Linked account not found', 404);
  const linked = linkedRows[0];

  // Verify from-account ownership
  const { rows: fromRows } = await pool.query(
    `SELECT * FROM accounts WHERE id = $1 AND user_id = $2`,
    [fromAccountId, req.user.id]
  );
  if (!fromRows.length) throw new AppError('Source account not found', 404);

  const isReal   = process.env.ENABLE_REAL_TRANSFERS === 'true';
  const arrival  = new Date();
  arrival.setDate(arrival.getDate() + 3);

  const { rows } = await pool.query(
    `INSERT INTO bank_transfers
       (user_id, from_account_id, linked_account_id, institution_name, account_name,
        routing_number_last4, account_number_last4, amount, memo,
        direction, status, is_demo, estimated_arrival)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'outbound','pending',$10,$11)
     RETURNING *`,
    [
      req.user.id, fromAccountId, linkedAccountId,
      linked.institution_name, linked.account_name,
      linked.routing_number_last4, linked.account_number_last4,
      parsedAmount, memo?.trim() || null,
      !isReal,
      arrival.toISOString().split('T')[0],
    ]
  );
  const transfer = rows[0];

  notify({
    userId:   req.user.id,
    type:     'bank_transfer_pending',
    title:    'Bank transfer initiated',
    message:  `Your transfer of $${parsedAmount.toFixed(2)} to ${linked.institution_name} is pending.`,
    severity: 'info',
    metadata: { transferId: transfer.id, amount: parsedAmount, institution: linked.institution_name },
  });

  if (!isReal) {
    simulateTransferFailure(transfer.id, req.user.id, parsedAmount, linked.institution_name);
  }

  res.status(201).json({ status: 'success', data: { transfer } });
});

// ─── GET /api/plaid/transfers ─────────────────────────────────────────────────
const getTransfers = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM bank_transfers WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [req.user.id]
  );
  res.json({ status: 'success', data: { transfers: rows } });
});

// ─── GET /api/plaid/transfers/:id ────────────────────────────────────────────
const getOneTransfer = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM bank_transfers WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!rows.length) throw new AppError('Transfer not found', 404);
  res.json({ status: 'success', data: { transfer: rows[0] } });
});

module.exports = {
  searchInstitutions,
  createLinkToken,
  exchangeToken,
  getLinkedAccounts,
  addManualAccount,
  unlinkAccount,
  createTransfer,
  getTransfers,
  getOneTransfer,
};
