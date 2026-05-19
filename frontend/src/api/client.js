import axios from 'axios';

const TOKEN_KEY = 'cw_token';

function readToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

// VITE_API_URL must be baked in at build time via .env.production for:
//   • Capacitor builds (Android / iOS) — relative /api resolves to https://localhost/api
//     (Capacitor's built-in dev server), which returns index.html, not the backend
//   • Vercel deployments without an /api rewrite rule in vercel.json
const _apiBase = import.meta.env.VITE_API_URL || '/api';
const _isCapacitor = typeof window !== 'undefined' && !!(window.Capacitor);

if (_isCapacitor && !import.meta.env.VITE_API_URL) {
  console.error(
    '[API] Capacitor WebView detected but VITE_API_URL is not set.\n' +
    'All /api calls will resolve to https://localhost/api (Capacitor local server) and return HTML.\n' +
    'Fix: add VITE_API_URL=https://YOUR-RENDER-APP.onrender.com/api to frontend/.env.production\n' +
    'then rebuild: npm run build && npx cap sync android'
  );
}
console.log(`[API] base="${_apiBase}" capacitor=${_isCapacitor} mode=${import.meta.env.MODE}`);

const client = axios.create({
  baseURL: _apiBase,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = readToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status  = err.response?.status;
    const url     = err.config?.url || '';
    // Only hard-redirect on 401 when:
    //   • a token exists (expired session, not a fresh login attempt)
    //   • the request is NOT the login or verify-otp endpoints
    //     (those legitimately return 401 and must be caught by the caller)
    const isAuthEndpoint = url.includes('/auth/login') ||
                           url.includes('/auth/verify-otp') ||
                           url.includes('/auth/register');
    if (status === 401 && readToken() && !isAuthEndpoint) {
      console.warn('[client] 401 on protected route — clearing token and redirecting to /login');
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
