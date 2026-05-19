import { useState, useEffect, useRef } from 'react';
import { autopayAPI, accountAPI } from '../api';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const CATEGORIES = ['Utilities', 'Insurance', 'Subscription', 'Rent', 'Phone', 'Internet', 'Gym', 'Other'];
const FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'quarterly', 'annually', 'custom'];
const CATEGORY_COLORS = {
  Utilities:    'bg-blue-100 text-blue-700',
  Insurance:    'bg-purple-100 text-purple-700',
  Subscription: 'bg-pink-100 text-pink-700',
  Rent:         'bg-amber-100 text-amber-700',
  Phone:        'bg-green-100 text-green-700',
  Internet:     'bg-cyan-100 text-cyan-700',
  Gym:          'bg-orange-100 text-orange-700',
  Other:        'bg-gray-100 text-gray-600',
};

function statusBadge(status) {
  if (status === 'active')    return 'bg-emerald-100 text-emerald-700';
  if (status === 'paused')    return 'bg-amber-100 text-amber-700';
  if (status === 'cancelled') return 'bg-gray-100 text-gray-500';
  return 'bg-gray-100 text-gray-500';
}

export default function Autopay() {
  const [autopays,   setAutopays]   = useState([]);
  const [accounts,   setAccounts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [apRes, accRes] = await Promise.all([
        autopayAPI.getAll(),
        accountAPI.getAll(),
      ]);
      setAutopays(apRes.data.data?.autopays || apRes.data.data || []);
      const accs = accRes.data.data?.accounts || accRes.data.data || [];
      setAccounts(Array.isArray(accs) ? accs : [accs]);
    } catch {
      toast.error('Failed to load autopay data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const active   = autopays.filter(a => a.status === 'active');
  const monthly  = active.reduce((s, a) => {
    const amt = parseFloat(a.amount) || 0;
    if (a.frequency === 'weekly')    return s + amt * 4.33;
    if (a.frequency === 'biweekly')  return s + amt * 2.17;
    if (a.frequency === 'quarterly') return s + amt / 3;
    if (a.frequency === 'annually')  return s + amt / 12;
    return s + amt;
  }, 0);

  const nextDue = autopays
    .filter(a => a.status === 'active' && a.nextDueDate)
    .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))[0];

  const handleDelete = async (id) => {
    try {
      await autopayAPI.delete(id);
      setAutopays(prev => prev.filter(a => a.id !== id));
      toast.success('Autopay removed');
    } catch {
      toast.error('Failed to remove autopay');
    } finally {
      setConfirmDel(null);
    }
  };

  const handleTogglePause = async (item) => {
    const newStatus = item.status === 'active' ? 'paused' : 'active';
    try {
      const { data } = await autopayAPI.update(item.id, { status: newStatus });
      setAutopays(prev => prev.map(a => a.id === item.id ? (data.data?.autopay || { ...a, status: newStatus }) : a));
      toast.success(newStatus === 'active' ? 'Autopay resumed' : 'Autopay paused');
    } catch {
      toast.error('Failed to update autopay');
    }
  };

  const openEdit = (item) => { setEditItem(item); setShowForm(true); };

  const onFormDone = (saved) => {
    if (editItem) {
      setAutopays(prev => prev.map(a => a.id === saved.id ? saved : a));
    } else {
      setAutopays(prev => [saved, ...prev]);
    }
    setShowForm(false);
    setEditItem(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="text-gray-900 font-bold text-2xl">Autopay &amp; Recurring</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your scheduled payments</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="btn-primary text-sm"
        >
          <PlusIcon /> Set Up Autopay
        </button>
      </div>

      {/* Summary row */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[0,1,2].map(i => <div key={i} className="h-20 rounded-xl shimmer" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <SummaryCard label="Monthly Total" value={formatCurrency(monthly)} />
          <SummaryCard label="Active" value={active.length.toString()} />
          <SummaryCard
            label="Next Due"
            value={nextDue ? new Date(nextDue.nextDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => <div key={i} className="h-24 rounded-xl shimmer" />)}
        </div>
      ) : autopays.length === 0 ? (
        <div className="bank-card flex flex-col items-center justify-center py-16 text-center animate-fade-up">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <CalendarIcon size={20} className="text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold text-sm">No autopays set up</p>
          <p className="text-gray-400 text-xs mt-1 max-w-xs">Add recurring payments to automate your bills</p>
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="mt-4 btn-primary text-xs">
            Set Up Autopay
          </button>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {autopays.map(item => (
            <AutopayCard
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onToggle={() => handleTogglePause(item)}
              onDelete={() => setConfirmDel(item.id)}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <AutopayFormModal
          item={editItem}
          accounts={accounts}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSaved={onFormDone}
        />
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <ConfirmModal
          message="Remove this autopay? This action cannot be undone."
          onConfirm={() => handleDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bank-card p-4">
      <p className="section-label mb-1">{label}</p>
      <p className="text-gray-900 font-bold text-lg amount-display">{value}</p>
    </div>
  );
}

function AutopayCard({ item, onEdit, onToggle, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="bank-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-900 font-semibold text-sm truncate">{item.billerName || item.name}</span>
            <span className={`badge ${CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-600'}`}>
              {item.category}
            </span>
            <span className={`badge ${statusBadge(item.status)}`}>{item.status}</span>
          </div>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-gray-900 font-bold amount-display">{formatCurrency(item.amount)}</span>
            <span className="text-gray-400 text-xs capitalize">{item.frequency}</span>
            {item.nextDueDate && (
              <span className="flex items-center gap-1 text-gray-500 text-xs">
                <CalendarIcon size={12} className="text-gray-400" />
                Due {new Date(item.nextDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {/* Three-dot menu */}
        <div className="relative shrink-0" ref={ref}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <DotsIcon />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); onEdit(); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <EditIcon /> Edit
              </button>
              <button
                onClick={() => { setMenuOpen(false); onToggle(); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {item.status === 'active' ? <><PauseIcon /> Pause</> : <><PlayIcon /> Resume</>}
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete(); }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <TrashIcon /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AutopayFormModal({ item, accounts, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:         item?.name         || item?.billerName || '',
    billerName:   item?.billerName   || item?.name       || '',
    amount:       item?.amount       || '',
    category:     item?.category     || CATEGORIES[0],
    frequency:    item?.frequency    || 'monthly',
    nextDueDate:  item?.nextDueDate  ? item.nextDueDate.split('T')[0] : '',
    dayOfMonth:   item?.dayOfMonth   || '1',
    accountId:    item?.accountId    || accounts[0]?.id || '',
  });
  const [saving, setSaving] = useState(false);

  const update = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())      return toast.error('Enter a name');
    if (!form.billerName.trim()) return toast.error('Enter biller name');
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0)       return toast.error('Enter a valid amount');
    if (!form.nextDueDate)      return toast.error('Select next due date');
    if (!form.accountId)        return toast.error('Select an account');

    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        billerName:  form.billerName.trim(),
        amount:      amt,
        category:    form.category,
        frequency:   form.frequency,
        nextDueDate: form.nextDueDate,
        accountId:   form.accountId,
        ...(form.frequency === 'custom' ? { dayOfMonth: parseInt(form.dayOfMonth) } : {}),
      };
      let saved;
      if (item) {
        const { data } = await autopayAPI.update(item.id, payload);
        saved = data.data?.autopay || { ...item, ...payload };
      } else {
        const { data } = await autopayAPI.create(payload);
        saved = data.data?.autopay || { id: Date.now(), ...payload, status: 'active' };
      }
      toast.success(item ? 'Autopay updated' : 'Autopay created');
      onSaved(saved);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save autopay');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-gray-900 font-bold text-lg">{item ? 'Edit Autopay' : 'Set Up Autopay'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Name</label>
              <input className="input-base" value={form.name} onChange={update('name')} placeholder="Netflix" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Biller</label>
              <input className="input-base" value={form.billerName} onChange={update('billerName')} placeholder="Netflix Inc." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" min="0.01" step="0.01" className="input-base pl-7" value={form.amount} onChange={update('amount')} placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Category</label>
              <select className="input-base" value={form.category} onChange={update('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Frequency</label>
              <select className="input-base" value={form.frequency} onChange={update('frequency')}>
                {FREQUENCIES.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
              </select>
            </div>
            {form.frequency === 'custom' && (
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1.5">Day of Month</label>
                <input type="number" min="1" max="31" className="input-base" value={form.dayOfMonth} onChange={update('dayOfMonth')} />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Next Due Date</label>
              <input type="date" className="input-base" value={form.nextDueDate} onChange={update('nextDueDate')} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Account</label>
            <select className="input-base" value={form.accountId} onChange={update('accountId')}>
              <option value="">Select account</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.accountType ? `${a.accountType.charAt(0).toUpperCase() + a.accountType.slice(1)}` : 'Account'} •••• {(a.accountNumber || '').slice(-4)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner /> : (item ? 'Save Changes' : 'Create Autopay')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl animate-fade-up p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <TrashIcon className="text-red-500" />
        </div>
        <p className="text-gray-800 font-semibold text-sm mb-1">Are you sure?</p>
        <p className="text-gray-500 text-xs mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
          <button onClick={onConfirm} className="flex-1 btn-danger border-red-200 bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>;
}
function XIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function PlusIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function CalendarIcon({ size = 16, className = '' }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function DotsIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>; }
function EditIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function TrashIcon({ className = '' }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>; }
function PauseIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>; }
function PlayIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>; }
