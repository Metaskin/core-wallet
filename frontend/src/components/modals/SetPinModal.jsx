import { useState, useEffect, useRef } from 'react';
import { securityAPI } from '../../api';
import toast from 'react-hot-toast';

export default function SetPinModal({ isChanging = false, onClose, onSaved }) {
  const [pin,     setPin]     = useState('');
  const [confirm, setConfirm] = useState('');
  const [step,    setStep]    = useState(1); // 1=enter PIN, 2=confirm
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(() => { setMounted(false); onClose(); }, 260);
  };

  const activeValue = step === 1 ? pin : confirm;
  const activeDots  = activeValue.length;

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    if (step === 1) { setPin(val); }
    else            { setConfirm(val); }
    setError('');
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (pin.length < 4) { setError('PIN must be at least 4 digits'); return; }
      setStep(2);
      setTimeout(() => inputRef.current?.focus(), 30);
      return;
    }
    // step 2: confirm
    if (confirm !== pin) { setError('PINs do not match'); setConfirm(''); return; }
    submit();
  };

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await securityAPI.setPin(pin);
      toast.success(isChanging ? 'PIN changed' : 'PIN set successfully');
      onSaved?.();
      close();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save PIN');
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-260
        ${visible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'}`}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div
        className={`glass rounded-2xl p-6 w-full max-w-sm transition-all duration-260
          ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold">
              {isChanging ? 'Change PIN' : 'Set Transaction PIN'}
            </h2>
            <p className="text-white/40 text-xs mt-0.5">
              {step === 1 ? 'Choose a 4-6 digit PIN' : 'Re-enter your PIN to confirm'}
            </p>
          </div>
          <button onClick={close} className="text-white/20 hover:text-white/60 transition-colors">
            <XIcon />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-5">
          <div className="h-1 flex-1 rounded-full bg-accent" />
          <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step === 2 ? 'bg-accent' : 'bg-white/10'}`} />
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-3 mb-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-150
                ${i < activeDots ? 'bg-accent scale-110' : 'bg-white/15'}`}
            />
          ))}
        </div>

        <form onSubmit={handleNext} className="space-y-4">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="\d*"
            value={activeValue}
            onChange={handleChange}
            maxLength={6}
            className="input-base text-center tracking-[0.5em] text-lg"
            placeholder="••••"
            autoComplete="off"
          />

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || activeValue.length < 4}
            className="btn-primary w-full justify-center"
          >
            {loading ? <><Spinner /> Saving…</> : step === 1 ? 'Continue' : (isChanging ? 'Change PIN' : 'Set PIN')}
          </button>
        </form>

        {step === 2 && (
          <button
            onClick={() => { setStep(1); setConfirm(''); setError(''); }}
            className="w-full text-center text-white/30 text-xs mt-3 hover:text-white/60 transition-colors"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

function XIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function Spinner() {
  return <svg className="animate-spin mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>;
}
