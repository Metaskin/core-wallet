import { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore';
import { securityAPI } from '../api';
import SetPinModal from '../components/modals/SetPinModal';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, changePassword, changeEmail } = useAuth();

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8 animate-fade-up">
        <h1 className="text-white font-bold text-2xl font-display">Settings</h1>
        <p className="text-white/40 text-sm mt-1">Manage your account security and preferences</p>
      </div>

      <div className="space-y-5">
        <ChangePasswordSection changePassword={changePassword} />
        <ChangeEmailSection user={user} changeEmail={changeEmail} />
        <TransactionPinSection />
      </div>
    </div>
  );
}

// ─── Transaction PIN ──────────────────────────────────────────────────────────

function TransactionPinSection() {
  const [hasPin,       setHasPin]       = useState(null); // null = loading
  const [showSetModal, setShowSetModal] = useState(false);

  const load = async () => {
    try {
      const { data } = await securityAPI.hasPin();
      setHasPin(data.data.hasPin);
    } catch {
      setHasPin(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <Section
        title="Transaction PIN"
        description="Required when viewing full card details"
        icon={<ShieldIcon />}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {hasPin === null ? (
              <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" />
            ) : hasPin ? (
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            )}
            <span className="text-white/60 text-sm">
              {hasPin === null ? 'Checking…' : hasPin ? 'PIN is active' : 'No PIN set'}
            </span>
          </div>
          <button
            onClick={() => setShowSetModal(true)}
            className="btn-primary text-sm py-2 px-4"
          >
            {hasPin ? 'Change PIN' : 'Set PIN'}
          </button>
        </div>

        {!hasPin && hasPin !== null && (
          <p className="text-yellow-400/70 text-xs mt-3">
            Set a PIN to securely view your full card numbers and CVVs.
          </p>
        )}
      </Section>

      {showSetModal && (
        <SetPinModal
          isChanging={!!hasPin}
          onClose={() => setShowSetModal(false)}
          onSaved={() => { setHasPin(true); setShowSetModal(false); }}
        />
      )}
    </>
  );
}

// ─── Change Password ──────────────────────────────────────────────────────────

function ChangePasswordSection({ changePassword }) {
  const [form, setForm]       = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters');
    }
    if (form.newPassword !== form.confirm) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section
      title="Change Password"
      description="Use a strong password you don't use anywhere else"
      icon={<LockIcon />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Current Password">
          <input
            type="password"
            className="input-base"
            placeholder="••••••••"
            value={form.currentPassword}
            onChange={update('currentPassword')}
            autoComplete="current-password"
            required
          />
        </Field>

        <Field label="New Password">
          <input
            type="password"
            className="input-base"
            placeholder="Min. 8 characters"
            value={form.newPassword}
            onChange={update('newPassword')}
            autoComplete="new-password"
            required
            minLength={8}
          />
          <PasswordStrength password={form.newPassword} />
        </Field>

        <Field label="Confirm New Password">
          <input
            type="password"
            className="input-base"
            placeholder="Repeat new password"
            value={form.confirm}
            onChange={update('confirm')}
            autoComplete="new-password"
            required
          />
          {form.confirm && form.newPassword !== form.confirm && (
            <p className="text-red-400 text-xs mt-1.5">Passwords do not match</p>
          )}
        </Field>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading || (form.confirm && form.newPassword !== form.confirm)}
            className="btn-primary"
          >
            {loading ? <Spinner /> : null}
            {loading ? 'Updating…' : 'Update Password'}
          </button>
          {success && (
            <span className="text-emerald-400 text-sm flex items-center gap-1.5 animate-fade-in">
              <CheckIcon /> Saved
            </span>
          )}
        </div>
      </form>
    </Section>
  );
}

// ─── Change Email ─────────────────────────────────────────────────────────────

function ChangeEmailSection({ user, changeEmail }) {
  const [newEmail, setNewEmail] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newEmail.toLowerCase() === user?.email?.toLowerCase()) {
      return toast.error('That is already your current email');
    }
    setLoading(true);
    try {
      await changeEmail(newEmail);
      setSuccess(true);
      setNewEmail('');
      toast.success('Email updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section
      title="Change Email"
      description="Your current email is used to sign in"
      icon={<MailIcon />}
    >
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-white/40">Current:</span>
        <span className="text-white font-medium">{user?.email}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="New Email Address">
          <input
            type="email"
            className="input-base"
            placeholder="new@example.com"
            value={newEmail}
            onChange={e => { setNewEmail(e.target.value); setSuccess(false); }}
            required
          />
        </Field>

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Spinner /> : null}
            {loading ? 'Updating…' : 'Update Email'}
          </button>
          {success && (
            <span className="text-emerald-400 text-sm flex items-center gap-1.5 animate-fade-in">
              <CheckIcon /> Saved
            </span>
          )}
        </div>
      </form>
    </Section>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Section({ title, description, icon, children }) {
  return (
    <div className="glass rounded-2xl p-6 animate-fade-up">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
          {icon}
        </div>
        <div>
          <h2 className="text-white font-semibold">{title}</h2>
          <p className="text-white/40 text-xs mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;

  const score = [
    password.length >= 8,
    password.length >= 12,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const levels = [
    { label: 'Weak',   color: 'bg-red-500',    text: 'text-red-400'    },
    { label: 'Weak',   color: 'bg-red-500',    text: 'text-red-400'    },
    { label: 'Fair',   color: 'bg-yellow-500', text: 'text-yellow-400' },
    { label: 'Good',   color: 'bg-accent',     text: 'text-accent'     },
    { label: 'Strong', color: 'bg-emerald-500',text: 'text-emerald-400'},
    { label: 'Strong', color: 'bg-emerald-500',text: 'text-emerald-400'},
  ];
  const lvl = levels[score] || levels[0];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? lvl.color : 'bg-white/10'}`} />
        ))}
      </div>
      <p className={`text-[10px] ${lvl.text}`}>{lvl.label}</p>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin mr-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/>
      <path d="M21 12a9 9 0 00-9-9"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
