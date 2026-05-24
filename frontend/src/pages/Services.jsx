import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ─── Scroll-reveal (same pattern as Landing) ─────────────────────────────────
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } },
      { threshold: 0.04 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}
      style={{ opacity: on ? 1 : 0, transform: on ? 'translateY(0)' : 'translateY(24px)',
               transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

// ─── Scroll-to-hash on load ───────────────────────────────────────────────────
function useHashScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return; }
    const id = hash.replace('#', '');
    const attempt = (n = 0) => {
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      } else if (n < 15) {
        setTimeout(() => attempt(n + 1), 80);
      }
    };
    setTimeout(() => attempt(), 120);
  }, [hash]);
}

// ─── Product data ─────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    id:      'personal',
    label:   'Personal Banking',
    tagline: 'Everyday banking built around your life',
    bg:      'bg-white',
    products: [
      {
        id:      'checking',
        title:   'MCT Free Checking',
        tagline: 'Your everyday spending account — zero fees, zero minimums',
        desc:    'A full-featured checking account with no monthly maintenance fees, no minimum balance requirements, and instant access to your funds from anywhere. Open in minutes with no credit check.',
        badge:   '$0 / month',
        color:   '#003087',
        features: [
          'No monthly maintenance fee, ever',
          'No minimum opening deposit required',
          'Free Visa debit card included on approval',
          'FDIC insured up to $250,000 per depositor',
          'Mobile check deposit — snap and deposit',
          'Unlimited transactions, no per-item fees',
          'Instant transfers between MCT accounts',
          '24/7 online & mobile banking access',
        ],
      },
      {
        id:      'savings',
        title:   'MCT High-Yield Savings',
        tagline: 'Earn more on every dollar you save',
        desc:    'Watch your money grow with our competitive-rate savings account. Set savings goals, automate transfers from checking, and track your progress — all from the MCT mobile app.',
        badge:   'Competitive APY',
        color:   '#0072CE',
        features: [
          'Competitive Annual Percentage Yield (APY)',
          'Interest compounded daily, paid monthly',
          'No monthly service fee',
          'Automatic scheduled transfers from checking',
          'Goal-based savings tracking in the app',
          'FDIC insured up to $250,000',
          'No penalty for withdrawals',
          'Linked seamlessly to your MCT Checking',
        ],
      },
      {
        id:      'debit-cards',
        title:   'Premium Debit Cards',
        tagline: 'Virtual and physical cards, always in your control',
        desc:    'Instant-issue virtual card the moment your account is approved — start spending online immediately. Physical card arrives in 5–7 business days. Freeze, replace, and manage all your cards from the mobile app.',
        badge:   'Instant Virtual Card',
        color:   '#B8860B',
        features: [
          'Instant virtual card on account approval',
          'Contactless tap-to-pay (NFC enabled)',
          'Freeze & unfreeze your card in seconds',
          'Travel Notice — notify us before any trip',
          'Zero-liability fraud protection',
          'Card replacement available in-app',
          'Global acceptance on the Visa network',
          'Real-time transaction alerts on every purchase',
        ],
      },
      {
        id:      'personal-loans',
        title:   'Personal Loans',
        tagline: 'Fixed rates, fast decisions, no hidden fees',
        desc:    'Whether you are consolidating high-interest debt, covering a large purchase, or funding a home improvement project, our personal loans offer straightforward fixed-rate terms with no surprise fees.',
        badge:   '$2,500 – $50,000',
        color:   '#003087',
        features: [
          'Competitive fixed interest rates',
          'Loan amounts from $2,500 to $50,000',
          'Repayment terms from 12 to 60 months',
          'No prepayment penalty — pay off early for free',
          'No origination fee',
          'Quick online application — decision in minutes',
          'Soft credit check for pre-qualification (no impact)',
          'Funds deposited directly to your MCT Checking',
        ],
      },
      {
        id:      'mobile-app',
        title:   'MCT Mobile Banking App',
        tagline: 'The full bank experience in your pocket',
        desc:    'Our Android app brings every MCT feature to your phone. Biometric login keeps your account secure. Real-time alerts, mobile check deposit, and instant transfers let you bank on your schedule.',
        badge:   'Android · Free Download',
        color:   '#1A7A4A',
        features: [
          'Biometric login — Face ID and Fingerprint',
          'Mobile check deposit — snap, submit, done',
          'Real-time push notifications on all activity',
          'Instant account-to-account transfers',
          'Full card management — freeze, replace, travel notice',
          'Bill pay and external wire transfers',
          'Spending analytics and monthly budget view',
          'Direct APK download — no app store required',
        ],
      },
    ],
  },

  {
    id:      'business',
    label:   'Business Banking',
    tagline: 'Powerful tools for companies of every size',
    bg:      'bg-gray-50',
    products: [
      {
        id:      'business-checking',
        title:   'MCT Business Checking',
        tagline: 'Built for the way businesses actually operate',
        desc:    'A business checking account designed for everything from sole proprietors to growing corporations — with the tools you need to manage daily operations, payroll, and vendor payments efficiently.',
        badge:   'No Monthly Fee',
        color:   '#003087',
        features: [
          'No monthly fee for qualifying balances',
          'Unlimited monthly transactions included',
          'Multiple authorised signers on one account',
          'Business Visa debit card for every authorised user',
          'ACH origination and receipt included',
          'Online bill pay to any US vendor',
          'Mobile deposit for business checks',
          'Same-day available balance updates',
        ],
      },
      {
        id:      'payroll',
        title:   'Payroll Services',
        tagline: 'Pay your team accurately and on time, every time',
        desc:    'Streamline payroll for businesses of any size. Process wages in minutes, ensure on-time direct deposits to any bank, and stay compliant with automated tax withholding and filing support.',
        badge:   'Same-Day ACH Available',
        color:   '#0072CE',
        features: [
          'Direct deposit to any US bank account',
          'Same-day and next-day ACH processing',
          'Automated payroll scheduling (weekly/bi-weekly/monthly)',
          'Federal, state, and local tax withholding calculation',
          'Employee self-service portal for pay stubs and forms',
          'W-2 and 1099 preparation and filing support',
          'Integration with QuickBooks, Xero, and more',
          'Dedicated payroll support team',
        ],
      },
      {
        id:      'merchant',
        title:   'Merchant Services',
        tagline: 'Accept every payment, in-store or online',
        desc:    'Grow your sales with our complete merchant payment solutions. Accept all major cards — in person, online, or on the go — with fast settlement directly to your MCT Business Checking account.',
        badge:   'Next-Day Settlement',
        color:   '#B8860B',
        features: [
          'Accept Visa, Mastercard, American Express & Discover',
          'Point-of-sale (POS) terminal and mobile reader solutions',
          'Online payment gateway integration',
          'Next-day or same-day settlement to MCT account',
          'Chargeback management and dispute support',
          'Real-time fraud prevention and monitoring',
          'Detailed sales reporting and analytics dashboard',
          'Competitive, transparent processing rates',
        ],
      },
      {
        id:      'business-credit',
        title:   'Business Credit Solutions',
        tagline: 'Capital when your business needs it most',
        desc:    'From revolving credit lines to equipment financing, our business credit products give you the flexibility to manage cash flow, seize growth opportunities, and invest in the infrastructure your company needs.',
        badge:   '$10K – $500K',
        color:   '#003087',
        features: [
          'Business lines of credit from $10,000 to $500,000',
          'Equipment financing loans up to $1,000,000',
          'Competitive fixed and variable interest rates',
          'Flexible repayment schedules tailored to cash flow',
          'Fast credit decision — typically 48–72 business hours',
          'No prepayment penalties',
          'Dedicated business relationship manager',
          'Online account management and reporting 24/7',
        ],
      },
      {
        id:      'treasury',
        title:   'Treasury Management',
        tagline: 'Optimise liquidity and protect every dollar',
        desc:    'For businesses managing significant cash balances, our treasury management services provide sophisticated tools to maximise liquidity, eliminate idle cash, and protect against fraud — all on one platform.',
        badge:   'Enterprise Ready',
        color:   '#4B0082',
        features: [
          'Automated cash concentration and zero-balance sweeping',
          'Controlled disbursement accounts',
          'Positive Pay — stop cheque and ACH fraud before it happens',
          'ACH Debit Block and Filter controls',
          'Domestic and international wire management',
          'Lockbox and remote deposit capture',
          'Real-time treasury reporting and forecasting dashboard',
          'Custom solutions for mid-market to enterprise clients',
        ],
      },
    ],
  },

  {
    id:      'wealth',
    label:   'Wealth Management',
    tagline: 'Expert guidance to grow, protect, and transfer your wealth',
    bg:      'bg-white',
    products: [
      {
        id:      'investment-advisory',
        title:   'Investment Advisory',
        tagline: 'Personalised guidance from dedicated, fiduciary advisors',
        desc:    'Our experienced investment advisors work with you one-on-one to understand your goals, risk tolerance, and time horizon — then build and manage a strategy designed to grow your wealth over the long term.',
        badge:   'Fiduciary Standard',
        color:   '#003087',
        features: [
          'Dedicated personal investment advisor assigned to you',
          'Comprehensive financial goal-setting and planning',
          'Risk tolerance assessment and suitability review',
          'Diversified portfolio construction across asset classes',
          'Quarterly performance reviews and rebalancing',
          'Access to equities, bonds, ETFs, and mutual funds',
          'Transparent, fee-only advisory structure',
          'Fiduciary duty — your interests always come first',
        ],
      },
      {
        id:      'portfolio',
        title:   'Portfolio Management',
        tagline: 'Active, daily oversight of every investment you own',
        desc:    'Our portfolio management team monitors your investments continuously, making tactical adjustments to capture opportunities and control risk across changing market conditions — without you lifting a finger.',
        badge:   'Active & Passive Strategies',
        color:   '#0072CE',
        features: [
          'Active and passive investment strategies available',
          'Automatic portfolio rebalancing to target allocations',
          'Tax-loss harvesting to reduce your annual tax bill',
          'ESG (environmental, social & governance) investing options',
          'Access to alternative investments and private markets',
          'Consolidated performance reporting across all accounts',
          'Benchmark comparison and attribution analysis',
          'Secure online portal with real-time portfolio view',
        ],
      },
      {
        id:      'retirement',
        title:   'Retirement Planning',
        tagline: 'A clear path to a financially secure retirement',
        desc:    'Whether retirement is decades away or just around the corner, our specialists help you optimise every dollar — from building your nest egg to making it last — with a detailed plan tailored to your life.',
        badge:   'IRA · 401(k) · Roth',
        color:   '#1A7A4A',
        features: [
          'Traditional and Roth IRA account management',
          '401(k) rollover assistance and IRA consolidation',
          'Social Security claiming strategy optimisation',
          'Required Minimum Distribution (RMD) planning',
          'Healthcare and long-term care cost projections',
          'Beneficiary designation review and coordination',
          'Monte Carlo retirement readiness modelling',
          'Estate and legacy planning fully integrated',
        ],
      },
      {
        id:      'tax',
        title:   'Tax-Efficient Wealth Strategies',
        tagline: 'Keep more of what you earn across your entire portfolio',
        desc:    'Our tax-aware approach integrates tax planning at every stage of wealth management — from portfolio construction through estate distribution — so that every investment decision accounts for your tax position.',
        badge:   'Year-Round Tax Planning',
        color:   '#B8860B',
        features: [
          'Tax-loss harvesting applied throughout the calendar year',
          'Asset location optimisation across taxable and tax-deferred accounts',
          'Tax-efficient withdrawal sequencing in retirement',
          'Coordination with your independent CPA or tax preparer',
          'Trust and estate income tax planning',
          'Charitable giving strategies — DAFs, QCDs, appreciated stock',
          'Roth conversion analysis and implementation',
          'Annual tax-impact review meeting with your advisor',
        ],
      },
      {
        id:      'trust',
        title:   'Trust & Estate Services',
        tagline: 'Protect your legacy and provide for the people you love',
        desc:    'Metropolitan Capital & Trust Bank serves as professional corporate trustee for revocable and irrevocable trusts, providing experienced fiduciary management to ensure your estate is administered exactly as you intended.',
        badge:   'Corporate Trustee',
        color:   '#003087',
        features: [
          'Revocable living trusts — maintain full control during your lifetime',
          'Irrevocable trusts for asset protection and estate tax planning',
          'Charitable trusts — Charitable Remainder and Lead Trusts',
          'Special needs trusts to protect vulnerable beneficiaries',
          'Corporate trustee and co-trustee services',
          'Estate settlement, probate assistance, and administration',
          'Successor trustee appointment and seamless transition',
          'Integrated investment management of trust assets',
        ],
      },
    ],
  },
];

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function Services() {
  const navigate = useNavigate();
  const goOpen   = () => navigate('/login?tab=register');
  const goHome   = () => navigate('/');
  useHashScroll();

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <ServicesNav onHome={goHome} onOpen={goOpen} />

      {/* Hero */}
      <section className="pt-28 pb-16 px-5 bg-gradient-to-br from-[#f0f4ff] via-white to-[#fafbff]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-3.5 py-1.5 mb-6">
            <ShieldIcon />
            <span className="text-navy/70 text-[11px] font-semibold tracking-wide">FDIC Insured · Member SIPC</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.05] mb-5">
            Products &amp; Services
          </h1>
          <p className="text-gray-500 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-8">
            Everything Metropolitan Capital &amp; Trust Bank offers — from everyday checking to full wealth management — explained in full.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`}
                className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium text-sm hover:border-navy hover:text-navy transition-all shadow-sm">
                {s.label}
              </a>
            ))}
            <button onClick={goOpen}
              className="px-5 py-2.5 rounded-xl bg-navy text-white font-semibold text-sm hover:bg-[#002066] transition-all shadow-sm">
              Open an Account →
            </button>
          </div>
        </div>
      </section>

      {/* All sections */}
      {SECTIONS.map(section => (
        <ServiceSection key={section.id} section={section} onOpen={goOpen} />
      ))}

      {/* Bottom CTA */}
      <section className="py-20 px-5 bg-navy">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-white/55 text-lg mb-8">Open your account in under 5 minutes. No credit check required for checking or savings.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={goOpen}
                className="px-10 py-4 rounded-2xl bg-white text-navy font-bold text-base hover:bg-gray-100 transition-all shadow-xl">
                Open an Account
              </button>
              <a href="/#mobile"
                className="px-10 py-4 rounded-2xl border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-medium text-base transition-all text-center">
                Download the App
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Compact footer */}
      <footer className="bg-[#0a0c10] py-8 px-5 text-center">
        <p className="text-white/25 text-xs">
          © 2019 Metropolitan Capital &amp; Trust Bank. All rights reserved. &nbsp;·&nbsp; Member FDIC &nbsp;·&nbsp; Equal Housing Lender
        </p>
        <p className="text-white/15 text-[10px] mt-2 max-w-2xl mx-auto leading-relaxed">
          Deposits insured up to $250,000 per depositor by the FDIC. Investment products are not FDIC insured, not bank-guaranteed, and may lose value.
        </p>
      </footer>
    </div>
  );
}

// ─── Full section with product cards ─────────────────────────────────────────
function ServiceSection({ section, onOpen }) {
  return (
    <section id={section.id} className={`py-20 px-5 ${section.bg}`}>
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <Reveal className="mb-14">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-navy text-xs font-bold uppercase tracking-widest px-3">
              {section.label}
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <p className="text-center text-gray-500 text-base">{section.tagline}</p>
        </Reveal>

        {/* Product cards */}
        <div className="space-y-8">
          {section.products.map((p, i) => (
            <ProductCard key={p.id} product={p} delay={i * 60} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Product detail card ──────────────────────────────────────────────────────
function ProductCard({ product: p, delay, onOpen }) {
  return (
    <Reveal delay={delay}>
      <div id={p.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow scroll-mt-24">
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ backgroundColor: p.color }} />

        <div className="p-7 sm:p-8">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: p.color }}>
                <ProductIcon id={p.id} />
              </div>
              <div>
                <h3 className="text-gray-900 font-bold text-xl leading-tight">{p.title}</h3>
                <p className="text-gray-500 text-sm mt-0.5">{p.tagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {p.badge && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold border"
                  style={{ backgroundColor: `${p.color}12`, borderColor: `${p.color}30`, color: p.color }}>
                  {p.badge}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-base leading-relaxed mb-6 max-w-3xl">{p.desc}</p>

          {/* Feature grid */}
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 mb-7">
            {p.features.map(f => (
              <div key={f} className="flex items-start gap-2.5">
                <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="#1A7A4A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="text-gray-600 text-sm leading-snug">{f}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpen}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 shadow-sm"
              style={{ backgroundColor: p.color }}
            >
              Open Account
            </button>
            <a href="#" onClick={e => { e.preventDefault(); onOpen(); }}
              className="text-sm font-medium transition-colors"
              style={{ color: p.color }}>
              Learn more &amp; apply →
            </a>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

// ─── Nav bar ──────────────────────────────────────────────────────────────────
function ServicesNav({ onHome, onOpen }) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/97 backdrop-blur-2xl border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <button onClick={onHome} className="flex items-center gap-2.5 select-none">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="#003087"/>
            <path d="M7 19 L20 9 L33 19" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="8" y="21" width="5" height="12" rx="1" fill="white" opacity="0.6"/>
            <rect x="17" y="17" width="6" height="16" rx="1" fill="white"/>
            <rect x="27" y="19" width="5" height="14" rx="1" fill="white" opacity="0.6"/>
          </svg>
          <div className="leading-none">
            <div className="font-bold text-navy text-sm tracking-tight">Metropolitan Capital</div>
            <div className="text-gray-400 text-[9px] tracking-widest uppercase">&amp; Trust Bank</div>
          </div>
        </button>

        <nav className="hidden md:flex items-center gap-5">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}
              className="text-sm text-gray-500 hover:text-navy font-medium transition-colors">
              {s.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={onHome}
            className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-navy font-medium transition-colors">
            <ChevronLeftIcon /> Home
          </button>
          <button onClick={onOpen}
            className="px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-[#002066] transition-all shadow-sm">
            Open Account
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Per-product icons ────────────────────────────────────────────────────────
function ProductIcon({ id }) {
  const icons = {
    'checking':            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    'savings':             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 6v6l4 2"/></svg>,
    'debit-cards':         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    'personal-loans':      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    'mobile-app':          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
    'business-checking':   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
    'payroll':             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    'merchant':            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
    'business-credit':     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    'treasury':            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="18"/><path d="M16 8h4l3 3v7h-7V8z"/></svg>,
    'investment-advisory': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    'portfolio':           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    'retirement':          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    'tax':                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    'trust':               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  };
  return icons[id] || <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>;
}

// ─── Utility icons ────────────────────────────────────────────────────────────
function ShieldIcon()      { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function ChevronLeftIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>; }
