import { useState, useEffect } from 'react';
import { wireTransferAPI, accountAPI } from '../api';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const DOMESTIC_FEE     = 25;
const INTERNATIONAL_FEE = 45;

const STATUS_COLORS = {
  pending:    'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  completed:  'bg-emerald-100 text-emerald-700',
  failed:     'bg-red-100 text-red-600',
  cancelled:  'bg-gray-100 text-gray-500',
};

const CANCELABLE = ['pending', 'processing'];

export default function WireTransfer() {
  const [transfers, setTransfers] = useState([]);
  const [accounts,  setAccounts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [wtRes, accRes] = await Promise.all([
        wireTransferAPI.getAll(),
        accountAPI.getAll(),
      ]);
      setTransfers(wtRes.data.data?.transfers || wtRes.data.data || []);
      const accs = accRes.data.data?.accounts || accRes.data.data || [];
      setAccounts(Array.isArray(accs) ? accs : [accs]);
    } catch {
      toast.error('Failed to load wire transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await wireTransferAPI.cancel(id);
      setTransfers(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t));
      toast.success('Wire transfer cancelled');
    } catch {
      toast.error('Failed to cancel transfer');
    } finally {
      setCancelling(null);
    }
  };

  const onCreated = (transfer) => {
    setTransfers(prev => [transfer, ...prev]);
    setShowModal(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full">
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="text-gray-900 font-bold text-2xl">Wire Transfers</h1>
          <p className="text-gray-500 text-sm mt-1">Send money domestically or internationally</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
          <PlusIcon /> New Wire Transfer
        </button>
      </div>

      {/* Fee notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-2 animate-fade-up" style={{ animationDelay: '0.03s' }}>
        <InfoIcon className="text-gray-400 shrink-0" />
        <p className="text-gray-600 text-xs">
          <span className="font-medium">Domestic:</span> $25.00 per transfer &nbsp;·&nbsp;
          <span className="font-medium">International:</span> $45.00 per transfer
        </p>
      </div>

      {/* Transfer list */}
      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => <div key={i} className="h-28 rounded-xl shimmer" />)}
        </div>
      ) : transfers.length === 0 ? (
        <div className="bank-card flex flex-col items-center justify-center py-16 text-center animate-fade-up">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <ArrowsIcon className="text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold text-sm">No wire transfers</p>
          <p className="text-gray-400 text-xs mt-1">Wire transfer history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          {transfers.map(t => (
            <div key={t.id} className="bank-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`badge ${t.type === 'international' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} capitalize`}>
                      {t.type || 'domestic'}
                    </span>
                    <span className={`badge ${STATUS_COLORS[t.status] || 'bg-gray-100 text-gray-500'} capitalize`}>{t.status}</span>
                  </div>
                  <p className="text-gray-900 font-semibold text-sm">{t.recipientName}</p>
                  <p className="text-gray-500 text-xs">{t.bankName}</p>
                  {t.reference && <p className="text-gray-400 font-mono text-[10px] mt-0.5">{t.reference}</p>}
                  <p className="text-gray-400 text-xs mt-0.5">
                    {new Date(t.createdAt || t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-gray-900 font-bold text-lg amount-display">{formatCurrency(t.amount, t.currency || 'USD')}</p>
                  <p className="text-gray-400 text-xs">+ {formatCurrency(t.fee || (t.type === 'international' ? INTERNATIONAL_FEE : DOMESTIC_FEE))} fee</p>
                  {CANCELABLE.includes(t.status) && (
                    <button
                      onClick={() => handleCancel(t.id)}
                      disabled={cancelling === t.id}
                      className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                    >
                      {cancelling === t.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <WireFormModal
          accounts={accounts}
          onClose={() => setShowModal(false)}
          onCreated={onCreated}
        />
      )}
    </div>
  );
}

const WIRE_TABS = ['Domestic', 'International'];

function WireFormModal({ accounts, onClose, onCreated }) {
  const [tab,     setTab]     = useState('Domestic');
  const [step,    setStep]    = useState('form');
  const [saving,  setSaving]  = useState(false);
  const [form, setForm] = useState({
    accountId:     accounts[0]?.id || '',
    recipientName: '',
    bankName:      '',
    routingNumber: '',
    accountNumber: '',
    swiftCode:     '',
    iban:          '',
    currency:      'USD',
    amount:        '',
    memo:          '',
  });

  const update = f => e => setForm(p => ({ ...p, [f]: e.target.value }));
  const fee    = tab === 'International' ? INTERNATIONAL_FEE : DOMESTIC_FEE;
  const amt    = parseFloat(form.amount) || 0;
  const total  = amt + fee;

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.accountId)           return toast.error('Select an account');
    if (!form.recipientName.trim()) return toast.error('Enter recipient name');
    if (!form.bankName.trim())      return toast.error('Enter bank name');
    if (!form.accountNumber.trim()) return toast.error('Enter account number');
    if (tab === 'Domestic' && form.routingNumber.length !== 9) return toast.error('Routing number must be 9 digits');
    if (tab === 'International' && !form.swiftCode.trim()) return toast.error('Enter SWIFT/BIC code');
    if (!amt || amt <= 0)           return toast.error('Enter a valid amount');
    setStep('confirm');
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        accountId:     form.accountId,
        recipientName: form.recipientName.trim(),
        bankName:      form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        amount:        amt,
        currency:      form.currency,
        type:          tab.toLowerCase(),
        memo:          form.memo.trim() || undefined,
        fee,
        ...(tab === 'Domestic' ? {
          routingNumber: form.routingNumber,
        } : {
          swiftCode: form.swiftCode.trim(),
          iban:      form.iban.trim() || undefined,
        }),
      };
      const { data } = await wireTransferAPI.initiate(payload);
      toast.success('Wire transfer initiated');
      const transfer = data.data?.transfer || { id: Date.now(), ...payload, status: 'pending', createdAt: new Date().toISOString() };
      onCreated(transfer);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Wire transfer failed');
      setStep('form');
    } finally {
      setSaving(false);
    }
  };

  const selectedAcc = accounts.find(a => a.id === form.accountId);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-fade-up max-h-[92vh] overflow-y-auto">

        {step === 'form' && (
          <>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-gray-900 font-bold text-lg">New Wire Transfer</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-5">
              {WIRE_TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-3 pt-4 px-1 mr-6 text-sm font-medium border-b-2 transition-colors ${
                    tab === t ? 'border-navy text-navy' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleNext} className="p-5 space-y-4">
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
                  <label className="block text-xs text-gray-500 font-medium mb-1.5">Recipient Name</label>
                  <input className="input-base" value={form.recipientName} onChange={update('recipientName')} placeholder="John Smith" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1.5">Bank Name</label>
                  <input className="input-base" value={form.bankName} onChange={update('bankName')} placeholder="Chase Bank" />
                </div>
              </div>

              {tab === 'Domestic' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1.5">Routing Number</label>
                    <input className="input-base font-mono" maxLength={9} value={form.routingNumber} onChange={update('routingNumber')} placeholder="123456789" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1.5">Account Number</label>
                    <input className="input-base font-mono" value={form.accountNumber} onChange={update('accountNumber')} placeholder="000123456" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 font-medium mb-1.5">SWIFT/BIC Code</label>
                      <input className="input-base font-mono uppercase" value={form.swiftCode} onChange={update('swiftCode')} placeholder="CHASUS33" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 font-medium mb-1.5">IBAN (optional)</label>
                      <input className="input-base font-mono uppercase" value={form.iban} onChange={update('iban')} placeholder="GB29NWBK..." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1.5">Account Number</label>
                    <input className="input-base font-mono" value={form.accountNumber} onChange={update('accountNumber')} placeholder="000123456" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium mb-1.5">Currency</label>
                    <select className="input-base" value={form.currency} onChange={update('currency')}>
                      {['USD','EUR','GBP','JPY','CAD','AUD','CHF','CNY','HKD','SGD'].map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1.5">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{form.currency}</span>
                    <input type="number" min="1" step="0.01" className="input-base pl-10 amount-display" value={form.amount} onChange={update('amount')} placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1.5">Memo (optional)</label>
                  <input className="input-base" value={form.memo} onChange={update('memo')} placeholder="Invoice #123" />
                </div>
              </div>

              {/* Fee preview */}
              {amt > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Transfer Amount</span>
                    <span className="amount-display">{formatCurrency(amt, form.currency)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{tab} Wire Fee</span>
                    <span className="amount-display">{formatCurrency(fee)}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-semibold border-t border-gray-200 pt-1.5">
                    <span>Total Deduction</span>
                    <span className="amount-display">{formatCurrency(total)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Review Transfer</button>
              </div>
            </form>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="flex items-center p-5 border-b border-gray-100 gap-3">
              <button onClick={() => setStep('form')} className="text-gray-400 hover:text-gray-600 transition-colors"><BackIcon /></button>
              <h2 className="text-gray-900 font-bold text-lg flex-1">Confirm Wire Transfer</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
                <ConfirmRow label="Type"          value={tab} />
                <ConfirmRow label="From"          value={selectedAcc ? `•••• ${(selectedAcc.accountNumber || '').slice(-4)}` : '—'} mono />
                <ConfirmRow label="Recipient"     value={form.recipientName} />
                <ConfirmRow label="Bank"          value={form.bankName} />
                <ConfirmRow label="Account #"     value={form.accountNumber} mono />
                {tab === 'Domestic'      && <ConfirmRow label="Routing #"    value={form.routingNumber}  mono />}
                {tab === 'International' && <ConfirmRow label="SWIFT/BIC"    value={form.swiftCode}      mono />}
                {tab === 'International' && form.iban && <ConfirmRow label="IBAN" value={form.iban}       mono />}
                <ConfirmRow label="Amount"        value={formatCurrency(amt, form.currency)} highlight />
                <ConfirmRow label="Wire Fee"      value={formatCurrency(fee)} />
                <ConfirmRow label="Total"         value={formatCurrency(total)} highlight />
                {form.memo && <ConfirmRow label="Memo" value={form.memo} />}
              </div>
              <p className="text-gray-400 text-xs text-center">Wire transfers cannot be reversed once processed.</p>
              <div className="flex gap-3">
                <button onClick={() => setStep('form')} className="btn-ghost flex-1">Edit</button>
                <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
                  {saving ? <Spinner /> : 'Confirm & Send'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ConfirmRow({ label, value, highlight, mono }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className={`${highlight ? 'text-gray-900 font-bold amount-display' : mono ? 'font-mono text-gray-700' : 'text-gray-700'} font-medium`}>{value}</span>
    </div>
  );
}

function Spinner() { return <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>; }
function XIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function BackIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>; }
function PlusIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function InfoIcon({ className = '' }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function ArrowsIcon({ className = '' }) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>; }
