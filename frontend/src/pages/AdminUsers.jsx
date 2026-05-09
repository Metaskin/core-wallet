import { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import { formatCurrency, formatDate, getInitials } from '../utils/formatters';
import toast from 'react-hot-toast';

const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminUsers() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAction, setShowAction] = useState(null);  // { user, type: 'credit'|'debit' }
  const [submitting, setSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({
    email: '', password: '', fullName: '', avatarColor: '#6366f1', initialBalance: '0',
  });
  const [actionForm, setActionForm] = useState({ amount: '', description: '' });

  const load = async () => {
    try {
      const { data } = await adminAPI.getUsers();
      setUsers(data.data.users);
    } catch { toast.error('Failed to load users'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminAPI.createUser({ ...createForm, initialBalance: parseFloat(createForm.initialBalance) || 0 });
      toast.success('User created');
      setShowCreate(false);
      setCreateForm({ email: '', password: '', fullName: '', avatarColor: '#6366f1', initialBalance: '0' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally { setSubmitting(false); }
  };

  const handleAction = async (e) => {
    e.preventDefault();
    if (!showAction) return;
    setSubmitting(true);
    try {
      const fn = showAction.type === 'credit' ? adminAPI.credit : adminAPI.debit;
      await fn({ accountId: showAction.user.account.id, amount: parseFloat(actionForm.amount), description: actionForm.description });
      toast.success(`Account ${showAction.type}ed`);
      setShowAction(null);
      setActionForm({ amount: '', description: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${showAction.type}`);
    } finally { setSubmitting(false); }
  };

  const toggleStatus = async (accountId) => {
    try {
      const { data } = await adminAPI.toggleStatus(accountId);
      toast.success(`Account ${data.data.account.status}`);
      load();
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-8 flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-white font-bold text-2xl font-display">User Management</h1>
          <p className="text-white/40 text-sm mt-1">{users.length} enrolled users</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add User
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-48 rounded-2xl shimmer"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((user, i) => (
            <div key={user.id} className="glass rounded-2xl p-5 animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0"
                  style={{ backgroundColor: user.avatarColor }}>
                  {getInitials(user.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm truncate">{user.fullName}</span>
                    {user.account?.status === 'frozen' && (
                      <span className="badge bg-red-500/10 text-red-400 border border-red-500/20 text-[9px]">Frozen</span>
                    )}
                  </div>
                  <p className="text-white/30 text-xs truncate">{user.email}</p>
                  <p className="font-mono text-accent/40 text-[10px] mt-0.5">{user.account?.accountNumber}</p>
                </div>
                <div className="text-right">
                  <p className="amount-display text-white font-bold text-lg">
                    {user.account ? formatCurrency(user.account.balance) : '—'}
                  </p>
                  <p className="text-white/20 text-[10px]">Balance</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAction({ user, type: 'credit' }); setActionForm({ amount: '', description: '' }); }}
                  disabled={!user.account || user.account.status === 'frozen'}
                  className="flex-1 text-xs py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >↓ Credit</button>
                <button
                  onClick={() => { setShowAction({ user, type: 'debit' }); setActionForm({ amount: '', description: '' }); }}
                  disabled={!user.account || user.account.status === 'frozen'}
                  className="flex-1 text-xs py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >↑ Debit</button>
                <button
                  onClick={() => toggleStatus(user.account?.id)}
                  disabled={!user.account}
                  className={`text-xs px-3 py-2 rounded-lg border transition-all disabled:opacity-30 ${
                    user.account?.status === 'frozen'
                      ? 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20'
                      : 'bg-white/5 text-white/30 border-white/10 hover:text-white/60'
                  }`}
                >{user.account?.status === 'frozen' ? '▶ Unfreeze' : '⏸ Freeze'}</button>
              </div>

              <p className="text-white/15 text-[10px] mt-3">
                Joined {formatDate(user.createdAt)}
                {user.lastLoginAt && ` · Last seen ${formatDate(user.lastLoginAt)}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Create user modal */}
      {showCreate && (
        <Modal title="Create User" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Full Name">
              <input className="input-base" placeholder="Jane Smith" value={createForm.fullName}
                onChange={e => setCreateForm(f => ({ ...f, fullName: e.target.value }))} required />
            </Field>
            <Field label="Email">
              <input type="email" className="input-base" placeholder="jane@example.com" value={createForm.email}
                onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} required />
            </Field>
            <Field label="Password">
              <input type="password" className="input-base" placeholder="Min. 8 characters" value={createForm.password}
                onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
            </Field>
            <Field label="Opening Balance (USD)">
              <input type="number" min="0" step="0.01" className="input-base amount-display" placeholder="0.00"
                value={createForm.initialBalance}
                onChange={e => setCreateForm(f => ({ ...f, initialBalance: e.target.value }))} />
            </Field>
            <Field label="Avatar Color">
              <div className="flex gap-2">
                {AVATAR_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setCreateForm(f => ({ ...f, avatarColor: c }))}
                    className={`w-7 h-7 rounded-full transition-all ${createForm.avatarColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-2 scale-110' : 'opacity-50 hover:opacity-100'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </Field>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1 border border-white/10">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Credit / Debit modal */}
      {showAction && (
        <Modal title={`${showAction.type === 'credit' ? 'Credit' : 'Debit'} Account`} onClose={() => setShowAction(null)}>
          <p className="text-white/40 text-sm -mt-2 mb-4">{showAction.user.fullName}</p>
          <div className="flex justify-between bg-white/[0.04] rounded-xl px-4 py-3 mb-4">
            <span className="text-white/40 text-xs">Current Balance</span>
            <span className="amount-display text-white font-semibold text-sm">{formatCurrency(showAction.user.account.balance)}</span>
          </div>
          <form onSubmit={handleAction} className="space-y-4">
            <Field label="Amount (USD)">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-mono text-sm">$</span>
                <input type="number" min="0.01" step="0.01" className="input-base pl-7 amount-display"
                  placeholder="0.00" value={actionForm.amount}
                  onChange={e => setActionForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              {showAction.type === 'debit' && parseFloat(actionForm.amount) > showAction.user.account.balance && (
                <p className="text-red-400 text-xs mt-1">Exceeds account balance</p>
              )}
            </Field>
            <Field label="Reason">
              <input className="input-base" placeholder="Reason for this adjustment" value={actionForm.description}
                onChange={e => setActionForm(f => ({ ...f, description: e.target.value }))} />
            </Field>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowAction(null)} className="btn-ghost flex-1 border border-white/10">Cancel</button>
              <button type="submit" disabled={submitting || (showAction.type === 'debit' && parseFloat(actionForm.amount) > showAction.user.account.balance)}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm border transition-all disabled:opacity-50 ${
                  showAction.type === 'credit'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25'
                    : 'bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/25'
                }`}>
                {submitting ? 'Processing...' : showAction.type === 'credit' ? '↓ Credit' : '↑ Debit'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-bright rounded-2xl p-6 w-full max-w-md animate-fade-up">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-white font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="text-white/20 hover:text-white/60 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        {children}
      </div>
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
