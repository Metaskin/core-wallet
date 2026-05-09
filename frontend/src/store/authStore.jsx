import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

// ─── Token storage helpers ─────────────────────────────────────────────────
// When rememberMe=true  → localStorage  (survives browser close)
// When rememberMe=false → sessionStorage (cleared when tab/browser closes)
const TOKEN_KEY = 'cw_token';

function saveToken(token, remember) {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);   // clear the other store
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);     // clear the other store
  }
}

function readToken() {
  // sessionStorage takes priority (more recent, same-tab session)
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

// ─── Provider ──────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  // Called once on app mount — restores session from whichever storage has a token
  const hydrate = useCallback(async () => {
    const token = readToken();
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authAPI.me();
      setUser(data.data.user);
      setAccount(data.data.account);
    } catch {
      clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  // Returns { requiresOtp: true, userId } when OTP is needed, otherwise sets session directly.
  const login = useCallback(async (email, password, rememberMe = true) => {
    console.log('[Auth] login() called — payload:', { email, password: '***' });
    const response = await authAPI.login({ email, password });
    console.log('[Auth] login() response status:', response.status);
    console.log('[Auth] login() response body:', response.data);

    const body = response.data;
    if (!body || !body.data) {
      console.error('[Auth] login() unexpected response shape — body.data is missing:', body);
      throw new Error('Unexpected server response. Please try again.');
    }

    if (body.data.requiresOtp) {
      console.log('[Auth] login() → requiresOtp=true  userId:', body.data.userId);
      return { requiresOtp: true, userId: body.data.userId };
    }

    const { user, account, token } = body.data;
    saveToken(token, rememberMe);
    setUser(user);
    setAccount(account);
    console.log('[Auth] login() → session set directly (no OTP)');
    return { requiresOtp: false };
  }, []);

  const verifyOtp = useCallback(async (userId, code, rememberMe = true) => {
    console.log('[Auth] verifyOtp() called — userId:', userId);
    const response = await authAPI.verifyOtp({ userId, code });
    console.log('[Auth] verifyOtp() response status:', response.status);
    const { user, account, token } = response.data.data;
    saveToken(token, rememberMe);
    setUser(user);
    setAccount(account);
    console.log('[Auth] verifyOtp() → session established for', user?.email);
  }, []);

  const register = useCallback(async (email, password, fullName, avatarColor) => {
    const { data } = await authAPI.register({ email, password, fullName, avatarColor });
    const { user, account, token } = data.data;
    saveToken(token, true);
    setUser(user);
    setAccount(account);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setAccount(null);
  }, []);

  const refreshAccount = useCallback(async () => {
    try {
      const { data } = await authAPI.me();
      setAccount(data.data.account);
    } catch {}
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await authAPI.changePassword({ currentPassword, newPassword });
  }, []);

  const changeEmail = useCallback(async (newEmail) => {
    const { data } = await authAPI.changeEmail({ newEmail });
    setUser(data.data.user);
  }, []);

  const contextValue = useMemo(() => ({
    user, account, loading,
    hydrate, login, verifyOtp, register, logout, refreshAccount,
    changePassword, changeEmail,
  }), [user, account, loading, hydrate, login, verifyOtp, register, logout, refreshAccount, changePassword, changeEmail]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
