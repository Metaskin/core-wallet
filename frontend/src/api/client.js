import axios from 'axios';

const TOKEN_KEY = 'cw_token';

function readToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

// In development, VITE_API_URL is unset and Vite's proxy forwards /api → localhost:5001.
// In production (Amplify), set VITE_API_URL=https://your-backend.com/api in Amplify env vars.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
