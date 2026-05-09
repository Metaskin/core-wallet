'use client';

import { useEffect, useState } from 'react';
import AppLayout from '../../../components/layout/AppLayout';
import { useAuthStore } from '../../../lib/store';
import { formatCurrency, formatDate, getInitials, maskAccountNumber } from '../../../lib/utils';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAction, setShowAction] = useState<{ user: any; type: 'credit' | 'debit' } | null>(null);
  const [createForm, setCreateForm] = useState({
    email: '', password: '', fullName: '',
    avatarColor: '#6366f1', initialBalance: '0',
  });
  const [actionForm, setActionForm] = useState({ amount: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/admin/users', {
        ...createForm,
        initialBalance: parseFloat(createForm.initialBalance) || 0,
      });
      toast.success('User created successfully');
      setShowCreate(false);
      setCreateForm({ email: '', password: '', fullName: '', avatarColor: '#6366f1', initialBalance: '0' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccountAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAction) return;
    setSubmitting(true);
    try {
      const endpoint = showAction.type === 'credit' ? '/api/admin/credit' : '/api/admin/debit';
      await api.post(endpoint, {
        accountId: showAction.user.account.id,
        amount: parseFloat(actionForm.amount),
        description: actionForm.description,
      });
      toast.success(`Account ${showAction.type}ed successfully`);
      setShowAction(null);
      setActionForm({ amount: '', description: '' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to ${showAction.type} account`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: string, userName: string) => {
    try {
      const res = await api.patch(`/api/admin/users/${userId}/toggle-status`);
      toast.success(`Account ${res.data.account.status}`);
      fetchUsers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl">
        <div className="mb-8 flex items-center justify-between animate-fade-up">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">User Management</h1>
            <p className="text-white/40 text-sm mt-1">{users.length} / 6 users enrolled</p>
          </div>
          {users.length < 6 && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add User
            </button>
          )}
        </div>

        {/* Users grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => <div key={i} className="h-48 rounded-2xl shimmer" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {users.map((user, i) => (
              <div
                key={user.id}
                className="glass rounded-2xl p-6 animate-fade-up"
                style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg text-surface flex-shrink-0"
                    style={{ backgroundColor: user.avatarColor }}
                  >
                    {getInitials(user.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold truncate">{user.fullName}</span>
                      {user.account?.status === 'frozen' && (
                        <span className="badge bg-red-500/20 text-red-400 border border-red-500/20 text-[10px]">Frozen</span>
                      )}
                    </div>
                    <div className="text-xs text-white/40 truncate">{user.email}</div>
                    <div className="font-mono text-xs text-accent/40 mt-1">{user.account?.accountNumber || '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="amount-display text-xl font-bold text-white">
                      {user.account ? formatCurrency(user.account.balance) : '—'}
                    </div>
                    <div className="text-xs text-white/30">Balance</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowAction({ user, type: 'credit' }); setActionForm({ amount: '', description: '' }); }}
                    disabled={!user.account || user.account.status === 'frozen'}
                    className="flex-1 text-xs py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↓ Credit
                  </button>
                  <button
                    onClick={() => { setShowAction({ user, type: 'debit' }); setActionForm({ amount: '', description: '' }); }}
                    disabled={!user.account || user.account.status === 'frozen'}
                    className="flex-1 text-xs py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ↑ Debit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(user.id, user.fullName)}
                    className={clsx(
                      'text-xs px-3 py-2 rounded-lg border transition-all',
                      user.account?.status === 'frozen'
                        ? 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20'
                        : 'bg-white/5 text-white/40 border-white/10 hover:text-white/70'
                    )}
                  >
                    {user.account?.status === 'frozen' ? '▶ Unfreeze' : '⏸ Freeze'}
                  </button>
                </div>

                <div className="text-xs text-white/20 mt-3">
                  Joined {formatDate(user.createdAt)}
                  {user.lastLoginAt && ` · Last login ${formatDate(user.lastLoginAt)}`}
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {[...Array(Math.max(0, 6 - users.length))].map((_, i) => (
              <div
                key={`empty-${i}`}
                className="rounded-2xl p-6 border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-white/20"
              >
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-2xl">+</div>
                <span className="text-xs">Available slot</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-bright rounded-2xl p-8 w-full max-w-md animate-fade-up">
            <h2 className="font-display text-lg font-bold text-white mb-6">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Full Name</label>
                <input className="input-base" placeholder="Jane Smith" value={createForm.fullName}
                  onChange={e => setCreateForm(f => ({ ...f, fullName: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Email</label>
                <input type="email" className="input-base" placeholder="jane@example.com" value={createForm.email}
                  onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Password</label>
                <input type="password" className="input-base" placeholder="Min. 8 characters" value={createForm.password}
                  onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Opening Balance (USD)</label>
                <input type="number" min="0" step="0.01" className="input-base amount-display" placeholder="0.00" value={createForm.initialBalance}
                  onChange={e => setCreateForm(f => ({ ...f, initialBalance: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Avatar Color</label>
                <div className="flex gap-2">
                  {AVATAR_COLORS.map(color => (
                    <button
                      key={color} type="button"
                      onClick={() => setCreateForm(f => ({ ...f, avatarColor: color }))}
                      className={clsx(
                        'w-8 h-8 rounded-full transition-all',
                        createForm.avatarColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-2 scale-110' : 'opacity-60 hover:opacity-100'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1 border border-white/10">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit/Debit Modal */}
      {showAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-bright rounded-2xl p-8 w-full max-w-sm animate-fade-up">
            <h2 className="font-display text-lg font-bold text-white mb-1 capitalize">
              {showAction.type} Account
            </h2>
            <p className="text-white/40 text-sm mb-6">{showAction.user.fullName}</p>

            <div className="bg-surface-2 rounded-lg p-3 mb-5 flex justify-between items-center">
              <span className="text-xs text-white/40">Current Balance</span>
              <span className="amount-display text-white font-semibold">{formatCurrency(showAction.user.account.balance)}</span>
            </div>

            <form onSubmit={handleAccountAction} className="space-y-4">
              <div>
                <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-mono">$</span>
                  <input type="number" min="0.01" step="0.01" className="input-base pl-8 amount-display"
                    placeholder="0.00" value={actionForm.amount}
                    onChange={e => setActionForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                {showAction.type === 'debit' && parseFloat(actionForm.amount) > showAction.user.account.balance && (
                  <p className="text-red-400 text-xs mt-1">Exceeds account balance</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Reason</label>
                <input className="input-base" placeholder="Reason for this adjustment"
                  value={actionForm.description}
                  onChange={e => setActionForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAction(null)} className="btn-ghost flex-1 border border-white/10">Cancel</button>
                <button
                  type="submit"
                  disabled={submitting || (showAction.type === 'debit' && parseFloat(actionForm.amount) > showAction.user.account.balance)}
                  className={clsx(
                    'flex-1 py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50',
                    showAction.type === 'credit'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  )}
                >
                  {submitting ? 'Processing...' : `${showAction.type === 'credit' ? '↓' : '↑'} ${showAction.type.charAt(0).toUpperCase() + showAction.type.slice(1)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
