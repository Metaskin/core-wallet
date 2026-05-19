import { useState, useEffect } from 'react';
import { creditScoreAPI } from '../api';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function scoreColor(score) {
  if (score >= 800) return { text: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Exceptional', hex: '#059669' };
  if (score >= 740) return { text: 'text-bank-green',  bg: 'bg-green-100',   label: 'Very Good',   hex: '#1A7A4A' };
  if (score >= 670) return { text: 'text-blue-600',    bg: 'bg-blue-100',    label: 'Good',         hex: '#2563EB' };
  if (score >= 580) return { text: 'text-amber-600',   bg: 'bg-amber-100',   label: 'Fair',         hex: '#D97706' };
  return { text: 'text-bank-red', bg: 'bg-red-100', label: 'Poor', hex: '#C0392B' };
}

function utilColor(pct) {
  if (pct <= 30) return '#1A7A4A';
  if (pct <= 50) return '#D97706';
  return '#C0392B';
}

export default function CreditScore() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    creditScoreAPI.getScore()
      .then(({ data: res }) => setData(res.data))
      .catch(() => toast.error('Failed to load credit score'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full space-y-4">
        <div className="h-8 w-48 rounded-lg shimmer" />
        <div className="h-52 rounded-xl shimmer" />
        <div className="h-52 rounded-xl shimmer" />
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => <div key={i} className="h-28 rounded-xl shimmer" />)}
        </div>
      </div>
    );
  }

  const score      = data?.score         || 0;
  const change     = data?.monthlyChange || 0;
  const history    = data?.history       || [];
  const factors    = data?.factors       || {};
  const { text: scoreTextColor, label: scoreLabel, hex: scoreHex } = scoreColor(score);

  // Score gauge: 300–850 mapped to 0–100%
  const gaugePct = Math.max(0, Math.min(100, ((score - 300) / 550) * 100));

  const tips = buildTips(factors, score);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full">
      <div className="mb-6 animate-fade-up">
        <h1 className="text-gray-900 font-bold text-2xl">Credit Score</h1>
        <p className="text-gray-500 text-sm mt-1">Your credit health overview</p>
      </div>

      {/* Hero card */}
      <div className="bank-card p-6 mb-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Gauge circle */}
          <div className="relative shrink-0">
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="54" fill="none" stroke="#F3F4F6" strokeWidth="12" />
              <circle
                cx="65" cy="65" r="54"
                fill="none"
                stroke={scoreHex}
                strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - gaugePct / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 65 65)"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-bold text-3xl amount-display ${scoreTextColor}`}>{score}</span>
              <span className="text-gray-400 text-xs mt-0.5">{scoreLabel}</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className={`font-bold text-2xl ${scoreTextColor}`}>{scoreLabel}</p>
            <div className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-sm font-medium ${change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
              {change >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
              {Math.abs(change)} from last month
            </div>
            <p className="text-gray-400 text-xs mt-3">Simulated score for educational purposes only. Provided by CoreCredit™.</p>
          </div>
        </div>
      </div>

      {/* Score history chart */}
      {history.length > 0 && (
        <div className="bank-card p-5 mb-6 animate-fade-up" style={{ animationDelay: '0.08s' }}>
          <p className="text-gray-800 font-semibold text-sm mb-4">Score History (18 Months)</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={history} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#003087" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#003087" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <YAxis domain={[300, 850]} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '12px' }}
                formatter={(v) => [v, 'Score']}
              />
              <Area type="monotone" dataKey="score" stroke="#003087" strokeWidth={2} fill="url(#scoreGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Score factors */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.11s' }}>
        <FactorCard
          label="Payment History"
          value={factors.paymentHistory ? `${factors.paymentHistory}%` : '—'}
          subLabel="on-time payments"
          color="#1A7A4A"
          pct={factors.paymentHistory || 0}
        />
        <FactorCard
          label="Credit Utilization"
          value={factors.utilization ? `${factors.utilization}%` : '—'}
          subLabel={factors.utilization <= 30 ? 'Good' : factors.utilization <= 50 ? 'Fair' : 'High'}
          color={utilColor(factors.utilization || 0)}
          pct={100 - (factors.utilization || 0)}
        />
        <FactorCard
          label="Credit Age"
          value={factors.creditAge ? `${factors.creditAge} yr${factors.creditAge !== 1 ? 's' : ''}` : '—'}
          subLabel="average account age"
          color="#0072CE"
          pct={Math.min(100, ((factors.creditAge || 0) / 10) * 100)}
        />
        <FactorCard
          label="Hard Inquiries"
          value={factors.hardInquiries !== undefined ? String(factors.hardInquiries) : '—'}
          subLabel="in last 2 years"
          color={factors.hardInquiries <= 2 ? '#1A7A4A' : '#D97706'}
          pct={Math.max(0, 100 - (factors.hardInquiries || 0) * 15)}
        />
      </div>

      {/* Tips */}
      <div className="bank-card p-5 animate-fade-up" style={{ animationDelay: '0.14s' }}>
        <p className="text-gray-800 font-semibold text-sm mb-4">Tips to Improve Your Score</p>
        <div className="space-y-3">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <LightbulbIcon className="text-blue-500" />
              </div>
              <div>
                <p className="text-gray-800 text-sm font-medium">{tip.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FactorCard({ label, value, subLabel, color, pct }) {
  return (
    <div className="bank-card p-4">
      <p className="section-label mb-2">{label}</p>
      <p className="text-gray-900 font-bold text-2xl amount-display mb-0.5">{value}</p>
      <p className="text-gray-400 text-xs mb-3">{subLabel}</p>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function buildTips(factors, score) {
  const tips = [
    {
      title: 'Payment history is 35% of your score',
      body: 'Set up autopay for at least the minimum payment on all accounts to ensure you never miss a due date.',
    },
  ];
  if ((factors.utilization || 0) > 30) {
    tips.push({
      title: 'Lower your credit utilization',
      body: 'Keep your utilization below 30% — ideally below 10%. Pay down balances or request a credit limit increase.',
    });
  } else {
    tips.push({
      title: 'Great utilization!',
      body: `Your utilization of ${factors.utilization || 0}% is within the ideal range. Keep it below 30% for the best impact.`,
    });
  }
  if ((factors.hardInquiries || 0) > 3) {
    tips.push({
      title: 'Limit new credit applications',
      body: 'Each hard inquiry can lower your score by up to 5 points. Only apply for new credit when necessary.',
    });
  } else {
    tips.push({
      title: 'Diversify your credit mix',
      body: 'Having a mix of credit types (revolving and installment) can positively impact up to 10% of your score.',
    });
  }
  return tips.slice(0, 3);
}

function ArrowUpIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>; }
function ArrowDownIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>; }
function LightbulbIcon({ className = '' }) { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17H8v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/></svg>; }
