import { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore';
import { authAPI } from '../api';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

// ─── View machine: 'auth' | 'otp' | 'forgot' | 'reset' ──────────────────────
export default function Login() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token');
  const initialTab = searchParams.get('tab'); // 'register' from landing page CTA

  const [view,       setView]       = useState(resetToken ? 'reset' : 'auth');
  const [pendingOtp, setPendingOtp] = useState(null); // { userId, email, rememberMe }

  const handleOtpRequired = ({ userId, email, rememberMe }) => {
    setPendingOtp({ userId, email, rememberMe });
    setView('otp');
  };

  if (view === 'otp' && pendingOtp) {
    return (
      <Shell>
        <OtpView
          {...pendingOtp}
          onBack={() => { setPendingOtp(null); setView('auth'); }}
        />
      </Shell>
    );
  }
  if (view === 'forgot') {
    return (
      <Shell>
        <ForgotView
          onBack={() => setView('auth')}
          onSent={() => setView('reset')}
        />
      </Shell>
    );
  }
  if (view === 'reset') {
    return (
      <Shell>
        <ResetView initialToken={resetToken || ''} onDone={() => setView('auth')} />
      </Shell>
    );
  }

  return (
    <Shell>
      <AuthView onForgot={() => setView('forgot')} initialTab={initialTab} onOtpRequired={handleOtpRequired} />
    </Shell>
  );
}

// ─── Shared wrapper ───────────────────────────────────────────────────────────
function Shell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white font-bold">C</div>
          <span className="font-display font-bold text-white text-xl tracking-tight">CoreWallet</span>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Login + Register tabs ────────────────────────────────────────────────────
function AuthView({ onForgot, initialTab, onOtpRequired }) {
  const { login, register } = useAuth();
  const [tab,        setTab]       = useState(initialTab === 'register' ? 'register' : 'login');
  const [loading,    setLoading]   = useState(false);
  // Remember me: default true so returning users stay logged in automatically
  const [rememberMe, setRememberMe] = useState(true);
  const [loginForm,  setLoginForm]  = useState({ email: '', password: '' });
  const [regForm,    setRegForm]    = useState({ email: '', password: '', fullName: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('[Login] submitting — email:', loginForm.email);
      const result = await login(loginForm.email, loginForm.password, rememberMe);
      console.log('[Login] login() resolved — result:', result);

      if (result?.requiresOtp) {
        console.log('[Login] requiresOtp=true → transitioning to OTP screen, userId:', result.userId);
        onOtpRequired({ userId: result.userId, email: loginForm.email, rememberMe });
      } else {
        console.log('[Login] no OTP required — session set directly');
      }
    } catch (err) {
      // Log the real error so the browser console always shows the root cause
      console.error('[Login] login() threw:', err);
      console.error('[Login] err.response:', err.response);
      const msg = err.response?.data?.message || err.message || 'Login failed — please try again';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regForm.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await register(regForm.email, regForm.password, regForm.fullName);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-bright rounded-2xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.06]">
        {['login', 'register'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors capitalize ${
              tab === t ? 'text-white border-b-2 border-accent' : 'text-white/30 hover:text-white/60'
            }`}
          >
            {t === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      {/* Login form */}
      {tab === 'login' && (
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Email</label>
            <input type="email" className="input-base" placeholder="you@example.com"
              value={loginForm.email}
              onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs text-white/40 uppercase tracking-wider">Password</label>
              <button type="button" onClick={onForgot}
                className="text-xs text-accent/70 hover:text-accent transition-colors">
                Forgot password?
              </button>
            </div>
            <input type="password" className="input-base" placeholder="••••••••"
              value={loginForm.password}
              onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} required />
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setRememberMe(v => !v)}
              className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                rememberMe ? 'bg-accent border-accent' : 'border-white/20 bg-transparent'
              }`}
            >
              {rememberMe && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="text-xs text-white/40">Keep me signed in</span>
          </label>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2 justify-center">
            {loading ? <><Spinner /> Signing in…</> : 'Sign In'}
          </button>
        </form>
      )}

      {/* Register form */}
      {tab === 'register' && (
        <form onSubmit={handleRegister} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Full Name</label>
            <input className="input-base" placeholder="Jane Smith"
              value={regForm.fullName}
              onChange={e => setRegForm(f => ({ ...f, fullName: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Email</label>
            <input type="email" className="input-base" placeholder="you@example.com"
              value={regForm.email}
              onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Password</label>
            <input type="password" className="input-base" placeholder="Min. 8 characters"
              value={regForm.password}
              onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2 justify-center">
            {loading ? <><Spinner /> Creating account…</> : 'Create Account'}
          </button>
        </form>
      )}
    </div>
  );
}

// ─── OTP verification ────────────────────────────────────────────────────────
function OtpView({ userId, email, rememberMe, onBack }) {
  const { verifyOtp } = useAuth();
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(userId, code, rememberMe);
      // authStore sets user/account — App router will redirect to dashboard
    } catch (err) {
      const msg = err.response?.data?.message || 'Incorrect code. Please try again.';
      setError(msg);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const maskedEmail = email.replace(/(.{2}).+(@.+)/, '$1•••$2');

  return (
    <div className="glass-bright rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-6 border-b border-white/[0.06]">
        <button onClick={onBack} className="text-white/30 hover:text-white/70 transition-colors">
          <BackIcon />
        </button>
        <h2 className="text-white font-semibold">Verify It's You</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <p className="text-white/40 text-sm leading-relaxed">
          We sent a 6-digit code to <span className="text-white/60">{maskedEmail}</span>. Enter it below to sign in.
        </p>
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Verification Code</label>
          <input
            className="input-base text-center text-2xl tracking-[0.35em] font-mono"
            placeholder="000000"
            value={code}
            onChange={e => { setError(''); setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); }}
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            required
          />
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <><Spinner /> Verifying…</> : 'Verify & Sign In'}
        </button>
        <p className="text-center text-xs text-white/20">
          Wrong account?{' '}
          <button type="button" onClick={onBack} className="text-accent/70 hover:text-accent transition-colors">
            Go back
          </button>
        </p>
      </form>
    </div>
  );
}

// ─── Forgot password ──────────────────────────────────────────────────────────
function ForgotView({ onBack, onSent }) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      toast.success('If that email exists, a reset link has been sent.');
      onSent();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-bright rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-6 border-b border-white/[0.06]">
        <button onClick={onBack} className="text-white/30 hover:text-white/70 transition-colors">
          <BackIcon />
        </button>
        <h2 className="text-white font-semibold">Reset Password</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <p className="text-white/40 text-sm">
          Enter your registered email address and we'll send you a reset link.
        </p>
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Email Address</label>
          <input type="email" className="input-base" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? <><Spinner /> Sending…</> : 'Send Reset Link'}
        </button>
        <p className="text-center text-xs text-white/20">
          Remember your password?{' '}
          <button type="button" onClick={onBack} className="text-accent/70 hover:text-accent transition-colors">
            Sign in
          </button>
        </p>
      </form>
    </div>
  );
}

