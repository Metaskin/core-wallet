import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import InstallSection from '../components/install/InstallSection';
import { useInstallDetection } from '../hooks/useInstallDetection';

// ─── Scroll-reveal ────────────────────────────────────────────────────────────
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}
      style={{ opacity: on ? 1 : 0, transform: on ? 'translateY(0)' : 'translateY(28px)',
               transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const goLogin  = () => navigate('/login');
  const goOpen   = () => navigate('/login?tab=register');

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      <LandingNav onSignIn={goLogin} onOpen={goOpen} />
      <HeroSection onOpen={goOpen} onSignIn={goLogin} />
      <TrustBar />
      <ServicesSection onOpen={goOpen} />
      <FeaturesSection />
      <SecuritySection />
      <MobileSection onOpen={goOpen} />
      <InstallSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection onOpen={goOpen} onSignIn={goLogin} />
      <SiteFooter onSignIn={goLogin} onOpen={goOpen} />

      {/* Mobile sticky */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden">
        <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100 px-4 py-3 flex gap-3">
          <button onClick={goLogin} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium">Sign In</button>
          <button onClick={goOpen}  className="flex-1 py-3 rounded-xl bg-navy text-white text-sm font-semibold shadow-sm">Open Account</button>
        </div>
      </div>
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────
function LandingNav({ onSignIn, onOpen }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/97 backdrop-blur-2xl border-b border-gray-100 shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 select-none">
          <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="9" fill="#003087"/>
            <path d="M7 19 L20 9 L33 19" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="8"  y="21" width="5" height="12" rx="1" fill="white" opacity="0.6"/>
            <rect x="17" y="17" width="6" height="16" rx="1" fill="white"/>
            <rect x="27" y="19" width="5" height="14" rx="1" fill="white" opacity="0.6"/>
          </svg>
          <div className="leading-none">
            <div className={`font-bold text-sm tracking-tight leading-none transition-colors ${scrolled ? 'text-navy' : 'text-navy'}`}>Metropolitan Capital</div>
            <div className="text-gray-400 text-[9px] tracking-widest uppercase leading-none mt-0.5">&amp; Trust Bank</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {[['#services','Services'],['#features','Banking'],['#security','Security'],['#mobile','Mobile']].map(([h,l]) => (
            <a key={l} href={h} className="text-sm text-gray-500 hover:text-navy font-medium transition-colors">{l}</a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={onSignIn} className="hidden sm:block px-4 py-2 rounded-lg text-sm text-gray-600 hover:text-navy font-medium transition-colors">Sign In</button>
          <button onClick={onOpen}   className="px-5 py-2.5 rounded-xl bg-navy hover:bg-[#002066] text-white text-sm font-semibold transition-all shadow-sm">Open Account</button>
        </div>
      </div>
    </header>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────────
function HeroSection({ onOpen, onSignIn }) {
  return (
    <section className="relative min-h-[100svh] flex items-center pt-20 pb-28 md:pb-16 px-5 overflow-hidden bg-gradient-to-br from-[#f0f4ff] via-white to-[#fafbff]">
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] bg-[#003087]/[0.04] rounded-full -translate-y-1/3 translate-x-1/3" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#0072CE]/[0.04] rounded-full translate-y-1/3 -translate-x-1/3" />

      <div className="relative max-w-6xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Left: text */}
          <div className="flex-1 min-w-0 text-center lg:text-left">
            {/* FDIC badge */}
            <div className="inline-flex items-center gap-2 bg-navy/5 border border-navy/10 rounded-full px-3.5 py-1.5 mb-7 animate-fade-up">
              <FdicShieldIcon />
              <span className="text-navy/70 text-[11px] font-semibold tracking-wide">FDIC Insured · Member SIPC</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[3.6rem] xl:text-7xl font-bold leading-[1.05] tracking-[-0.02em] text-gray-900 mb-5 animate-fade-up" style={{ animationDelay: '0.07s' }}>
              Where Capital<br />
              <span className="text-navy">Meets Trust.</span>
            </h1>

            <p className="text-gray-500 text-lg sm:text-xl leading-relaxed mb-10 max-w-lg mx-auto lg:mx-0 animate-fade-up" style={{ animationDelay: '0.14s' }}>
              Metropolitan Capital &amp; Trust Bank offers premium personal and commercial banking services — checking, savings, cards, wealth management, and more.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10 animate-fade-up" style={{ animationDelay: '0.21s' }}>
              <button onClick={onOpen}
                className="px-8 py-4 rounded-2xl bg-navy hover:bg-[#002066] text-white font-semibold text-base transition-all shadow-xl shadow-navy/20">
                Open an Account
              </button>
              <button onClick={onSignIn}
                className="px-8 py-4 rounded-2xl border border-gray-200 text-gray-700 hover:border-navy hover:text-navy font-medium text-base transition-all">
                Sign In →
              </button>
            </div>

            <div className="flex items-center gap-5 justify-center lg:justify-start animate-fade-up" style={{ animationDelay: '0.28s' }}>
              {['No monthly fees', 'Instant setup', 'Bank-grade security'].map(t => (
                <div key={t} className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1A7A4A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: banking card mockup */}
          <div className="shrink-0 animate-fade-up" style={{ animationDelay: '0.35s' }}>
            <div style={{ animation: 'hero-float 6s ease-in-out infinite' }}>
              <HeroBankCard />
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes hero-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}`}</style>
    </section>
  );
}

function HeroBankCard() {
  return (
    <div className="relative w-[300px] sm:w-[340px]">
      {/* Glow */}
      <div className="absolute inset-0 bg-navy/[0.12] blur-[60px] rounded-3xl scale-110 pointer-events-none" />
      {/* Card stack */}
      <div className="relative">
        {/* Back card */}
        <div className="absolute top-3 left-3 right-3 h-[200px] bg-gradient-to-br from-[#B8860B] to-[#8B6914] rounded-2xl shadow-xl opacity-60" />
        {/* Main card */}
        <div className="relative bg-gradient-to-br from-navy via-[#003a6e] to-[#0052a3] rounded-2xl p-6 shadow-2xl text-white overflow-hidden" style={{ aspectRatio: '1.586' }}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/[0.04] rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/[0.03] rounded-full translate-y-12 -translate-x-8" />
          {/* Chip */}
          <div className="w-8 h-6 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-md mb-6 shadow-sm" />
          {/* Number */}
          <p className="font-mono text-white/80 text-sm tracking-widest mb-4">•••• •••• •••• 4821</p>
          {/* Name + expiry */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5">Account Holder</p>
              <p className="text-white font-semibold text-sm tracking-wide">M. CAPITAL TRUST</p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5">Valid Thru</p>
              <p className="text-white font-mono text-sm">12/28</p>
            </div>
          </div>
          {/* Contactless icon */}
          <div className="absolute top-5 right-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="white" opacity="0.1"/>
              <path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
              <path d="M6 12c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
            </svg>
          </div>
        </div>

        {/* Balance card below */}
        <div className="mt-4 bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-xs font-medium">Available Balance</p>
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">Checking</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 font-mono mb-3">$18,240.00</p>
          <div className="flex gap-2">
            {['Send','Receive','Move'].map(l => (
              <div key={l} className="flex-1 py-2 rounded-xl bg-gray-50 text-center text-xs text-gray-500 font-medium border border-gray-100">{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Trust bar ─────────────────────────────────────────────────────────────────
function TrustBar() {
  const stats = [
    { value: '$2.8B+', label: 'Assets Under Management' },
    { value: '127K+',  label: 'Clients Served'          },
    { value: '30+',    label: 'Years of Excellence'      },
    { value: 'FDIC',   label: 'Insured & Regulated'      },
  ];
  return (
    <section className="bg-navy py-12 px-5">
      <div className="max-w-6xl mx-auto">
        <Reveal className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.08] rounded-2xl overflow-hidden">
          {stats.map(s => (
            <div key={s.label} className="bg-navy px-6 py-8 text-center">
              <p className="text-3xl font-bold text-white font-mono mb-1">{s.value}</p>
              <p className="text-white/50 text-sm">{s.label}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ── Services ──────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: <PersonIcon />,
    title: 'Personal Banking',
    desc: 'Checking, savings, debit cards, and personal loans tailored to your everyday financial needs.',
    items: ['High-yield savings', 'Free checking', 'Virtual debit cards', 'Personal loans'],
  },
  {
    icon: <BriefcaseIcon />,
    title: 'Business Banking',
    desc: 'Business checking, payroll, merchant services, and credit solutions for growing companies.',
    items: ['Business checking', 'Payroll services', 'Merchant accounts', 'Business credit'],
  },
  {
    icon: <TrendIcon />,
    title: 'Wealth Management',
    desc: 'Investment advisory, portfolio management, and retirement planning from dedicated advisors.',
    items: ['Investment advisory', 'Portfolio management', 'Retirement planning', 'Tax optimization'],
  },
  {
    icon: <BuildingIcon2 />,
    title: 'Treasury & Institutional',
    desc: 'Cash management, wire transfers, and institutional solutions for corporations and nonprofits.',
    items: ['Cash management', 'Wire transfers', 'Institutional custody', 'Liquidity solutions'],
  },
];

function ServicesSection({ onOpen }) {
  return (
    <section id="services" className="py-24 px-5 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-navy font-semibold text-sm tracking-widest uppercase mb-3">Our Services</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">Complete Banking Solutions</h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto text-lg">From everyday banking to sophisticated wealth management — everything under one roof.</p>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-6">
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={i * 80} className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-navy/20 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center text-navy mb-6 group-hover:bg-navy group-hover:text-white transition-all">
                {s.icon}
              </div>
              <h3 className="text-gray-900 font-bold text-xl mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">{s.desc}</p>
              <ul className="space-y-2">
                {s.items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-gray-600 text-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#003087" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
        <Reveal delay={300} className="text-center mt-12">
          <button onClick={onOpen} className="px-8 py-3.5 rounded-xl bg-navy text-white font-semibold hover:bg-[#002066] transition-all shadow-sm">
            Open an Account Today
          </button>
        </Reveal>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '🏦', title: 'Checking & Savings',   desc: 'Separate accounts for spending and saving. Earn competitive rates on every dollar.' },
  { icon: '💳', title: 'Premium Debit Cards',  desc: 'Instant-issue virtual cards with Freeze, Replace, and Travel Notice features.' },
  { icon: '⚡', title: 'Instant Transfers',    desc: 'Send to any MCT account instantly. Domestic wires in minutes, international in 24h.' },
  { icon: '📊', title: 'Financial Analytics',  desc: 'Real-time spending breakdowns, monthly reports, and 12-month trend charts.' },
  { icon: '🔔', title: 'Smart Alerts',         desc: 'Customizable push, email, and SMS alerts for transactions, security events, and more.' },
  { icon: '📱', title: 'Mobile Banking',       desc: 'Full-featured mobile app with biometric login, mobile check deposit, and instant transfers.' },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-5 bg-white">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-navy font-semibold text-sm tracking-widest uppercase mb-3">Features</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">Banking Built for Today</h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto text-lg">Modern tools and technology, backed by the trust and stability of a traditional institution.</p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}
              className="p-6 rounded-2xl border border-gray-100 hover:border-navy/20 hover:shadow-md transition-all bg-white group">
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="text-gray-900 font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Security ──────────────────────────────────────────────────────────────────
function SecuritySection() {
  const items = [
    { title: 'FDIC Insured', desc: 'Deposits insured up to $250,000 per depositor by the Federal Deposit Insurance Corporation.', icon: <FdicShieldIcon /> },
    { title: 'AES-256 Encryption', desc: 'All data encrypted at rest and in transit using bank-grade AES-256 and TLS 1.3 protocols.', icon: <LockSmIcon /> },
    { title: 'Multi-Factor Authentication', desc: 'OTP verification, biometric login, and session management protect every sign-in.', icon: <ShieldCheckIcon /> },
    { title: 'Fraud Monitoring', desc: '24/7 automated fraud detection with real-time transaction monitoring and instant alerts.', icon: <EyeIcon /> },
  ];
  return (
    <section id="security" className="py-24 px-5 bg-navy">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-white/50 font-semibold text-sm tracking-widest uppercase mb-3">Security &amp; Compliance</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Your Security Is Our Priority</h2>
          <p className="text-white/50 mt-4 max-w-xl mx-auto text-lg">Institution-grade protection across every layer of your account.</p>
        </Reveal>
        <div className="grid sm:grid-cols-2 gap-5">
          {items.map((item, i) => (
            <Reveal key={item.title} delay={i * 80}
              className="bg-white/[0.05] border border-white/[0.09] rounded-2xl p-7 hover:bg-white/[0.08] transition-all">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white mb-5">{item.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={350} className="mt-10 text-center">
          <p className="text-white/30 text-xs max-w-2xl mx-auto leading-relaxed">
            Metropolitan Capital &amp; Trust Bank is a federally regulated banking institution. All deposit accounts are insured by the FDIC up to the maximum allowed by law. This institution is an Equal Housing Lender.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ── Mobile App ────────────────────────────────────────────────────────────────
function MobileSection({ onOpen }) {
  return (
    <section id="mobile" className="py-24 px-5 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Phone */}
          <Reveal className="shrink-0 flex justify-center lg:justify-start">
            <div style={{ animation: 'hero-float 7s ease-in-out 1s infinite' }}>
              <MobilePhone />
            </div>
          </Reveal>
          {/* Text */}
          <Reveal delay={120} className="flex-1 text-center lg:text-left">
            <p className="text-navy font-semibold text-sm tracking-widest uppercase mb-3">Mobile Banking</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-6">
              Bank from anywhere,<br />anytime.
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
              Full-featured mobile banking with instant transfers, mobile check deposit, biometric login, and real-time account alerts — all in the palm of your hand.
            </p>
            <ul className="space-y-3 mb-10 max-w-sm mx-auto lg:mx-0">
              {[
                'Biometric login (Face ID / Fingerprint)',
                'Mobile check deposit',
                'Instant push notifications',
                'Card freeze & travel notice',
                'Investment & credit score monitoring',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-gray-600 text-sm">
                  <span className="w-5 h-5 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#003087" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <button onClick={onOpen}
                className="px-7 py-3.5 rounded-xl bg-navy text-white font-semibold hover:bg-[#002066] transition-all shadow-sm text-sm">
                Open Account
              </button>
              <MobileInstallButton />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function MobilePhone() {
  return (
    <div className="relative w-[240px] sm:w-[260px]">
      <div className="absolute inset-0 bg-navy/[0.08] blur-[50px] rounded-full scale-[1.2] pointer-events-none" />
      <div className="relative bg-white border border-gray-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/80" style={{ aspectRatio: '9/19.5' }}>
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-100 rounded-full z-10" />
        {/* Screen content */}
        <div className="absolute inset-0 bg-gray-50 pt-10 px-3 pb-4">
          {/* Header */}
          <div className="flex items-center justify-between px-1 mb-3">
            <div>
              <p className="text-gray-400 text-[8px]">Good morning</p>
              <p className="text-gray-800 font-bold text-[10px]">Welcome back</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-navy flex items-center justify-center">
              <p className="text-white text-[7px] font-bold">MC</p>
            </div>
          </div>
          {/* Balance card */}
          <div className="bg-gradient-to-br from-navy to-[#0052a3] rounded-xl p-3 mb-2 shadow-md text-white">
            <p className="text-white/50 text-[7px] uppercase tracking-wide mb-1">Total Balance</p>
            <p className="font-bold text-base font-mono">$18,240.00</p>
            <p className="text-white/40 text-[7px] mt-0.5">MCT •••• 4821</p>
          </div>
          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {['Send','Receive','Deposit'].map(a => (
              <div key={a} className="bg-white rounded-lg py-2 text-center shadow-sm border border-gray-100">
                <p className="text-gray-600 text-[8px] font-medium">{a}</p>
              </div>
            ))}
          </div>
          {/* Transactions */}
          <p className="text-gray-400 text-[7px] uppercase tracking-wide px-0.5 mb-1.5">Recent</p>
          {[
            { name: 'Direct Deposit', amt: '+$3,200', color: 'text-green-600' },
            { name: 'Amazon.com',     amt: '-$89.99', color: 'text-gray-500' },
            { name: 'Utility Bill',   amt: '-$134.00', color: 'text-gray-500'},
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between px-0.5 py-1.5 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-gray-100 shrink-0" />
                <p className="text-gray-700 text-[8px] font-medium">{r.name}</p>
              </div>
              <p className={`text-[8px] font-mono font-bold ${r.color}`}>{r.amt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Sarah K.', role: 'Small Business Owner',
    text: "Switching to Metropolitan Capital was the best financial decision I've made. The business banking tools are exactly what a growing company needs.",
    initials: 'SK', color: '#003087',
  },
  {
    name: 'James T.', role: 'Wealth Management Client',
    text: "My portfolio manager at MCT Bank has consistently delivered above-market returns while keeping my risk tolerance in mind. Truly personalized service.",
    initials: 'JT', color: '#B8860B',
  },
  {
    name: 'Priya M.', role: 'Personal Banking Client',
    text: "The mobile app is exceptional — fast, secure, and intuitive. I can manage all my accounts and cards in seconds. MCT Bank has earned my trust.",
    initials: 'PM', color: '#0072CE',
  },
];

function TestimonialsSection() {
  return (
    <section className="py-24 px-5 bg-white">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-navy font-semibold text-sm tracking-widest uppercase mb-3">Client Stories</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">Trusted by Thousands</h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}
              className="bg-gray-50 rounded-2xl p-7 border border-gray-100">
              {/* Stars */}
              <div className="flex gap-0.5 mb-5">
                {[0,1,2,3,4].map(j => (
                  <svg key={j} width="14" height="14" viewBox="0 0 24 24" fill="#B8860B" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: t.color }}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-gray-900 font-semibold text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.role}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Is Metropolitan Capital & Trust Bank FDIC insured?', a: 'Yes. All deposit accounts are insured by the Federal Deposit Insurance Corporation (FDIC) up to $250,000 per depositor, per account ownership category.' },
  { q: 'How do I open an account?', a: 'Click "Open Account" to begin the online application. The process takes under 5 minutes. You will need a government-issued ID and Social Security number.' },
  { q: 'What fees are associated with personal checking?', a: 'Our standard personal checking account has no monthly maintenance fee, no minimum balance requirement, and no fee for incoming domestic wire transfers.' },
  { q: 'How are my online transactions secured?', a: 'We use AES-256 encryption for all data, TLS 1.3 for connections, OTP-based two-factor authentication, and 24/7 automated fraud monitoring on every account.' },
  { q: 'Can I access my accounts on mobile?', a: 'Yes. Our web application is fully mobile-optimized and installable as a Progressive Web App (PWA) on both iOS and Android for a native banking experience.' },
  { q: 'What is the wire transfer processing time?', a: 'Domestic wires initiated before 4 PM Eastern are typically processed same business day. International wires to most countries are processed within 1–3 business days.' },
];

function FaqSection() {
  const [open, setOpen] = useState(null);
  return (
    <section className="py-24 px-5 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-navy font-semibold text-sm tracking-widest uppercase mb-3">FAQ</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">Common Questions</h2>
        </Reveal>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={i} delay={i * 40}>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-gray-900 font-semibold text-sm pr-4">{f.q}</span>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#003087" strokeWidth="2.5" strokeLinecap="round"
                    className={`shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {open === i && (
                  <div className="px-6 pb-5 border-t border-gray-50">
                    <p className="text-gray-500 text-sm leading-relaxed pt-4">{f.a}</p>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
function CtaSection({ onOpen, onSignIn }) {
  return (
    <section className="py-24 px-5 bg-navy">
      <div className="max-w-3xl mx-auto text-center">
        <Reveal>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-5 tracking-tight">
            Ready to Bank Smarter?
          </h2>
          <p className="text-white/55 text-lg mb-10 leading-relaxed">
            Join thousands of clients who trust Metropolitan Capital &amp; Trust Bank for their personal and commercial banking needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={onOpen}
              className="px-10 py-4 rounded-2xl bg-white text-navy font-bold text-base hover:bg-gray-100 transition-all shadow-xl">
              Open an Account
            </button>
            <button onClick={onSignIn}
              className="px-10 py-4 rounded-2xl border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-medium text-base transition-all">
              Sign In →
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function SiteFooter({ onSignIn, onOpen }) {
  const navigate = useNavigate();
  const cols = [
    {
      title: 'Personal',
      desc:  'Everyday banking for you',
      links: [
        { label: 'Checking Account', href: '/#services',          sub: 'Free, no monthly fees' },
        { label: 'Savings Account',  href: '/#services',          sub: 'High-yield earnings'   },
        { label: 'Debit Cards',      href: '/#features',          sub: 'Virtual & physical'    },
        { label: 'Personal Loans',   href: '/login?tab=register', sub: 'Competitive rates'     },
        { label: 'Mobile App',       href: '/#mobile',            sub: 'iOS & Android'         },
      ],
    },
    {
      title: 'Business',
      desc:  'Banking for growing companies',
      links: [
        { label: 'Business Checking', href: '/#services',          sub: 'Built for business'   },
        { label: 'Payroll Services',  href: '/#services',          sub: 'On-time, every time'  },
        { label: 'Merchant Services', href: '/#services',          sub: 'Accept payments fast' },
        { label: 'Business Credit',   href: '/login?tab=register', sub: 'Flexible credit lines' },
        { label: 'Treasury',          href: '/#services',          sub: 'Cash management'      },
      ],
    },
    {
      title: 'Wealth',
      desc:  'Grow and protect your assets',
      links: [
        { label: 'Investment Advisory',  href: '/#services',          sub: 'Personalised strategy'  },
        { label: 'Portfolio Management', href: '/#services',          sub: 'Active monitoring'      },
        { label: 'Retirement Planning',  href: '/#services',          sub: 'IRA & 401(k) guidance'  },
        { label: 'Tax Services',         href: '/login?tab=register', sub: 'Minimise your tax bill' },
        { label: 'Trust Services',       href: '/#services',          sub: 'Estate & trust setup'   },
      ],
    },
    {
      title: 'Company',
      desc:  'Learn more about MCT Bank',
      links: [
        { label: 'About Us',   href: '/about',    sub: 'Our story since 2019'     },
        { label: 'Contact Us', href: '/contact',  sub: '24 / 7 client support'   },
        { label: 'Careers',    href: '/contact',  sub: 'Join our team'           },
        { label: 'Security',   href: '/security', sub: 'How we protect you'      },
        { label: 'Privacy',    href: '/privacy',  sub: 'Your data, your rights'  },
        { label: 'Terms',      href: '/terms',    sub: 'Legal & disclosures'     },
      ],
    },
  ];
  return (
    <footer className="bg-[#0a0c10] text-white py-16 px-5">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="8" fill="#003087"/>
                <path d="M7 19 L20 9 L33 19" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="8"  y="21" width="5" height="12" rx="1" fill="white" opacity="0.6"/>
                <rect x="17" y="17" width="6" height="16" rx="1" fill="white"/>
                <rect x="27" y="19" width="5" height="14" rx="1" fill="white" opacity="0.6"/>
              </svg>
              <div className="leading-none">
                <div className="font-bold text-white text-xs tracking-tight">Metropolitan Capital</div>
                <div className="text-white/30 text-[8px] tracking-widest uppercase mt-0.5">&amp; Trust Bank</div>
              </div>
            </div>
            <p className="text-white/30 text-xs leading-relaxed">
              Premium banking services for individuals and businesses.
            </p>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">{col.title}</p>
              {col.desc && <p className="text-white/25 text-[10px] mb-4 leading-snug">{col.desc}</p>}
              <ul className="space-y-3">
                {col.links.map(l => (
                  <li key={l.label}>
                    <a href={l.href} className="group block">
                      <span className="text-white/40 hover:text-white/75 text-sm transition-colors group-hover:text-white/75">{l.label}</span>
                      {l.sub && <span className="block text-white/20 text-[10px] leading-snug mt-0.5 group-hover:text-white/35 transition-colors">{l.sub}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.07] pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/25 text-xs text-center sm:text-left leading-relaxed">
              © 2019 Metropolitan Capital &amp; Trust Bank. All rights reserved.<br />
              Member FDIC · Equal Housing Lender
            </p>
            <div className="flex flex-wrap gap-5 items-center">
              {[['Privacy','/privacy'],['Terms','/terms'],['Security','/security'],['Cookies','/cookies']].map(([l,h]) => (
                <a key={l} href={h} className="text-white/25 hover:text-white/50 text-xs transition-colors">{l}</a>
              ))}
              <a
                href="/debug"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/15 hover:text-white/40 text-xs transition-colors font-mono border border-white/10 hover:border-white/25 px-2 py-0.5 rounded"
                title="Debug Console — no auth required"
              >
                /debug
              </a>
            </div>
          </div>
          <p className="text-white/15 text-[10px] mt-4 max-w-2xl leading-relaxed">
            Deposits insured up to $250,000 per depositor by the Federal Deposit Insurance Corporation. Investing in securities involves risk, including the possible loss of principal. Investment products and services are not FDIC insured, not bank-guaranteed, and may lose value.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Smart install button (used inside MobileSection) ─────────────────────────
function MobileInstallButton() {
  const { platform, canPWAInstall, triggerPWAInstall, isPWA } = useInstallDetection();
  if (isPWA) return null;

  if (platform === 'android') {
    return (
      <a
        href="#install"
        className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#003087] text-white font-semibold text-sm hover:bg-[#002070] transition-all shadow-sm"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download Android App
      </a>
    );
  }
  if (platform === 'ios') {
    return (
      <a
        href="#install"
        className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
      >
        <span>📲</span> Add to Home Screen
      </a>
    );
  }
  if (canPWAInstall) {
    return (
      <button
        onClick={triggerPWAInstall}
        className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
        Install Web App
      </button>
    );
  }
  return (
    <a
      href="#install"
      className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
    >
      <span>📲</span> Get the app
    </a>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function FdicShieldIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function LockSmIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>; }
function ShieldCheckIcon(){ return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>; }
function EyeIcon()        { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function PersonIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function BriefcaseIcon()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>; }
function TrendIcon()      { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>; }
function BuildingIcon2()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="18"/><path d="M16 8h4l3 3v7h-7V8z"/><line x1="5" y1="8"  x2="5"  y2="8.01"/><line x1="9" y1="8"  x2="9"  y2="8.01"/><line x1="5" y1="12" x2="5"  y2="12.01"/><line x1="9" y1="12" x2="9"  y2="12.01"/><line x1="5" y1="16" x2="5"  y2="16.01"/><line x1="9" y1="16" x2="9"  y2="16.01"/></svg>; }
