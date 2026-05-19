import { useState, useEffect } from 'react';
import { checkDepositAPI, accountAPI } from '../api';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending:   'bg-amber-100 text-amber-700',
  reviewing: 'bg-blue-100 text-blue-700',
  approved:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-600',
  on_hold:   'bg-orange-100 text-orange-700',
};

const TIMELINE = ['pending', 'reviewing', 'approved'];

export default function CheckDeposit() {
  const [deposits,   setDeposits]   = useState([]);
  const [accounts,   setAccounts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [depRes, accRes] = await Promise.all([
        checkDepositAPI.getAll(),
        accountAPI.getAll(),
      ]);
      setDeposits(depRes.data.data?.deposits || depRes.data.data || []);
      const accs = accRes.data.data?.accounts || accRes.data.data || [];
      setAccounts(Array.isArray(accs) ? accs : [accs]);
    } catch {
      toast.error('Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onDeposited = (dep) => {
    setDeposits(prev => [dep, ...prev]);
    setShowModal(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="text-gray-900 font-bold text-2xl">Mobile Check Deposit</h1>
          <p className="text-gray-500 text-sm mt-1">Deposit checks from your phone</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
          <CameraIcon /> Deposit a Check
        </button>
      </div>

      {/* Fraud notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3 animate-fade-up" style={{ animationDelay: '0.02s' }}>
        <AlertIcon className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-amber-700 text-xs leading-relaxed">
          Deposits over $5,000 are subject to a 2-business-day hold. Funds from deposits under $5,000 are typically available the next business day. Keep the physical check for 14 days after deposit.
        </p>
      </div>

      {/* History */}
      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => <div key={i} className="h-28 rounded-xl shimmer" />)}
        </div>
      ) : deposits.length === 0 ? (
        <div className="bank-card flex flex-col items-center justify-center py-16 text-center animate-fade-up">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <CameraIcon className="text-gray-400" size={20} />
          </div>
          <p className="text-gray-700 font-semibold text-sm">No deposits yet</p>
          <p className="text-gray-400 text-xs mt-1 max-w-xs">Use the button above to deposit your first check</p>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          {deposits.map(dep => {
            const stepIdx = TIMELINE.indexOf(dep.status);
            return (
              <div key={dep.id} className="bank-card p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-gray-500 font-mono text-xs mb-1">{dep.referenceNumber || dep.reference}</p>
                    <p className="text-gray-900 font-bold text-xl amount-display">{formatCurrency(dep.amount)}</p>
                    {dep.accountName && <p className="text-gray-500 text-xs mt-0.5">→ {dep.accountName}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`badge ${STATUS_COLORS[dep.status] || 'bg-gray-100 text-gray-500'} capitalize`}>
                      {dep.status?.replace('_', ' ')}
                    </span>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(dep.createdAt || dep.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {dep.status === 'approved' && dep.availabilityDate && (
                      <p className="text-bank-green text-xs mt-1 font-medium">
                        Available {new Date(dep.availabilityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                {dep.status !== 'rejected' && (
                  <div className="flex items-center gap-1">
                    {TIMELINE.map((step, i) => {
                      const done = stepIdx >= i;
                      const current = stepIdx === i;
                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
                              done ? 'bg-navy border-navy' : 'bg-white border-gray-300'
                            } ${current ? 'ring-2 ring-navy/20' : ''}`} />
                            <span className={`text-[9px] mt-1 capitalize ${done ? 'text-navy font-medium' : 'text-gray-400'}`}>{step}</span>
                          </div>
                          {i < TIMELINE.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-1 rounded-full ${stepIdx > i ? 'bg-navy' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <DepositModal
          accounts={accounts}
          onClose={() => setShowModal(false)}
          onDeposited={onDeposited}
        />
      )}
    </div>
  );
}

const STEPS = { FORM: 'form', REVIEW: 'review', SUCCESS: 'success' };

function DepositModal({ accounts, onClose, onDeposited }) {
  const [step, setStep] = useState(STEPS.FORM);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    accountId:   accounts[0]?.id || '',
    amount:      '',
    checkNumber: '',
    memo:        '',
  });
  const [frontFile,  setFrontFile]  = useState(null);
  const [backFile,   setBackFile]   = useState(null);
  const [frontB64,   setFrontB64]   = useState('');
  const [backB64,    setBackB64]    = useState('');
  const [frontThumb, setFrontThumb] = useState('');
  const [backThumb,  setBackThumb]  = useState('');

  const update = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleFrontChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFrontFile(file);
    const b64 = await fileToBase64(file);
    setFrontB64(b64);
    setFrontThumb(b64);
  };

  const handleBackChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackFile(file);
    const b64 = await fileToBase64(file);
    setBackB64(b64);
    setBackThumb(b64);
  };

  const handleNext = (e) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!form.accountId)     return toast.error('Select an account');
    if (!amt || amt <= 0)    return toast.error('Enter a valid amount');
    if (amt > 10000)         return toast.error('Maximum deposit is $10,000');
    if (!frontFile)          return toast.error('Upload the front of the check');
    if (!backFile)           return toast.error('Upload the back of the check');
    setStep(STEPS.REVIEW);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        accountId:   form.accountId,
        amount:      parseFloat(form.amount),
        checkNumber: form.checkNumber.trim() || undefined,
        memo:        form.memo.trim()        || undefined,
        frontImage:  frontB64,
        backImage:   backB64,
      };
      const { data } = await checkDepositAPI.submit(payload);
      toast.success('Check deposit submitted');
      const dep = data.data?.deposit || { id: Date.now(), ...payload, status: 'pending', createdAt: new Date().toISOString() };
      onDeposited(dep);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deposit submission failed');
      setStep(STEPS.FORM);
    } finally {
      setSaving(false);
    }
  };

  const selectedAcc = accounts.find(a => a.id === form.accountId);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-fade-up max-h-[92vh] overflow-y-auto">

        {step === STEPS.FORM && (
          <>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-gray-900 font-bold text-lg">Deposit a Check</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon /></button>
            </div>
            <form onSubmit={handleNext} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1.5">Deposit to Account</label>
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
                    <input type="number" min="0.01" max="10000" step="0.01" className="input-base pl-7 amount-display" value={form.amount} onChange={update('amount')} placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1.5">Check Number (optional)</label>
                  <input className="input-base font-mono" value={form.checkNumber} onChange={update('checkNumber')} placeholder="1234" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1.5">Memo (optional)</label>
                <input className="input-base" value={form.memo} onChange={update('memo')} placeholder="For rent, etc." />
              </div>

              {/* Front upload */}
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1.5">Front of Check</label>
                <label className={`flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${frontThumb ? 'border-navy/30' : 'border-gray-200 hover:border-navy/30'}`}>
                  {frontThumb ? (
                    <img src={frontThumb} alt="Front" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <CameraIcon size={28} />
                      <span className="text-xs font-medium">Front side</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFrontChange} />
                </label>
              </div>

              {/* Back upload */}
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1.5">Back of Check</label>
                <label className={`flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${backThumb ? 'border-navy/30' : 'border-gray-200 hover:border-navy/30'}`}>
                  {backThumb ? (
                    <img src={backThumb} alt="Back" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <CameraIcon size={28} />
                      <span className="text-xs font-medium">Back side (endorse here)</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleBackChange} />
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Review Deposit</button>
              </div>
            </form>
          </>
        )}

        {step === STEPS.REVIEW && (
          <>
            <div className="flex items-center p-5 border-b border-gray-100 gap-3">
              <button onClick={() => setStep(STEPS.FORM)} className="text-gray-400 hover:text-gray-600 transition-colors"><BackIcon /></button>
              <h2 className="text-gray-900 font-bold text-lg flex-1">Review Deposit</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                <ReviewRow label="Account"      value={selectedAcc ? `${(selectedAcc.accountType || 'Account').charAt(0).toUpperCase() + (selectedAcc.accountType || '').slice(1)} •••• ${(selectedAcc.accountNumber || '').slice(-4)}` : '—'} />
                <ReviewRow label="Amount"       value={formatCurrency(parseFloat(form.amount))} highlight />
                {form.checkNumber && <ReviewRow label="Check #" value={form.checkNumber} mono />}
                {form.memo        && <ReviewRow label="Memo"    value={form.memo} />}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="section-label mb-1.5">Front</p>
                  <img src={frontThumb} alt="Front" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                </div>
                <div>
                  <p className="section-label mb-1.5">Back</p>
                  <img src={backThumb} alt="Back" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                </div>
              </div>
              <p className="text-gray-400 text-xs text-center">By submitting, you confirm this check has not been previously deposited.</p>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(STEPS.FORM)} className="btn-ghost flex-1">Edit</button>
                <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
                  {saving ? <Spinner /> : 'Submit Deposit'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value, highlight, mono }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${highlight ? 'text-gray-900 font-bold amount-display text-base' : mono ? 'font-mono text-gray-700' : 'text-gray-700'}`}>{value}</span>
    </div>
  );
}

function Spinner() { return <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>; }
function XIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function BackIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>; }
function CameraIcon({ className = '', size = 18 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>; }
function AlertIcon({ className = '' }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
