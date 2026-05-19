import { useState, useEffect } from 'react';
import { billPayAPI, accountAPI } from '../api';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const CATEGORIES = ['Utilities','Rent','Phone','Internet','Insurance','Streaming','Credit Card','Other'];
const CATEGORY_ICONS = {
  Utilities:    '💡',
  Rent:         '🏠',
  Phone:        '📱',
  Internet:     '🌐',
  Insurance:    '🛡️',
  Streaming:    '🎬',
  'Credit Card':'💳',
  Other:        '📄',
};
const FREQUENCIES = ['weekly','biweekly','monthly'];
const PMT_STATUS = {
  scheduled:  'bg-blue-100 text-blue-700',
  processing: 'bg-amber-100 text-amber-700',
  completed:  'bg-emerald-100 text-emerald-700',
  failed:     'bg-red-100 text-red-600',
  cancelled:  'bg-gray-100 text-gray-500',
};

export default function BillPay() {
  const [tab,      setTab]      = useState('pay');
  const [billers,  setBillers]  = useState([]);
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [showPayModal,    setShowPayModal]    = useState(false);
  const [showBillerModal, setShowBillerModal] = useState(false);
  const [confirmRemove,   setConfirmRemove]   = useState(null);
  const [cancelPayId,     setCancelPayId]     = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [bRes, pRes, aRes] = await Promise.all([
        billPayAPI.getBillers(),
        billPayAPI.getPayments(),
        accountAPI.getAll(),
      ]);
      setBillers(bRes.data.data?.billers   || bRes.data.data || []);
      setPayments(pRes.data.data?.payments || pRes.data.data || []);
      const accs = aRes.data.data?.accounts || aRes.data.data || [];
      setAccounts(Array.isArray(accs) ? accs : [accs]);
    } catch {
      toast.error('Failed to load bill pay data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRemoveBiller = async (id) => {
    try {
      await billPayAPI.removeBiller(id);
      setBillers(prev => prev.filter(b => b.id !== id));
      toast.success('Biller removed');
    } catch {
      toast.error('Failed to remove biller');
    } finally {
      setConfirmRemove(null);
    }
  };

  const handleCancelPayment = async (id) => {
    try {
      await billPayAPI.cancelPayment(id);
      setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'cancelled' } : p));
      toast.success('Payment cancelled');
    } catch {
      toast.error('Failed to cancel payment');
    } finally {
      setCancelPayId(null);
    }
  };

  const scheduled = payments.filter(p => p.status === 'scheduled');
  const history   = payments.filter(p => p.status !== 'scheduled');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full">
      <div className="mb-6 animate-fade-up">
        <h1 className="text-gray-900 font-bold text-2xl">Bill Pay</h1>
        <p className="text-gray-500 text-sm mt-1">Pay and schedule your bills</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 animate-fade-up" style={{ animationDelay: '0.03s' }}>
        {[['pay','Pay Bills'],['billers','Saved Billers']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-3 pt-1 px-1 mr-6 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? 'border-navy text-navy' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => <div key={i} className="h-20 rounded-xl shimmer" />)}
        </div>
      ) : (
        <>
          {/* TAB: Pay Bills */}
          {tab === 'pay' && (
            <div className="animate-fade-up space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-800 font-semibold text-sm">Upcoming Payments ({scheduled.length})</p>
                <button onClick={() => setShowPayModal(true)} className="btn-primary text-xs">
                  <PlusIcon /> Pay a Bill
                </button>
              </div>

              {scheduled.length === 0 ? (
                <div className="bank-card flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-gray-500 text-sm">No scheduled payments</p>
                  <button onClick={() => setShowPayModal(true)} className="mt-3 btn-primary text-xs">Pay a Bill</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {scheduled.map(p => (
                    <div key={p.id} className="bank-card p-4 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-semibold text-sm">{p.billerName}</p>
                        <p className="text-gray-400 text-xs">
                          Due {new Date(p.scheduledDate || p.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {p.recurring && <span className="ml-2 badge bg-blue-50 text-blue-600 text-[10px]">Recurring</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-gray-900 font-bold amount-display">{formatCurrency(p.amount)}</span>
                        <button
                          onClick={() => setCancelPayId(p.id)}
                          className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Payment history */}
              {history.length > 0 && (
                <>
                  <p className="text-gray-800 font-semibold text-sm">Payment History</p>
                  <div className="space-y-2">
                    {history.map(p => (
                      <div key={p.id} className="bank-card p-4 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-semibold text-sm">{p.billerName}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(p.scheduledDate || p.paidAt || p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`badge ${PMT_STATUS[p.status] || 'bg-gray-100 text-gray-500'} capitalize text-xs`}>{p.status}</span>
                          <span className="text-gray-900 font-bold amount-display text-sm">{formatCurrency(p.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB: Saved Billers */}
          {tab === 'billers' && (
            <div className="animate-fade-up space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-800 font-semibold text-sm">Your Billers ({billers.length})</p>
                <button onClick={() => setShowBillerModal(true)} className="btn-primary text-xs">
                  <PlusIcon /> Add Biller
                </button>
              </div>

              {billers.length === 0 ? (
                <div className="bank-card flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-gray-500 text-sm">No saved billers</p>
                  <button onClick={() => setShowBillerModal(true)} className="mt-3 btn-primary text-xs">Add Biller</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {billers.map(b => (
                    <div key={b.id} className="bank-card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">
                            {CATEGORY_ICONS[b.category] || '📄'}
                          </div>
                          <div>
                            <p className="text-gray-900 font-semibold text-sm">{b.name}</p>
                            {b.accountNumber && (
                              <p className="text-gray-400 font-mono text-xs">•••• {b.accountNumber.slice(-4)}</p>
                            )}
                            <p className="text-gray-400 text-xs capitalize">{b.category}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setConfirmRemove(b.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showPayModal && (
        <PayBillModal
          billers={billers}
          accounts={accounts}
          onClose={() => setShowPayModal(false)}
          onScheduled={(p) => { setPayments(prev => [p, ...prev]); setShowPayModal(false); }}
        />
      )}

      {showBillerModal && (
        <AddBillerModal
          onClose={() => setShowBillerModal(false)}
          onAdded={(b) => { setBillers(prev => [...prev, b]); setShowBillerModal(false); }}
        />
      )}

      {confirmRemove && (
        <SimpleConfirm
          message="Remove this biller?"
          confirmLabel="Remove"
          onConfirm={() => handleRemoveBiller(confirmRemove)}
          onCancel={() => setConfirmRemove(null)}
        />
      )}

      {cancelPayId && (
        <SimpleConfirm
          message="Cancel this scheduled payment?"
          confirmLabel="Cancel Payment"
          onConfirm={() => handleCancelPayment(cancelPayId)}
          onCancel={() => setCancelPayId(null)}
        />
      )}
    </div>
  );
}

function PayBillModal({ billers, accounts, onClose, onScheduled }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    billerId:      billers[0]?.id || '',
    billerName:    '',
    accountId:     accounts[0]?.id || '',
    amount:        '',
    scheduledDate: today,
    dueDate:       '',
    memo:          '',
    recurring:     false,
    frequency:     'monthly',
  });
  const [saving, setSaving] = useState(false);
  const update = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const selectedBiller = billers.find(b => b.id === form.billerId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.accountId) return toast.error('Select an account');
    if (!form.billerId && !form.billerName.trim()) return toast.error('Select or enter a biller');
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    if (!form.scheduledDate) return toast.error('Select a scheduled date');

    setSaving(true);
    try {
      const payload = {
        accountId:     form.accountId,
        billerId:      form.billerId || undefined,
        billerName:    selectedBiller?.name || form.billerName.trim(),
        amount:        amt,
        scheduledDate: form.scheduledDate,
        dueDate:       form.dueDate || undefined,
        memo:          form.memo.trim() || undefined,
        recurring:     form.recurring,
        frequency:     form.recurring ? form.frequency : undefined,
      };
      const { data } = await billPayAPI.schedulePayment(payload);
      toast.success('Payment scheduled');
      const pmt = data.data?.payment || { id: Date.now(), ...payload, status: 'scheduled', createdAt: new Date().toISOString() };
      onScheduled(pmt);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-gray-900 font-bold text-lg">Pay a Bill</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Biller</label>
            {billers.length > 0 ? (
              <select className="input-base" value={form.billerId} onChange={e => setForm(p => ({ ...p, billerId: e.target.value, billerName: '' }))}>
                <option value="">Enter biller name below</option>
                {billers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            ) : null}
            {!form.billerId && (
              <input className="input-base mt-2" value={form.billerName} onChange={update('billerName')} placeholder="Biller name" />
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">From Account</label>
            <select className="input-base" value={form.accountId} onChange={update('accountId')}>
              <option value="">Select account</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {(a.accountType || 'Account').charAt(0).toUpperCase() + (a.accountType || '').slice(1)} •••• {(a.accountNumber || '').slice(-4)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input type="number" min="0.01" step="0.01" className="input-base pl-7 amount-display" value={form.amount} onChange={update('amount')} placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Payment Date</label>
              <input type="date" className="input-base" value={form.scheduledDate} onChange={update('scheduledDate')} min={today} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Due Date (optional)</label>
              <input type="date" className="input-base" value={form.dueDate} onChange={update('dueDate')} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Memo (optional)</label>
              <input className="input-base" value={form.memo} onChange={update('memo')} placeholder="Reference" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(p => ({ ...p, recurring: !p.recurring }))}
              className={`w-10 h-6 rounded-full transition-colors ${form.recurring ? 'bg-navy' : 'bg-gray-200'} relative shrink-0`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.recurring ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-gray-700">Recurring payment</span>
          </label>
          {form.recurring && (
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Frequency</label>
              <select className="input-base" value={form.frequency} onChange={update('frequency')}>
                {FREQUENCIES.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner /> : 'Schedule Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddBillerModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', accountNumber: '', category: CATEGORIES[0] });
  const [saving, setSaving] = useState(false);
  const update = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Enter biller name');
    setSaving(true);
    try {
      const { data } = await billPayAPI.addBiller({
        name:          form.name.trim(),
        accountNumber: form.accountNumber.trim() || undefined,
        category:      form.category,
      });
      toast.success('Biller added');
      const biller = data.data?.biller || { id: Date.now(), ...form };
      onAdded(biller);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add biller');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-gray-900 font-bold text-lg">Add Biller</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Biller Name</label>
            <input className="input-base" value={form.name} onChange={update('name')} placeholder="Electric Company" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Account Number (optional)</label>
            <input className="input-base font-mono" value={form.accountNumber} onChange={update('accountNumber')} placeholder="Your account with this biller" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Category</label>
            <select className="input-base" value={form.category} onChange={update('category')}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner /> : 'Add Biller'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SimpleConfirm({ message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl animate-fade-up p-6 text-center">
        <p className="text-gray-800 font-semibold text-sm mb-4">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Keep</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 px-5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-medium text-sm transition-all">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Spinner() { return <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>; }
function XIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function PlusIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function TrashIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>; }
