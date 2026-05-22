import { useState } from 'react';
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

export default function Contact() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/'));

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulated form submission — replace with real endpoint when available
    await new Promise(r => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
  };

  const channels = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      title: 'Email Support',
      detail: 'support@mctbank.online',
      note: 'Response within 1 business day',
      href: 'mailto:support@mctbank.online',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      ),
      title: 'In-App Support',
      detail: 'Open a support ticket',
      note: 'Available 24/7 for account holders',
      href: user ? '/support' : '/login',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      title: 'Security Issues',
      detail: 'security@mctbank.online',
      note: 'For vulnerability reports only',
      href: 'mailto:security@mctbank.online',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <path d="M8 21h8M12 17v4"/>
        </svg>
      ),
      title: 'Compliance & Legal',
      detail: 'compliance@mctbank.online',
      note: 'For regulatory inquiries',
      href: 'mailto:compliance@mctbank.online',
    },
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
      <section className="bg-navy py-16 px-5">
        <div className="max-w-4xl mx-auto text-center">
          {!user && (
            <button onClick={goBack} className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back
            </button>
          )}
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">Contact Us</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">We're Here to Help</h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-xl mx-auto">
            Reach out to our team for account support, compliance inquiries, or security reports.
          </p>
        </div>
      </section>

      {/* Channels */}
      <section className="py-16 px-5 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-5 mb-16">
            {channels.map(c => (
              <a key={c.title} href={c.href}
                className="flex items-start gap-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-navy/20 hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center text-navy shrink-0 group-hover:bg-navy group-hover:text-white transition-all">
                  {c.icon}
                </div>
                <div>
                  <p className="text-gray-900 font-semibold text-sm mb-0.5">{c.title}</p>
                  <p className="text-navy text-sm font-medium mb-1">{c.detail}</p>
                  <p className="text-gray-400 text-xs">{c.note}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Contact form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Send a Message</h2>

            {sent ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p className="text-gray-900 font-semibold text-lg mb-2">Message Sent</p>
                <p className="text-gray-500 text-sm">We'll respond to <strong>{form.email}</strong> within one business day.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={update('name')}
                      placeholder="Jane Smith"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={update('email')}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
                  <select
                    value={form.subject}
                    onChange={update('subject')}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 transition-colors"
                  >
                    <option value="">Select a topic…</option>
                    <option value="account">Account Support</option>
                    <option value="transaction">Transaction Inquiry</option>
                    <option value="security">Security Concern</option>
                    <option value="compliance">Compliance / Legal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Message</label>
                  <textarea
                    value={form.message}
                    onChange={update('message')}
                    placeholder="Describe your question or issue…"
                    required
                    rows={5}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20 transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-navy text-white font-semibold text-sm hover:bg-[#002066] disabled:opacity-60 transition-all"
                >
                  {loading ? 'Sending…' : 'Send Message'}
                </button>
                <p className="text-gray-400 text-xs text-center">
                  For urgent security issues, email <a href="mailto:security@mctbank.online" className="text-navy hover:underline">security@mctbank.online</a> directly.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0c10] py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-xs">© {new Date().getFullYear()} Metropolitan Capital &amp; Trust Bank. All rights reserved.</p>
          <div className="flex gap-5">
            {[['Privacy','/privacy'],['Terms','/terms'],['Security','/security'],['About','/about']].map(([l,h]) => (
              <Link key={l} to={h} className="text-white/25 hover:text-white/50 text-xs transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
