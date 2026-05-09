import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FeatureOverlay from '../components/landing/FeatureOverlay';

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setOn(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    on ? 1 : 0,
        transform:  on ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const [overlayOpen, setOverlayOpen] = useState(false);

  const goIn    = () => navigate('/login');
  const goUp    = () => navigate('/register');
  const explore = () => setOverlayOpen(true);
  const close   = () => setOverlayOpen(false);

  return (
    <div className="min-h-screen bg-[#0a0b0a] text-white overflow-x-hidden">
      <LandingNav onSignIn={goIn} onSignUp={goUp} onExplore={explore} />
      <HeroSection onSignIn={goIn} onSignUp={goUp} onExplore={explore} />
      <StatsStrip />
      <FinalCta onSignUp={goUp} onSignIn={goIn} />
      <SiteFooter />

      {/* Sticky mobile bar — hidden on md+ and when overlay is open */}
      {!overlayOpen && (
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden">
        <div className="bg-[#0a0b0a]/95 backdrop-blur-2xl border-t border-white/[0.07] px-4 py-3 flex gap-2.5">
          <button
            onClick={explore}
            className="flex-1 py-3 rounded-xl border border-white/[0.12] text-white/60 text-sm font-medium
                       hover:border-white/20 hover:text-white/80 transition-colors"
          >
            Explore
          </button>
          <button
            onClick={goUp}
            className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold
                       transition-colors shadow-lg shadow-emerald-500/20"
          >
            Get Started
          </button>
        </div>
      </div>
      )}

      <FeatureOverlay
        open={overlayOpen}
        onClose={close}
        onSignUp={goUp}
        onSignIn={goIn}
      />
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function LandingNav({ onSignIn, onSignUp, onExplore }) {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 28);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0b0a]/92 backdrop-blur-2xl border-b border-white/[0.07] shadow-xl shadow-black/40'
          : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-8 h-8 rounded-[10px] bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-500/30">
            C
          </div>
          <span className="font-bold text-white text-[17px] tracking-tight">CoreWallet</span>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={onExplore}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white/45 hover:text-white/80
                       hover:bg-white/[0.05] font-medium transition-all duration-150"
          >
            <GridIcon />
            Explore
          </button>
          <button
            onClick={onSignIn}
            className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white font-medium transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onSignUp}
            className="ml-1 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.97]
                       text-white text-sm font-semibold transition-all duration-150
                       shadow-md shadow-emerald-500/25"
          >
            Get Started
          </button>
        </div>

        {/* Mobile: grid icon opens overlay */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={onSignIn}
            className="px-3 py-1.5 text-sm text-white/45 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onExplore}
            aria-label="Explore features"
            className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08]
                       flex items-center justify-center text-white/60 hover:text-white
                       transition-all duration-150"
          >
            <GridIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Hero phone float keyframe ────────────────────────────────────────────────
