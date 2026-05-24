const PLAID_AVAILABLE = !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
const PLAID_ENV       = process.env.PLAID_ENV || 'sandbox';

let plaidClient = null;

if (PLAID_AVAILABLE) {
  try {
    const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
    const configuration = new Configuration({
      basePath: PlaidEnvironments[PLAID_ENV] || PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET':    process.env.PLAID_SECRET,
        },
      },
    });
    plaidClient = new PlaidApi(configuration);
    console.log(`[Plaid] Client initialised (env=${PLAID_ENV})`);
  } catch (err) {
    console.warn('[Plaid] Failed to initialise client:', err.message);
    console.warn('[Plaid] Is the "plaid" npm package installed? Run: npm install plaid');
  }
} else {
  console.log('[Plaid] No credentials set — running in demo mode (static institution list, no real API calls)');
}

module.exports = { plaidClient, PLAID_AVAILABLE, PLAID_ENV };
