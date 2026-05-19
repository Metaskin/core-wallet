import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { authAPI } from '../api';
import { getInitials } from '../utils/formatters';

const AuthContext = createContext(null);

const TOKEN_KEY = 'cw_token';

function saveToken(token, remember) {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

function readToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user,     setUser]     = useState(null);
  const [account,  setAccount]  = useState(null);   // primary checking
  const [accounts, setAccounts] = useState([]);      // all accounts
  const [loading,  setLoading]  = useState(true);

  const setSession = useCallback(({ user, account, accounts }) => {
    setUser(user);
    setAccount(account || null);
    setAccounts(Array.isArray(accounts) ? accounts : (account ? [account] : []));
  }, []);

  const hydrate = useCallback(async () => {
    const token = readToken();
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authAPI.me();
      setSession(data.data);
    } catch {
      clearToken();
    } finally {
      setLoading(false);
    }
  }, [setSession]);

  const login = useCallback(async (email, password, rememberMe = true) => {
    console.log('[Auth] login() called — API base:', import.meta.env.VITE_API_URL || '/api (fallback)');

    let response;
    try {
      response = await authAPI.login({ email, password });
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;
      console.error('[Auth] login request failed — status:', status, '| msg:', serverMsg, '| err:', err.message);

      if (!err.response) {
        // Network-level failure: no internet, CORS block, server down
        throw new Error('Unable to reach the server. Check your internet connection and try again.');
      }
      if (status === 401) throw new Error(serverMsg || 'Incorrect email or password.');
      if (status === 429) throw new Error('Too many login attempts. Please wait a moment and try again.');
      if (status === 404) throw new Error('Authentication service not found. Please contact support.');
      if (status >= 500)  throw new Error('Server temporarily unavailable. Please try again in a moment.');
      throw new Error(serverMsg || 'Login failed. Please try again.');
    }

    const body = response.data;
    if (!body || !body.data) {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      console.error(
        '[Auth] login: unexpected response body.',
        '| type:', typeof body,
        '| preview:', typeof body === 'string' ? body.slice(0, 200) : JSON.stringify(body),
        '| API base:', apiBase
      );
      // Body is likely HTML — VITE_API_URL missing /api or pointing at wrong URL
      throw new Error('Authentication service returned an unexpected response. Please try again.');
    }

    if (body.data.requiresOtp) {
      return { requiresOtp: true, userId: body.data.userId };
    }

    const { user, account, accounts, token } = body.data;
    saveToken(token, rememberMe);
    setSession({ user, account, accounts });
    return { requiresOtp: false };
  }, [setSession]);

  const verifyOtp = useCallback(async (userId, code, rememberMe = true) => {
    const response = await authAPI.verifyOtp({ userId, code });
    const { user, account, accounts, token } = response.data.data;
    saveToken(token, rememberMe);
    setSession({ user, account, accounts });
  }, [setSession]);

  const register = useCallback(async (email, password, fullName, avatarColor) => {
    const { data } = await authAPI.register({ email, password, fullName, avatarColor });
    const { user, account, accounts, token } = data.data;
    saveToken(token, true);
    setSession({ user, account, accounts });
  }, [setSession]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setAccount(null);
    setAccounts([]);
  }, []);

  const refreshAccount = useCallback(async () => {
    try {
      const { data } = await authAPI.me();
      setSession(data.data);
    } catch {}
  }, [setSession]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await authAPI.changePassword({ currentPassword, newPassword });
  }, []);

  const changeEmail = useCallback(async (newEmail) => {
    const { data } = await authAPI.changeEmail({ newEmail });
    setUser(data.data.user);
  }, []);

  // ── Enriched user: adds display-friendly computed fields ─────────────────────
  const enrichedUser = useMemo(() => {
    if (!user) return null;
    const parts = (user.fullName || '').trim().split(/\s+/);
    return {
      ...user,
      firstName:      parts[0] || '',
      lastName:       parts.slice(1).join(' ') || '',
      avatarInitials: getInitials(user.fullName),
    };
  }, [user]);

  // ── Enriched single account (primary checking — backward compat) ──────────────
  const enrichedAccount = useMemo(() => {
    if (!account) return null;
    const num = account.accountNumber || '';
    return {
      ...account,
      maskedAccountNumber: num ? `•••• ${num.slice(-4)}` : '—',
      ledgerBalance:       account.balance          ?? 0,
      availableBalance:    account.availableBalance  ?? account.balance ?? 0,
      pendingBalance:      account.pendingBalance    ?? 0,
    };
  }, [account]);

  // ── Enriched all accounts (checking + savings) ───────────────────────────────
  const enrichedAccounts = useMemo(() =>
    accounts.map(a => {
      const num = a.accountNumber || '';
      return {
        ...a,
        maskedAccountNumber: num ? `•••• ${num.slice(-4)}` : '—',
        ledgerBalance:       a.balance          ?? 0,
        availableBalance:    a.availableBalance  ?? a.balance ?? 0,
        pendingBalance:      a.pendingBalance    ?? 0,
      };
    }),
  [accounts]);

  const primaryChecking = useMemo(
    () => enrichedAccounts.find(a => a.accountType === 'checking') || enrichedAccount,
    [enrichedAccounts, enrichedAccount]
  );

  const primarySavings = useMemo(
    () => enrichedAccounts.find(a => a.accountType === 'savings') || null,
    [enrichedAccounts]
  );

  const contextValue = useMemo(() => ({
    user: enrichedUser,
    account: enrichedAccount,          // primary checking (backward compat)
    accounts: enrichedAccounts,
    primaryChecking,
    primarySavings,
    loading,
    hydrate, login, verifyOtp, register, logout, refreshAccount,
    changePassword, changeEmail,
  }), [
    enrichedUser, enrichedAccount, enrichedAccounts,
    primaryChecking, primarySavings,
    loading, hydrate, login, verifyOtp, register, logout, refreshAccount,
    changePassword, changeEmail,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
