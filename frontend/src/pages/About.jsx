import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';

function MCTLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="9" fill="#003087"/>
      <path d="M7 19 L20 9 L33 19" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="8"  y="21" width="5" height="12" rx="1" fill="white" opacity="0.6"/>
      <rect x="17" y="17" width="6" height="16" rx="1" fill="white"/>
      <rect x="27" y="19" width="5" height="14" rx="1" fill="white" opacity="0.6"/>
    </svg>
  );
}

export default function About() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));

  const values = [
    {
      title: 'Integrity',
      desc: 'We hold ourselves to the highest ethical standards in every interaction, every transaction, and every decision.',
    },
    {
      title: 'Security',
      desc: 'Your financial safety is our foremost responsibility. We apply bank-grade protection to every account, every day.',
    },
    {
      title: 'Transparency',
      desc: 'No hidden fees, no fine print surprises. Our terms, rates, and policies are written to be understood.',
    },
    {
      title: 'Innovation',
      desc: 'We combine the reliability of traditional banking with the speed and convenience of modern technology.',
    },
  ];

  const milestones = [
    { year: '1994', label: 'Founded', desc: 'Metropolitan Capital & Trust Bank established in Delaware.' },
    { year: '2005', label: 'FDIC Membership', desc: 'Full FDIC insurance coverage secured for all deposit accounts.' },
    { year: '2018', label: 'Digital Banking', desc: 'Launch of online and mobile banking platform.' },
    { year: '2024', label: 'MCT Bank App', desc: 'Full-featured banking app with real-time transfers and analytics.' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav — public only */}
      {!user && (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 select-none">
              <MCTLogo />
              <div className="leading-none">
                <div className="font-bold text-navy text-xs tracking-tight leading-none">Metropolitan Capital</div>
                <div className="text-gray-400 text-[8px] tracking-widest uppercase leading-none mt-0.5">&amp; Trust Bank</div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm text-gray-600 hover:text-navy font-medium transition-colors">Sign In</button>
              <button onClick={() => navigate('/login?tab=register')} className="px-5 py-2 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-[#002066] transition-all">Open Account</button>
            </div>
          </div>
        </header>
      )}

      {/* Hero */}
      <section className="bg-navy py-20 px-5">
        <div className="max-w-4xl mx-auto text-center">
          {!user && (
            <button onClick={goBack} className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
          )}
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">About Us</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-5">
            Banking Built on Trust
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-2xl mx-auto">
            Metropolitan Capital &amp; Trust Bank has served individuals, families, and businesses with integrity, security, and innovation for over three decades.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-navy font-semibold text-sm tracking-widest uppercase mb-3">Our Mission</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-5 tracking-tight">
                Where Capital Meets Trust
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                MCT Bank was founded on a single principle: that every customer deserves access to premium banking services backed by genuine care, transparency, and institutional-grade security.
              </p>
              <p className="text-gray-500 leading-relaxed">
                We combine decades of banking expertise with modern technology to deliver a seamless, secure, and empowering financial experience for every account holder.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '$2.8B+', label: 'Assets Under Management' },
                { value: '127K+',  label: 'Clients Served' },
                { value: '30+',    label: 'Years of Service' },
                { value: 'FDIC',   label: 'Insured & Regulated' },
              ].map(s => (
                <div key={s.label} className="bg-navy/5 rounded-2xl p-5 text-center">
                  <p className="text-2xl font-bold text-navy font-mono mb-1">{s.value}</p>
                  <p className="text-gray-500 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-5 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-navy font-semibold text-sm tracking-widest uppercase mb-3">Our Values</p>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">What We Stand For</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {values.map(v => (
              <div key={v.title} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <h3 className="text-navy font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-navy font-semibold text-sm tracking-widest uppercase mb-3">Our History</p>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">30 Years of Excellence</h2>
          </div>
          <div className="space-y-4">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="shrink-0 w-16 text-right">
                  <span className="text-navy font-bold text-sm font-mono">{m.year}</span>
                </div>
                <div className="w-px bg-gray-200 self-stretch" />
                <div className="pb-6">
                  <p className="text-gray-900 font-semibold text-sm mb-1">{m.label}</p>
                  <p className="text-gray-500 text-sm">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regulatory */}
      <section className="py-12 px-5 bg-navy">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/40 text-xs leading-relaxed max-w-2xl mx-auto">
            Metropolitan Capital &amp; Trust Bank is a federally regulated banking institution. All deposit accounts are insured by the FDIC up to $250,000 per depositor. Member FDIC · Equal Housing Lender.
            &nbsp;<Link to="/licenses" className="text-white/60 hover:text-white underline">View Regulatory Licenses</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0c10] py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-xs">© {new Date().getFullYear()} Metropolitan Capital &amp; Trust Bank. All rights reserved.</p>
          <div className="flex gap-5">
            {[['Privacy','/privacy'],['Terms','/terms'],['Security','/security'],['Contact','/contact']].map(([l,h]) => (
              <Link key={l} to={h} className="text-white/25 hover:text-white/50 text-xs transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
