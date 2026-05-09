import { useState } from 'react';
import { transactionAPI } from '../../api';
import { formatCurrency, maskAccountNumber } from '../../utils/formatters';
import toast from 'react-hot-toast';

const STEPS = { FORM: 'form', CONFIRM: 'confirm', SUCCESS: 'success', ERROR: 'error' };

export default function SendMoneyModal({ account, onClose, onSuccess }) {
  const [step,        setStep]        = useState(STEPS.FORM);
  const [loading,     setLoading]     = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');
  const [completedTx, setCompletedTx] = useState(null);

  const [form, setForm] = useState({
    toAccountNumber: '',
    amount:          '',
    description:     '',
  });

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!form.toAccountNumber.trim()) return toast.error('Enter recipient account number');
    if (form.toAccountNumber.trim().toUpperCase() === account.accountNumber)
      return toast.error('Cannot send money to your own account');
    if (!amt || amt <= 0)             return toast.error('Enter a valid amount');
    if (amt > account.balance)        return toast.error('Insufficient balance');
    setStep(STEPS.CONFIRM);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const { data } = await transactionAPI.send({
        senderAccountNumber: account.accountNumber,
        toAccountNumber:     form.toAccountNumber.trim().toUpperCase(),
        amount:              parseFloat(form.amount),
        description:         form.description || undefined,
      });
      setCompletedTx(data.data.transaction);
      setStep(STEPS.SUCCESS);
      onSuccess?.();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Transfer failed. Please try again.');
      setStep(STEPS.ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-bright rounded-2xl w-full max-w-md animate-fade-up">

        {/* ── FORM ── */}
        {step === STEPS.FORM && (
          <>
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <h2 className="text-white font-bold text-lg">Send Money</h2>
              <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
                <XIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Balance pill */}
              <div className="flex items-center justify-between bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3">
                <span className="text-white/40 text-xs">Available balance</span>
                <span className="amount-display text-white font-semibold text-sm">
                  {formatCurrency(account.balance)}
                </span>
              </div>

              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Recipient Account</label>
                <input
                  className="input-base font-mono uppercase"
                  placeholder="CW12345678"
                  value={form.toAccountNumber}
                  onChange={update('toAccountNumber')}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-mono text-sm">$</span>
                  <input
                    type="number" min="0.01" step="0.01"
                    className="input-base pl-7 amount-display"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={update('amount')}
                  />
                </div>
                {parseFloat(form.amount) > account.balance && (
                  <p className="text-danger text-xs mt-1.5">Exceeds your available balance</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Note (optional)</label>
                <input
                  className="input-base"
                  placeholder="What's this for?"
                  value={form.description}
                  onChange={update('description')}
                  maxLength={255}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-ghost flex-1 border border-white/10">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Continue</button>
              </div>
            </form>
          </>
        )}

        {/* ── CONFIRM ── */}
        {step === STEPS.CONFIRM && (
          <>
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <button onClick={() => setStep(STEPS.FORM)} className="text-white/40 hover:text-white/70 transition-colors">
                <BackIcon />
              </button>
              <h2 className="text-white font-bold text-lg">Confirm Transfer</h2>
              <div className="w-6"/>
            </div>

            <div className="p-6 space-y-3">
              <Row label="From"      value={maskAccountNumber(account.accountNumber)} mono />
              <Row label="To"        value={form.toAccountNumber.toUpperCase()} mono />
              <Row label="Amount"    value={formatCurrency(parseFloat(form.amount))} highlight />
              {form.description && <Row label="Note" value={form.description} />}
              <Row label="Remaining" value={formatCurrency(account.balance - parseFloat(form.amount))} />
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setStep(STEPS.FORM)} className="btn-ghost flex-1 border border-white/10">Edit</button>
              <button onClick={handleConfirm} disabled={loading} className="btn-primary flex-1">
                {loading ? <Spinner /> : 'Confirm & Send'}
              </button>
            </div>
          </>
        )}

        {/* ── SUCCESS ── */}
        {step === STEPS.SUCCESS && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
              <CheckIcon />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Transfer Complete</h2>
            <p className="text-white/40 text-sm mb-1">
              {formatCurrency(parseFloat(form.amount))} sent to {form.toAccountNumber.toUpperCase()}
            </p>
            {completedTx && (
              <p className="text-white/25 font-mono text-xs mb-6">{completedTx.reference}</p>
            )}
            <button onClick={onClose} className="btn-primary w-full">Done</button>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === STEPS.ERROR && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <XCircleIcon />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Transfer Failed</h2>
            <p className="text-white/50 text-sm mb-6">{errorMsg}</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-ghost flex-1 border border-white/10">Cancel</button>
              <button onClick={() => setStep(STEPS.FORM)} className="btn-primary flex-1">Try Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono, highlight }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/[0.05] last:border-0">
      <span className="text-white/40 text-sm">{label}</span>
      <span className={`text-sm font-medium ${mono ? 'font-mono' : ''} ${highlight ? 'text-white font-bold amount-display' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}

function Spinner() {
  return <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>;
}
function XIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function BackIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
}
function CheckIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function XCircleIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
}
