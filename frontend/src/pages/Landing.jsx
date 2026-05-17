import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// ─── Scroll-reveal ────────────────────────────────────────────────────────────
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}
      style={{ opacity: on ? 1 : 0, transform: on ? 'translateY(0)' : 'translateY(24px)',
               transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const goLogin   = () => navigate('/login');
  const goSignUp  = () => navigate('/login?tab=register');

  return (
    <div className="min-h-screen bg-[#07080a] text-white overflow-x-hidden">
      <LandingNav onSignIn={goLogin} onSignUp={goSignUp} />
      <HeroSection onSignUp={goSignUp} onSignIn={goLogin} />
      <TrustStrip />
      <FeaturesSection />
      <AccountTypesSection onSignUp={goSignUp} />
      <HowItWorksSection />
      <SecuritySection />
      <TestimonialsSection />
      <FaqSection />
      <FinalCta onSignUp={goSignUp} onSignIn={goLogin} />
      <SiteFooter />

      {/* Mobile sticky bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden safe-area-bottom">
        <div className="bg-[#07080a]/96 backdrop-blur-2xl border-t border-white/[0.07] px-4 py-3 flex gap-2.5">
          <button onClick={goLogin}
            className="flex-1 py-3 rounded-xl border border-white/[0.12] text-white/60 text-sm font-medium hover:border-white/20 hover:text-white/80 transition-colors">
            Sign In
          </button>
          <button onClick={goSignUp}
            className="flex-1 py-3 rounded-xl bg-[#0072CE] hover:bg-[#005fa8] text-white text-sm font-semibold transition-colors shadow-lg">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function LandingNav({ onSignIn, onSignUp }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 28);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#07080a]/94 backdrop-blur-2xl border-b border-white/[0.07] shadow-xl shadow-black/40' : ''
    }`}>
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-8 h-8 rounded-[10px] bg-[#0072CE] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#0072CE]/30">C</div>
          <span className="font-bold text-white text-[17px] tracking-tight">CoreWallet</span>
        </div>
        <nav className="hidden md:flex items-center gap-5">
          {['Features', 'Accounts', 'Security', 'FAQ'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`}
              className="text-sm text-white/45 hover:text-white/80 font-medium transition-colors cursor-pointer">
              {l}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={onSignIn}
            className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white font-medium transition-colors">
            Sign In
          </button>
          <button onClick={onSignUp}
            className="px-5 py-2.5 rounded-xl bg-[#0072CE] hover:bg-[#005fa8] text-white text-sm font-semibold transition-all shadow-md shadow-[#0072CE]/25">
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({ onSignUp, onSignIn }) {
  return (
    <section className="relative min-h-[100svh] flex items-center pt-20 pb-32 md:pb-20 px-5 overflow-hidden">
      {/* Glows */}
      <div className="pointer-events-none absolute top-1/3 left-1/4 -translate-y-1/2 w-[520px] h-[400px] bg-[#0072CE]/[0.07] blur-[140px] rounded-full" />
      <div className="pointer-events-none absolute top-1/4 right-0 w-[320px] h-[320px] bg-[#003087]/[0.06] blur-[110px] rounded-full" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.022]"
        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)`, backgroundSize: '48px 48px' }} />

      <div className="relative max-w-6xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 xl:gap-24">

          {/* Text */}
          <div className="flex-1 min-w-0 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-[#0072CE]/10 border border-[#0072CE]/[0.25] rounded-full px-3.5 py-1.5 mb-7 animate-fade-up">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0072CE] animate-pulse" />
              <span className="text-[#60a5fa] text-[11px] font-semibold tracking-wide">Banking · Cards · Savings · Transfers</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[3.8rem] xl:text-7xl font-bold leading-[1.05] tracking-[-0.02em] mb-6 animate-fade-up" style={{ animationDelay: '0.07s' }}>
              Your money,{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #60a5fa 0%, #0072CE 100%)' }}>
                working smarter.
              </span>
            </h1>

            <p className="text-white/42 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0 animate-fade-up" style={{ animationDelay: '0.14s' }}>
              A complete digital banking platform with checking &amp; savings accounts,
              virtual cards, instant transfers, and real-time analytics — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8 animate-fade-up" style={{ animationDelay: '0.21s' }}>
              <button onClick={onSignUp}
                className="px-9 py-4 rounded-2xl bg-[#0072CE] hover:bg-[#005fa8] text-white font-semibold text-base transition-all shadow-2xl shadow-[#0072CE]/25">
                Create free account
              </button>
              <button onClick={onSignIn}
                className="px-9 py-4 rounded-2xl border border-white/10 text-white/55 hover:text-white hover:border-white/20 font-medium text-base transition-all">
                Sign in →
              </button>
            </div>

            <div className="flex items-center gap-6 justify-center lg:justify-start animate-fade-up" style={{ animationDelay: '0.28s' }}>
              {['No monthly fees', 'Instant setup', 'Bank-grade security'].map(t => (
                <div key={t} className="flex items-center gap-1.5 text-white/25 text-xs">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0072CE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phone mockup */}
          <div className="flex-shrink-0 flex justify-center animate-fade-up" style={{ animationDelay: '0.35s' }}>
            <div style={{ animation: 'hero-float 6s ease-in-out 0.85s infinite' }}>
              <HeroPhone />
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes hero-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}`}</style>
    </section>
  );
}