// ─── Reset password ───────────────────────────────────────────────────────────
// initialToken is read from the URL ?token= parameter so users never need to paste it.
function ResetView({ initialToken, onDone }) {
  const [form,    setForm]    = useState({ token: initialToken, newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  // Keep token in sync if the URL param changes after mount
  useEffect(() => {
    if (initialToken) setForm(f => ({ ...f, token: initialToken }));
  }, [initialToken]);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return toast.error('Passwords do not match');
    if (form.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await authAPI.resetPassword({ token: form.token.trim(), newPassword: form.newPassword });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed — link may have expired');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="glass-bright rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="text-white font-bold text-lg mb-2">Password Reset</h2>
        <p className="text-white/40 text-sm mb-6">Your password has been updated. You can now sign in.</p>
        <button onClick={onDone} className="btn-primary w-full justify-center">Back to Sign In</button>
      </div>
    );
  }

  const tokenValid = form.token.trim().length === 64;
  const pwMatch    = form.confirm === '' || form.newPassword === form.confirm;
  const hasToken   = !!initialToken; // true when opened via email link

  return (
    <div className="glass-bright rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-6 border-b border-white/[0.06]">
        <h2 className="text-white font-semibold">Set New Password</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Only show token field if user arrived here manually (not via email link) */}
        {!hasToken && (
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Reset Token</label>
            <input
              className="input-base font-mono text-xs"
              placeholder="Paste the token from your reset link"
              value={form.token}
              onChange={e => setForm(f => ({ ...f, token: e.target.value.trim() }))}
              required
            />
            <p className="text-white/20 text-xs mt-1">Paste the 64-character token from the reset link</p>
          </div>
        )}
        {hasToken && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
            <p className="text-emerald-400 text-xs font-medium">✓ Reset link verified — choose your new password below</p>
          </div>
        )}
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">New Password</label>
          <input type="password" className="input-base" placeholder="Min. 8 characters"
            value={form.newPassword} onChange={update('newPassword')} required minLength={8} />
        </div>
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Confirm Password</label>
          <input type="password" className="input-base" placeholder="Repeat new password"
            value={form.confirm} onChange={update('confirm')} required />
          {!pwMatch && form.confirm !== '' && (
            <p className="text-red-400 text-xs mt-1.5">Passwords do not match</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !tokenValid || !pwMatch || !form.newPassword}
          className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <><Spinner /> Resetting…</> : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function BackIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
}
function Spinner() {
  return <svg className="animate-spin mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>;
}
