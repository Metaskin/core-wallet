import { useState, useEffect } from 'react';
import { loanAPI } from '../api';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

const LOAN_TYPE_COLORS = {
  mortgage:  'bg-blue-100 text-blue-700',
  auto:      'bg-green-100 text-green-700',
  personal:  'bg-purple-100 text-purple-700',
  student:   'bg-amber-100 text-amber-700',
  business:  'bg-cyan-100 text-cyan-700',
};

function statusBadge(s) {
  if (s === 'current')    return 'bg-emerald-100 text-emerald-700';
  if (s === 'paid_off')   return 'bg-gray-100 text-gray-500';
  if (s === 'delinquent') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-500';
}

function progressColor(pct) {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-blue-500';
}

export default function Loans() {
  const [loans,   setLoans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [payLoan, setPayLoan] = useState(null);
  const [expanded, setExpanded] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await loanAPI.getAll();
      setLoans(data.data?.loans || data.data || []);
    } catch {
      toast.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full">
      <div className="mb-6 animate-fade-up">
        <h1 className="text-gray-900 font-bold text-2xl">Loans &amp; Mortgage</h1>
        <p className="text-gray-500 text-sm mt-1">Your active loan accounts</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[0,1,2].map(i => <div key={i} className="h-48 rounded-xl shimmer" />)}
        </div>
      ) : loans.length === 0 ? (
        <EmptyLoans />
      ) : (
        <div className="space-y-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          {loans.map(loan => {
            const principal  = parseFloat(loan.principal)        || 1;
            const remaining  = parseFloat(loan.remainingBalance) || 0;
            const paid       = principal - remaining;
            const pct        = Math.min(100, Math.max(0, (paid / principal) * 100));
            const isExpanded = expanded[loan.id];

            return (
              <div key={loan.id} className="bank-card overflow-hidden">
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${LOAN_TYPE_COLORS[loan.loanType] || 'bg-gray-100 text-gray-600'} capitalize`}>
                        {loan.loanType || 'Loan'}
                      </span>
                      <span className={`badge ${statusBadge(loan.status)} capitalize`}>{loan.status?.replace('_', ' ')}</span>
                    </div>
                    <p className="text-gray-400 font-mono text-xs shrink-0">{loan.loanNumber}</p>
                  </div>
                  <p className="text-gray-700 font-semibold text-sm mb-3">{loan.lenderName}</p>

                  {/* Balance + payment */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="section-label mb-1">Remaining Balance</p>
                      <p className="text-gray-900 font-bold text-xl amount-display">{formatCurrency(remaining)}</p>
                    </div>
                    <div>
                      <p className="section-label mb-1">Monthly Payment</p>
                      <p className="text-gray-900 font-semibold text-lg amount-display">{formatCurrency(loan.monthlyPayment)}</p>
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="flex gap-4 flex-wrap text-xs text-gray-500 mb-4">
                    <span>{loan.interestRate}% APR</span>
                    <span>{loan.termMonths || loan.term} months</span>
                    {loan.nextPaymentDate && (
                      <span className="flex items-center gap-1">
                        <CalendarIcon size={11} />
                        Due {new Date(loan.nextPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                      <span>Paid off {pct.toFixed(0)}%</span>
                      <span>{formatCurrency(paid)} of {formatCurrency(principal)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${progressColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {loan.status === 'current' && (
                      <button
                        onClick={() => setPayLoan(loan)}
                        className="btn-primary text-xs flex-1"
                      >
                        Make Payment
                      </button>
                    )}
                    <button
                      onClick={() => toggleExpand(loan.id)}
                      className="btn-ghost text-xs px-4"
                    >
                      {isExpanded ? 'Hide History' : 'Payment History'}
                      <ChevronIcon up={isExpanded} />
                    </button>
                  </div>
                </div>

                {/* Payment history expandable */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <p className="section-label mb-3">Recent Payments</p>
                    <PaymentHistory loanId={loan.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {payLoan && (
        <PaymentModal
          loan={payLoan}
          onClose={() => setPayLoan(null)}
          onPaid={(updated) => {
            setLoans(prev => prev.map(l => l.id === updated.id ? updated : l));
            setPayLoan(null);
          }}
        />
      )}
    </div>
  );
}

function PaymentHistory({ loanId }) {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    loanAPI.getOne(loanId)
      .then(({ data }) => setPayments(data.data?.payments || data.data?.loan?.payments || []))
      .catch(() => toast.error('Failed to load payment history'))
      .finally(() => setLoading(false));
  }, [loanId]);

  if (loading) return <div className="h-16 rounded-lg shimmer" />;
  if (!payments.length) return <p className="text-gray-400 text-xs">No payment history</p>;

  return (
    <div className="space-y-2">
      {payments.slice(0, 6).map((p, i) => (
        <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
          <div>
            <p className="text-gray-700 text-xs font-medium">
              {new Date(p.date || p.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            {p.type && <p className="text-gray-400 text-[10px] capitalize">{p.type}</p>}
          </div>
          <span className="text-gray-900 text-xs font-semibold amount-display">{formatCurrency(p.amount)}</span>
        </div>
      ))}
    </div>
  );
}

function PaymentModal({ loan, onClose, onPaid }) {
  const [amount,  setAmount]  = useState(loan.monthlyPayment?.toString() || '');
  const [loading, setLoading] = useState(false);

  const monthly   = parseFloat(loan.monthlyPayment) || 0;
  const rate      = parseFloat(loan.interestRate)   || 0;
  const remaining = parseFloat(loan.remainingBalance) || 0;
  const entered   = parseFloat(amount) || 0;

  const monthlyInterest = (remaining * (rate / 100)) / 12;
  const principal       = Math.max(0, entered - monthlyInterest);

  const handlePay = async () => {
    if (!entered || entered <= 0) return toast.error('Enter a valid amount');
    setLoading(true);
    try {
      const { data } = await loanAPI.makePayment(loan.id, { amount: entered });
      toast.success('Payment submitted successfully');
      onPaid(data.data?.loan || { ...loan, remainingBalance: Math.max(0, remaining - principal) });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl animate-fade-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-gray-900 font-bold text-lg">Make Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Loan summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Remaining Balance</span>
              <span className="text-gray-900 font-semibold amount-display">{formatCurrency(remaining)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Monthly Payment</span>
              <span className="text-gray-900 font-medium amount-display">{formatCurrency(monthly)}</span>
            </div>
            {loan.nextPaymentDate && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Next Due</span>
                <span className="text-gray-600">{new Date(loan.nextPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Payment Amount</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number" min="0.01" step="0.01"
                className="input-base pl-7 amount-display"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Breakdown */}
          {entered > 0 && (
            <div className="bg-blue-50 rounded-xl p-3 space-y-1">
              <p className="section-label mb-2">Payment Breakdown</p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Interest</span>
                <span className="text-gray-700 amount-display">{formatCurrency(Math.min(entered, monthlyInterest))}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Principal</span>
                <span className="text-bank-green font-medium amount-display">{formatCurrency(principal)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handlePay} disabled={loading} className="btn-primary flex-1">
              {loading ? <Spinner /> : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyLoans() {
  const [showCalc, setShowCalc] = useState(false);
  const [calcForm, setCalcForm] = useState({ amount: '', rate: '', years: '' });

  const monthly = (() => {
    const P = parseFloat(calcForm.amount) || 0;
    const r = (parseFloat(calcForm.rate)  || 0) / 100 / 12;
    const n = (parseFloat(calcForm.years) || 0) * 12;
    if (!P || !r || !n) return null;
    return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  })();

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Hero empty state */}
      <div className="bank-card p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-[#EEF4FF] flex items-center justify-center mb-5 shadow-sm">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#003087" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="22" x2="21" y2="22"/>
            <line x1="6" y1="18" x2="6" y2="11"/>
            <line x1="10" y1="18" x2="10" y2="11"/>
            <line x1="14" y1="18" x2="14" y2="11"/>
            <line x1="18" y1="18" x2="18" y2="11"/>
            <polygon points="12 2 20 7 4 7"/>
          </svg>
        </div>
        <h2 className="text-gray-900 font-bold text-lg mb-2">No Active Loans</h2>
        <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
          You don't have any active loans or mortgage accounts at this time. Explore competitive rates tailored to your profile.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full max-w-xs">
          <a
            href="mailto:loans@corewallet.com"
            className="btn-primary flex-1 text-sm text-center"
          >
            Explore Loan Options
          </a>
          <button
            onClick={() => setShowCalc(v => !v)}
            className="btn-ghost flex-1 text-sm"
          >
            {showCalc ? 'Hide Calculator' : 'Mortgage Calculator'}
          </button>
        </div>
      </div>

      {/* Mortgage calculator */}
      {showCalc && (
        <div className="bank-card p-6 animate-fade-up">
          <p className="text-gray-800 font-semibold text-sm mb-4 flex items-center gap-2">
            <CalcIcon /> Mortgage Calculator
          </p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Loan Amount ($)</label>
              <input
                type="number" className="input-base text-sm"
                placeholder="300000"
                value={calcForm.amount}
                onChange={e => setCalcForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Interest Rate (%)</label>
              <input
                type="number" step="0.01" className="input-base text-sm"
                placeholder="6.875"
                value={calcForm.rate}
                onChange={e => setCalcForm(f => ({ ...f, rate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Term (years)</label>
              <input
                type="number" className="input-base text-sm"
                placeholder="30"
                value={calcForm.years}
                onChange={e => setCalcForm(f => ({ ...f, years: e.target.value }))}
              />
            </div>
          </div>
          {monthly !== null && (
            <div className="bg-gradient-to-r from-blue-50 to-[#EEF4FF] rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Estimated Monthly Payment</p>
                <p className="text-navy font-bold text-2xl amount-display">
                  ${monthly.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs">Total Cost</p>
                <p className="text-gray-700 font-semibold amount-display">
                  ${(monthly * parseFloat(calcForm.years) * 12).toFixed(0)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loan type cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: '🏠', label: 'Home Mortgage', desc: 'Fixed & adjustable rates', rate: 'from 6.5% APR' },
          { icon: '🚗', label: 'Auto Loan',     desc: 'New & used vehicles',       rate: 'from 5.9% APR' },
          { icon: '💼', label: 'Personal Loan', desc: 'Flexible use of funds',     rate: 'from 8.5% APR' },
          { icon: '🎓', label: 'Student Loan',  desc: 'Education financing',        rate: 'from 4.5% APR' },
        ].map(({ icon, label, desc, rate }) => (
          <div key={label} className="bank-card p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-gray-800 font-semibold text-sm">{label}</p>
            <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
            <p className="text-bank-green text-xs font-medium mt-2">{rate}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalcIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <line x1="8" y1="6" x2="16" y2="6"/>
      <line x1="8" y1="10" x2="8" y2="10" strokeWidth="3" strokeLinecap="round"/>
      <line x1="12" y1="10" x2="12" y2="10" strokeWidth="3" strokeLinecap="round"/>
      <line x1="16" y1="10" x2="16" y2="10" strokeWidth="3" strokeLinecap="round"/>
      <line x1="8" y1="14" x2="8" y2="14" strokeWidth="3" strokeLinecap="round"/>
      <line x1="12" y1="14" x2="12" y2="14" strokeWidth="3" strokeLinecap="round"/>
      <line x1="16" y1="14" x2="16" y2="14" strokeWidth="3" strokeLinecap="round"/>
      <line x1="8" y1="18" x2="12" y2="18" strokeWidth="3" strokeLinecap="round"/>
      <line x1="16" y1="18" x2="16" y2="18" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function ChevronIcon({ up }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={`transition-transform ${up ? 'rotate-180' : ''}`}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function Spinner() { return <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>; }
function XIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function BankIcon({ className = '' }) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>; }
function CalendarIcon({ size = 14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