function HeroPhone() {
  return (
    <div className="relative w-[210px] sm:w-[250px] lg:w-[270px]">
      <div className="absolute inset-0 bg-[#0072CE]/[0.12] blur-[60px] rounded-full scale-[1.4] pointer-events-none" />
      <div className="relative bg-[#0f1117] border border-white/[0.09] rounded-[2.8rem] overflow-hidden shadow-2xl shadow-black/70" style={{ aspectRatio: '9/19.5' }}>
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-[72px] h-[18px] bg-black rounded-full z-10" />
        <div className="absolute inset-0 bg-[#07080a] pt-12 px-3.5 pb-4">
          <p className="text-white/20 text-[9px] mb-3 px-0.5">Good morning 👋</p>

          {/* Balance */}
          <div className="bg-[#0072CE]/10 border border-[#0072CE]/20 rounded-xl p-3 mb-2">
            <p className="text-white/30 text-[7px] uppercase tracking-wide mb-1">Total Balance</p>
            <p className="text-white font-bold text-lg font-mono leading-none mb-2.5">$18,240.00</p>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-[#07080a]/60 rounded-lg px-2 py-1.5">
                <p className="text-white/25 text-[6px] uppercase mb-0.5">Checking</p>
                <p className="text-white/80 font-mono text-[9px] font-semibold">$12,840.00</p>
              </div>
              <div className="bg-[#07080a]/60 rounded-lg px-2 py-1.5">
                <p className="text-white/25 text-[6px] uppercase mb-0.5">Savings</p>
                <p className="text-[#60a5fa] font-mono text-[9px] font-semibold">$5,400.00</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 mb-3">
            {['Send', 'Receive', 'Move'].map((label, i) => (
              <div key={label} className={`flex-1 py-1.5 rounded-xl text-center text-[7px] font-semibold
                ${i === 0 ? 'bg-[#0072CE]/20 text-[#60a5fa] border border-[#0072CE]/20' : 'bg-white/[0.04] text-white/25 border border-white/[0.05]'}`}>
                {label}
              </div>
            ))}
          </div>

          <p className="text-white/15 text-[7px] uppercase tracking-wide px-0.5 mb-1.5">Recent</p>
          {[{ in: true, amt: '+$1,250.00' }, { in: false, amt: '-$89.99' }, { in: false, amt: '-$34.50' }, { in: true, amt: '+$320.00' }].map((r, i) => (
            <div key={i} className="flex items-center gap-2 px-0.5 py-1.5 border-b border-white/[0.035] last:border-0">
              <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center ${r.in ? 'bg-[#0072CE]/10' : 'bg-red-500/[0.08]'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${r.in ? 'bg-[#60a5fa]' : 'bg-red-400/70'}`} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="h-1.5 bg-white/[0.08] rounded-full w-4/5" />
                <div className="h-1 bg-white/[0.04] rounded-full w-2/5" />
              </div>
              <span className={`text-[8px] font-mono font-semibold shrink-0 ${r.in ? 'text-[#60a5fa]' : 'text-white/30'}`}>{r.amt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Trust strip ──────────────────────────────────────────────────────────────
function TrustStrip() {
  const stats = [
    { value: '50K+',  label: 'Active users' },
    { value: '$10M+', label: 'Transferred'  },
    { value: '99.9%', label: 'Uptime'       },
    { value: '<1s',   label: 'Avg. transfer'},
  ];
  return (
    <section className="py-14 px-5 bg-[#0a0c10]">
      <div className="max-w-6xl mx-auto">
        <Reveal className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.05] rounded-2xl overflow-hidden">
          {stats.map(s => (
            <div key={s.label} className="bg-[#0a0c10] px-6 py-8 text-center">
              <p className="text-3xl sm:text-4xl font-bold text-[#60a5fa] font-mono mb-1">{s.value}</p>
              <p className="text-white/45 text-sm font-medium">{s.label}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '💳', title: 'Virtual Cards',        desc: 'Debit and credit cards issued instantly. Freeze, unfreeze, or replace any card in seconds.' },
  { icon: '⚡', title: 'Instant Transfers',     desc: 'Send money to any CoreWallet account in real time. No delays, no hidden fees.' },
  { icon: '🏦', title: 'Checking & Savings',   desc: 'Separate spending from saving with two accounts. Move money between them instantly.' },
  { icon: '📊', title: 'Spending Analytics',    desc: 'See where your money goes with category breakdowns and 6-month trends.' },
  { icon: '🔔', title: 'Real-time Alerts',      desc: 'Get notified for every transaction, login, and account change the moment it happens.' },
  { icon: '🔒', title: 'Bank-grade Security',   desc: 'AES-256 encryption, OTP login, transaction PIN, and session management built in.' },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 px-5 bg-[#07080a]">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-[#60a5fa] text-xs font-semibold uppercase tracking-widest mb-3">Everything you need</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">A complete banking platform</h2>
          <p className="text-white/38 mt-3 max-w-xl mx-auto text-base leading-relaxed">
            Built for people who want full control of their finances, not just another fintech app.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div className="bg-[#0d0f14] border border-white/[0.06] rounded-2xl p-6 hover:border-[#0072CE]/30 hover:bg-[#0d1220] transition-all group">
                <div className="text-2xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-white text-base mb-2">{f.title}</h3>
                <p className="text-white/38 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Account types ────────────────────────────────────────────────────────────
function AccountTypesSection({ onSignUp }) {
  return (
    <section id="accounts" className="py-20 sm:py-28 px-5 bg-[#0a0c10]">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-[#60a5fa] text-xs font-semibold uppercase tracking-widest mb-3">Account types</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Checking &amp; Savings, together</h2>
          <p className="text-white/38 mt-3 max-w-lg mx-auto text-base leading-relaxed">
            One wallet. Two accounts. Keep your spending and savings organized without juggling apps.
          </p>
        </Reveal>

        <Reveal className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Checking */}
          <div className="bg-[#0d1220] border border-[#0072CE]/20 rounded-2xl p-7">
            <div className="w-11 h-11 rounded-xl bg-[#0072CE]/10 border border-[#0072CE]/20 flex items-center justify-center text-xl mb-5">🏧</div>
            <h3 className="text-white font-bold text-xl mb-2">Checking</h3>
            <p className="text-white/40 text-sm leading-relaxed mb-6">Your everyday spending account. Linked to your virtual cards and used for all transfers and bills.</p>
            <ul className="space-y-2.5">
              {['No minimum balance', 'Instant transfers', 'Virtual debit & credit cards', 'Full transaction history'].map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-white/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0072CE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Savings */}
          <div className="bg-[#0d1a14] border border-[#1A7A4A]/20 rounded-2xl p-7">
            <div className="w-11 h-11 rounded-xl bg-[#1A7A4A]/10 border border-[#1A7A4A]/20 flex items-center justify-center text-xl mb-5">🐷</div>
            <h3 className="text-white font-bold text-xl mb-2">Savings</h3>
            <p className="text-white/40 text-sm leading-relaxed mb-6">A dedicated account to grow your balance. Move money from checking instantly whenever you want.</p>
            <ul className="space-y-2.5">
              {['Open in one click', 'Instant internal transfers', 'Separate balance display', 'Track goals separately'].map(item => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-white/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A7A4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={150} className="text-center mt-10">
          <button onClick={onSignUp}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#0072CE] hover:bg-[#005fa8] text-white font-semibold text-sm transition-all shadow-lg shadow-[#0072CE]/20">
            Open your accounts — it's free
          </button>
        </Reveal>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────
const STEPS = [
  { n: '01', title: 'Create an account',   desc: 'Register in under 60 seconds. No paperwork, no branch visit, no waiting period.' },
  { n: '02', title: 'Verify your identity', desc: 'Confirm with a one-time code sent to your email. Your session is secured from the start.' },
  { n: '03', title: 'Fund your wallet',     desc: 'Admin-credited onboarding balance or receive your first transfer. Funds appear instantly.' },
  { n: '04', title: 'Spend & save',         desc: 'Issue virtual cards, send money, open savings, and track everything from the dashboard.' },
];

function HowItWorksSection() {
  return (
    <section className="py-20 sm:py-28 px-5 bg-[#07080a]">
      <div className="max-w-4xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-[#60a5fa] text-xs font-semibold uppercase tracking-widest mb-3">Simple by design</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Up and running in minutes</h2>
        </Reveal>
        <div className="space-y-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div className="flex gap-5 bg-[#0d0f14] border border-white/[0.06] rounded-2xl p-6 hover:border-[#0072CE]/20 transition-all">
                <span className="text-[#0072CE]/40 font-mono text-2xl font-bold shrink-0 select-none">{s.n}</span>
                <div>
                  <h3 className="font-semibold text-white mb-1.5">{s.title}</h3>
                  <p className="text-white/38 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Security ─────────────────────────────────────────────────────────────────
const SEC_BADGES = [
  { icon: '🔐', label: 'AES-256 Encryption',      desc: 'Card numbers and sensitive data encrypted at rest' },
  { icon: '📱', label: 'OTP Login',               desc: 'Every sign-in confirmed with a one-time code' },
  { icon: '🔑', label: 'Transaction PIN',          desc: 'PIN required to view full card details' },
  { icon: '📋', label: 'Immutable Ledger',         desc: 'Transactions cannot be altered — only soft-deleted' },
  { icon: '⏱️', label: 'Session Management',      desc: 'Choose persistent or session-only login tokens' },
  { icon: '🚨', label: 'Real-time Alerts',         desc: 'Instant notifications for every login and transfer' },
];

function SecuritySection() {
  return (
    <section id="security" className="py-20 sm:py-28 px-5 bg-[#0a0c10]">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-[#60a5fa] text-xs font-semibold uppercase tracking-widest mb-3">Security first</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Your money is protected</h2>
          <p className="text-white/38 mt-3 max-w-lg mx-auto text-base leading-relaxed">
            Every layer of CoreWallet is built with security in mind, from the database to your browser.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SEC_BADGES.map((b, i) => (
            <Reveal key={b.label} delay={i * 50}>
              <div className="bg-[#0d0f14] border border-white/[0.06] rounded-xl p-5 flex gap-4">
                <span className="text-2xl shrink-0 mt-0.5">{b.icon}</span>
                <div>
                  <p className="font-medium text-white text-sm mb-1">{b.label}</p>
                  <p className="text-white/35 text-xs leading-relaxed">{b.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Secure connection strip */}
        <Reveal delay={200} className="mt-8 bg-[#0d1220] border border-[#0072CE]/15 rounded-xl px-5 py-3.5 flex items-center gap-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0072CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <span className="text-[#60a5fa] text-xs font-medium">Secure · TLS encrypted · HTTPS-only connection</span>
          <span className="ml-auto text-white/20 text-[10px] font-mono">256-bit SSL</span>
        </Reveal>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Sarah M.',  role: 'Freelancer',         text: 'CoreWallet made it so easy to separate my business spending from savings. The virtual cards are a game changer.' },
  { name: 'James K.',  role: 'Small business owner', text: 'The instant transfer speed is unreal. I can move money and see it reflected in under a second.' },
  { name: 'Priya R.',  role: 'Student',             text: 'I finally have one place to track everything. The transaction categories in analytics are super useful.' },
];

function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-28 px-5 bg-[#07080a]">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-12">
          <p className="text-[#60a5fa] text-xs font-semibold uppercase tracking-widest mb-3">What people say</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Trusted by thousands</h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <div className="bg-[#0d0f14] border border-white/[0.06] rounded-2xl p-6">
                <p className="text-[#0072CE] text-lg mb-3">"</p>
                <p className="text-white/60 text-sm leading-relaxed mb-5">{t.text}</p>
                <div className="flex items-center gap-3 border-t border-white/[0.05] pt-4">
                  <div className="w-8 h-8 rounded-full bg-[#0072CE]/20 flex items-center justify-center text-[#60a5fa] text-xs font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">{t.name}</p>
                    <p className="text-white/30 text-[10px]">{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Is CoreWallet a real bank?', a: 'CoreWallet is a financial technology platform, not an FDIC-insured bank. Banking services are simulated for demonstration purposes. In a production deployment, they would be facilitated by licensed banking partners.' },
  { q: 'Are there any fees?', a: 'No. There are no monthly fees, no transfer fees, and no minimum balance requirements for either checking or savings accounts.' },
  { q: 'How are my card numbers protected?', a: 'Card numbers are encrypted with AES-256-GCM at the database level. Viewing full card details requires entering your transaction PIN, and the number is never logged or stored in plain text.' },
  { q: 'Can I have both a checking and savings account?', a: 'Yes. Every user starts with a checking account. You can open a savings account from the dashboard with a single click — it appears immediately.' },
  { q: 'What happens if I lose access to my account?', a: 'Use the Forgot Password flow from the login page. A reset link is sent to your registered email. If you need further help, open a support ticket from within the app.' },
];

function FaqSection() {
  const [open, setOpen] = useState(null);
  return (
    <section id="faq" className="py-20 sm:py-28 px-5 bg-[#0a0c10]">
      <div className="max-w-3xl mx-auto">
        <Reveal className="text-center mb-12">
          <p className="text-[#60a5fa] text-xs font-semibold uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Common questions</h2>
        </Reveal>
        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <Reveal key={i} delay={i * 40}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left bg-[#0d0f14] border border-white/[0.06] rounded-xl px-5 py-4 hover:border-[#0072CE]/20 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white text-sm font-medium">{f.q}</span>
                  <svg className={`shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                {open === i && (
                  <p className="text-white/45 text-sm leading-relaxed mt-3 pr-4">{f.a}</p>
                )}
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCta({ onSignUp, onSignIn }) {
  return (
    <section className="py-20 sm:py-28 px-5 bg-[#07080a] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[300px] bg-[#0072CE]/[0.06] blur-[100px] rounded-full" />
      </div>
      <Reveal className="relative max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-[#0072CE]/10 border border-[#0072CE]/20 rounded-full px-3.5 py-1.5 mb-6">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0072CE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span className="text-[#60a5fa] text-[11px] font-medium">Free to join — open in 60 seconds</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5 leading-[1.1]">
          Take control of your<br />
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg,#60a5fa,#0072CE)' }}>
            financial life today.
          </span>
        </h2>

        <p className="text-white/38 text-base leading-relaxed mb-9 max-w-md mx-auto">
          Join thousands of people already using CoreWallet to send money, manage cards, and stay on top of their finances.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <button onClick={onSignUp}
            className="px-9 py-4 rounded-2xl bg-[#0072CE] hover:bg-[#005fa8] text-white font-semibold text-base transition-all shadow-2xl shadow-[#0072CE]/20">
            Create free account
          </button>
          <button onClick={onSignIn}
            className="px-9 py-4 rounded-2xl border border-white/10 text-white/55 hover:text-white hover:border-white/20 font-medium text-base transition-all">
            I already have an account
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-white/22 text-xs">
          {['256-bit encryption', 'No hidden fees', 'Instant setup', 'Cancel anytime'].map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function SiteFooter() {
  return (
    <footer className="bg-[#050607] border-t border-white/[0.05] pb-28 md:pb-0">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex items-center justify-between py-8 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5 select-none">
            <div className="w-8 h-8 rounded-[10px] bg-[#0072CE] flex items-center justify-center font-bold text-sm text-white">C</div>
            <span className="font-bold text-white text-[17px] tracking-tight">CoreWallet</span>
          </div>
          <span className="hidden sm:block text-white/22 text-xs">Financial technology for everyone.</span>
        </div>

        <nav className="border-b border-white/[0.05]">
          {[
            { label: 'Legal',           to: '/legal'   },
            { label: 'Privacy Notice',  to: '/privacy' },
            { label: 'Terms of Service',to: '/terms'   },
            { label: 'Security',        to: '/security'},
          ].map(({ label, to }) => (
            <Link key={to} to={to}
              className="flex items-center justify-between py-4 border-b border-white/[0.05] last:border-0
                         text-white/50 hover:text-white text-lg font-medium transition-colors group">
              <span>{label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                className="text-white/18 group-hover:text-white/45 group-hover:translate-x-0.5 transition-all">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          ))}
        </nav>

        <div className="py-8">
          <p className="text-white/22 text-xs leading-relaxed">
            CoreWallet is a financial technology platform and is not an FDIC-insured bank. Virtual accounts and
            banking services are provided for demonstration purposes. Funds, transfers, and card operations shown
            are simulated within the CoreWallet platform and do not represent real financial instruments.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-5 border-t border-white/[0.05]">
          <p className="text-white/18 text-xs order-2 sm:order-1">© 2025 CoreWallet, Inc. All rights reserved.</p>
          <div className="flex items-center gap-5 order-1 sm:order-2">
            {['Terms', 'Privacy', 'Security', 'Cookies'].map(l => (
              <Link key={l} to={`/${l.toLowerCase()}`}
                className="text-white/22 hover:text-white/55 text-xs transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