function ensureHeroFloat() {
  if (document.getElementById('cw-hero-float')) return;
  const s = document.createElement('style');
  s.id = 'cw-hero-float';
  s.textContent = '@keyframes hero-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}';
  document.head.appendChild(s);
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection({ onSignIn, onSignUp, onExplore }) {
  useEffect(() => { ensureHeroFloat(); }, []);

  return (
    <section className="relative min-h-[100svh] flex items-center pt-20 pb-32 md:pb-20 lg:pb-16 px-4 sm:px-6 overflow-hidden">

      {/* Background glows */}
      <div className="pointer-events-none absolute top-1/3 left-1/4 -translate-y-1/2
                      w-[500px] h-[380px] bg-emerald-500/[0.065] blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute top-1/4 right-0
                      w-[320px] h-[320px] bg-emerald-500/[0.04] blur-[110px] rounded-full" />
      <div className="pointer-events-none absolute bottom-1/3 left-0
                      w-[240px] h-[240px] bg-[#6366f1]/[0.04] blur-[100px] rounded-full" />

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Two-column layout */}
      <div className="relative max-w-6xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-14 xl:gap-20">

          {/* ── Left: text ── */}
          <div className="flex-1 min-w-0 text-center lg:text-left">

            {/* Live badge */}
            <div
              className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/[0.22]
                         rounded-full px-3.5 py-1.5 mb-7 animate-fade-up"
              style={{ animationDelay: '0s' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
              <span className="text-emerald-400 text-[11px] font-semibold tracking-wide">
                Live · Instant transfers · No fees
              </span>
            </div>

            {/* Headline */}
            <h1
              className="text-5xl sm:text-6xl lg:text-[3.6rem] xl:text-7xl font-bold leading-[1.06]
                         tracking-[-0.02em] mb-6 animate-fade-up"
              style={{ animationDelay: '0.07s' }}
            >
              Your money,
              <br />
              <span
                className="text-emerald-400"
                style={{ textShadow: '0 0 80px rgba(16,185,129,0.35)' }}
              >
                moving smarter.
              </span>
            </h1>

            {/* Subtext */}
            <p
              className="text-white/42 text-lg sm:text-xl leading-relaxed mb-10
                         max-w-xl mx-auto lg:mx-0 animate-fade-up"
              style={{ animationDelay: '0.14s' }}
            >
              Send, receive, and manage your finances from one beautifully
              simple wallet. Instant transfers, virtual cards, and real-time
              balance — always in your pocket.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8 animate-fade-up"
              style={{ animationDelay: '0.21s' }}
            >
              <button
                onClick={onSignUp}
                className="px-9 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.97]
                           text-white font-semibold text-base transition-all duration-150
                           shadow-2xl shadow-emerald-500/25"
              >
                Create free account
              </button>
              <button
                onClick={onSignIn}
                className="px-9 py-4 rounded-2xl border border-white/10 text-white/55 hover:text-white
                           hover:border-white/20 font-medium text-base transition-all duration-150"
              >
                Sign in →
              </button>
            </div>

            {/* Explore CTA */}
            <div className="animate-fade-up" style={{ animationDelay: '0.28s' }}>
              <button
                onClick={onExplore}
                className="inline-flex items-center gap-2 text-white/30 hover:text-emerald-400
                           text-sm font-medium transition-colors duration-200 group"
              >
                <GridIcon size={14} />
                <span>Explore features</span>
                <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
              </button>
            </div>
          </div>

          {/* ── Right: phone ── */}
          <div
            className="flex-shrink-0 flex justify-center animate-fade-up"
            style={{ animationDelay: '0.35s' }}
          >
            {/* Float loop starts after fade-in settles */}
            <div style={{ animation: 'hero-float 6s ease-in-out 0.85s infinite' }}>
              {/* On mobile: peek crop with fade-out at bottom. Full on lg+. */}
              <div className="relative overflow-hidden max-h-[280px] sm:max-h-[380px] lg:max-h-none">
                <HeroPhone />
                <div className="lg:hidden absolute bottom-0 inset-x-0 h-16
                                bg-gradient-to-t from-[#0a0b0a] to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Scroll chevron — mobile only */}
      <div className="absolute bottom-9 left-1/2 -translate-x-1/2 text-white/15 animate-bounce lg:hidden">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </section>
  );
}

// ─── Hero phone mockup ────────────────────────────────────────────────────────
function HeroPhone() {
  return (
    <div className="relative w-[200px] sm:w-[250px] lg:w-[270px]">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-emerald-500/[0.10] blur-[60px] rounded-full scale-[1.4] pointer-events-none" />
      {/* Outer ring */}
      <div className="absolute inset-[-16px] rounded-[3.2rem] border border-white/[0.035] pointer-events-none" />

      <div
        className="relative bg-[#131613] border border-white/[0.09] rounded-[2.8rem]
                   overflow-hidden shadow-2xl shadow-black/70"
        style={{ aspectRatio: '9/19.5' }}
      >
        {/* Dynamic island */}
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-[72px] h-[18px] bg-black rounded-full z-10" />

        {/* Screen */}
        <div className="absolute inset-0 bg-[#0a0b0a] pt-12 px-3.5 pb-4">
          <p className="text-white/20 text-[9px] mb-3 px-0.5">Good morning, Alex 👋</p>

          {/* Balance card */}
          <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 mb-2.5">
            <p className="text-white/20 text-[7px] uppercase tracking-wide mb-1">Total Balance</p>
            <p className="text-white font-bold text-lg font-mono leading-none mb-2">$12,450.00</p>
            <div className="flex items-center gap-1.5 bg-white/[0.03] rounded-lg px-2 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-emerald-400 text-[8px] font-mono">$12,450.00 available</span>
            </div>
          </div>

          {/* Quick action pills */}
          <div className="flex gap-1.5 mb-3">
            {['Send', 'Receive', 'History'].map((label, i) => (
              <div
                key={label}
                className={`flex-1 py-2 rounded-xl text-center text-[7px] font-semibold
                  ${i === 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                    : 'bg-white/[0.04] text-white/25 border border-white/[0.05]'
                  }`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Recent header */}
          <p className="text-white/15 text-[7px] uppercase tracking-wide px-0.5 mb-1.5">Recent</p>

          {/* Transaction rows */}
          {[
            { inc: true,  amt: '+$850.00' },
            { inc: false, amt: '-$24.99'  },
            { inc: true,  amt: '+$12.50'  },
            { inc: false, amt: '-$60.00'  },
          ].map((row, i) => (
            <div key={i} className="flex items-center gap-2 px-0.5 py-1.5 border-b border-white/[0.035] last:border-0">
              <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center
                              ${row.inc ? 'bg-emerald-500/10' : 'bg-red-500/[0.08]'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${row.inc ? 'bg-emerald-400' : 'bg-red-400/70'}`} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="h-1.5 bg-white/[0.08] rounded-full w-4/5" />
                <div className="h-1 bg-white/[0.04] rounded-full w-2/5" />
              </div>
              <span className={`text-[8px] font-mono font-semibold shrink-0
                               ${row.inc ? 'text-emerald-400' : 'text-white/30'}`}>
                {row.amt}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Stats strip ─────────────────────────────────────────────────────────────
const STATS = [
  { value: '50K+',  label: 'Active users',        sub: 'and growing' },
  { value: '$10M+', label: 'Transferred',          sub: 'this year' },
  { value: '99.9%', label: 'Uptime',               sub: 'always on' },
  { value: '<1s',   label: 'Avg. transfer time',   sub: 'no waiting' },
];

function StatsStrip() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-[#0d0f0d]">
      <div className="max-w-6xl mx-auto">
        <Reveal className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.05] rounded-2xl overflow-hidden">
          {STATS.map(s => (
            <div key={s.label} className="bg-[#0d0f0d] px-6 py-8 text-center group">
              <p className="text-3xl sm:text-4xl font-bold text-emerald-400 font-display mb-1 tracking-tight">
                {s.value}
              </p>
              <p className="text-white/50 text-sm font-medium">{s.label}</p>
              <p className="text-white/20 text-[11px] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCta({ onSignUp, onSignIn }) {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 bg-[#0a0b0a] relative overflow-hidden">
      {/* Ambient center glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[480px] h-[280px] bg-emerald-500/[0.055] blur-[100px] rounded-full" />
      </div>

      <Reveal className="relative max-w-2xl mx-auto text-center">
        <div
          className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20
                     rounded-full px-3.5 py-1.5 mb-6"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span className="text-emerald-400 text-[11px] font-medium">Free to join — open in seconds</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-5 leading-[1.1]">
          Take control of your
          <br />
          <span className="text-emerald-400">financial life today.</span>
        </h2>

        <p className="text-white/38 text-base leading-relaxed mb-9 max-w-md mx-auto">
          Join thousands of people already using CoreWallet to send money,
          manage cards, and stay on top of their finances.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <button
            onClick={onSignUp}
            className="px-9 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.97]
                       text-white font-semibold text-base transition-all duration-150
                       shadow-2xl shadow-emerald-500/20"
          >
            Create free account
          </button>
          <button
            onClick={onSignIn}
            className="px-9 py-4 rounded-2xl border border-white/10 text-white/55 hover:text-white
                       hover:border-white/20 font-medium text-base transition-all duration-150"
          >
            I already have an account
          </button>
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-white/22 text-xs">
          {['256-bit encryption', 'No hidden fees', 'Cancel anytime', 'FDIC-aware'].map(t => (
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
const FOOTER_NAV = [
  { label: 'Status',            to: '/status'          },
  { label: 'Legal',             to: '/legal'           },
  { label: 'Licenses',          to: '/licenses'        },
  { label: 'Privacy Notice',    to: '/privacy'         },
  { label: 'Privacy Choices',   to: '/privacy-choices' },
];

const FOOTER_BOTTOM = [
  { label: 'Terms',     to: '/terms'    },
  { label: 'Security',  to: '/security' },
  { label: 'Cookies',   to: '/cookies'  },
  { label: 'Privacy',   to: '/privacy'  },
];

function SiteFooter() {
  return (
    <footer className="bg-[#080909] border-t border-white/[0.05] pb-28 md:pb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Brand row */}
        <div className="flex items-center justify-between py-8 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5 select-none">
            <div className="w-8 h-8 rounded-[10px] bg-emerald-500 flex items-center justify-center
                            font-bold text-sm text-white shadow-md shadow-emerald-500/20">
              C
            </div>
            <span className="font-bold text-white text-[17px] tracking-tight">CoreWallet</span>
          </div>
          <span className="hidden sm:block text-white/22 text-xs">
            Financial technology for everyone.
          </span>
        </div>

        {/* Primary nav links */}
        <nav aria-label="Footer navigation" className="border-b border-white/[0.05]">
          {FOOTER_NAV.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between py-4 sm:py-5
                         border-b border-white/[0.05] last:border-0
                         text-white/50 hover:text-white
                         text-[17px] sm:text-xl font-medium
                         transition-colors duration-150 group"
            >
              <span>{label}</span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                className="text-white/18 group-hover:text-white/45
                           group-hover:translate-x-0.5 transition-all duration-150 shrink-0"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </nav>

        {/* Legal disclaimer */}
        <div className="py-8 space-y-4">
          <p className="text-white/22 text-xs leading-relaxed">
            CoreWallet is a financial technology platform and is not an FDIC-insured bank. Virtual
            accounts and banking services are facilitated through our licensed banking partners.
            Visa® Prepaid Debit Cards are issued by partner financial institutions pursuant to a
            license from Visa U.S.A. Inc. CoreWallet does not directly hold, lend, or invest
            customer deposits.
          </p>
          <p className="text-white/22 text-xs leading-relaxed">
            Funds stored in your CoreWallet account may be eligible for pass-through FDIC insurance
            up to applicable limits, subject to the terms of your account agreement and the policies
            of our licensed banking partners. Transfer availability, transaction limits, and fees
            may vary based on account type, jurisdiction, and eligibility. Not all features
            described on this site are available in all regions.
          </p>
          <p className="text-white/22 text-xs leading-relaxed">
            By registering or using CoreWallet services, you agree to our{' '}
            <Link to="/terms" className="text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors">
              Terms of Service
            </Link>
            ,{' '}
            <Link to="/privacy" className="text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors">
              Privacy Notice
            </Link>
            , and any applicable supplemental terms. CoreWallet and the CoreWallet logotype are
            registered trademarks. All other product names referenced herein are the property of
            their respective owners.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3
                        py-5 border-t border-white/[0.05]">
          <p className="text-white/18 text-xs order-2 sm:order-1">
            © 2018 CoreWallet, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-5 order-1 sm:order-2">
            {FOOTER_BOTTOM.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className="text-white/22 hover:text-white/55 text-xs transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function GridIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <rect x="1"  y="1"  width="5.5" height="5.5" rx="1.2"/>
      <rect x="9.5" y="1"  width="5.5" height="5.5" rx="1.2"/>
      <rect x="1"  y="9.5" width="5.5" height="5.5" rx="1.2"/>
      <rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1.2"/>
    </svg>
  );
}
