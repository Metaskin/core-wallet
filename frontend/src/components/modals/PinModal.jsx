import { useState, useEffect, useRef } from 'react';
import { cardAPI } from '../../api';

export default function PinModal({ cardId, onSuccess, onClose }) {
  const [pin,     setPin]     = useState('');
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

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(val);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.length < 4) { setError('PIN must be at least 4 digits'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await cardAPI.secureDetails(cardId, pin);
      close();
      onSuccess(cardId, data.data); // data.data is the flat details object
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      setError(msg);
      setPin('');
      inputRef.current?.focus();
    } finally {
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
            <h2 className="text-white font-semibold">Enter Transaction PIN</h2>
            <p className="text-white/40 text-xs mt-0.5">Required to view card details</p>
          </div>
          <button onClick={close} className="text-white/20 hover:text-white/60 transition-colors">
            <XIcon />
          </button>
        </div>

        {/* PIN dot indicators */}
        <div className="flex justify-center gap-3 mb-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-150
                ${i < pin.length ? 'bg-accent scale-110' : 'bg-white/15'}`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="\d*"
            value={pin}
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
            disabled={loading || pin.length < 4}
            className="btn-primary w-full justify-center"
          >
            {loading ? <><Spinner /> Verifying…</> : 'Reveal Details'}
          </button>
        </form>

        <p className="text-white/20 text-[10px] text-center mt-4">
          Go to Settings → Transaction PIN to manage your PIN
        </p>
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
