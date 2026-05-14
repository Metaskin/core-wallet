import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth }                         from './store/authStore';
import { NotificationProvider }                          from './store/notificationStore';
import TopNav            from './components/layout/TopNav';
import BottomNav         from './components/layout/BottomNav';
import NotificationPanel from './components/notifications/NotificationPanel';
import Dashboard         from './pages/Dashboard';
import Cards             from './pages/Cards';
import Transactions      from './pages/Transactions';
import Analytics         from './pages/Analytics';
import AdminUsers        from './pages/AdminUsers';
import Settings          from './pages/Settings';
import Support           from './pages/Support';
import SupportTicket     from './pages/SupportTicket';
import Login             from './pages/Login';
import Landing           from './pages/Landing';
import LegalPage         from './pages/LegalPage';

// ── Desktop sidebar nav ───────────────────────────────────────────────────────
const NAV = [
  { to: '/',             label: 'Dashboard', icon: <IconHome />,      end: true },
  { to: '/cards',        label: 'Cards',     icon: <IconCard /> },
  { to: '/transactions', label: 'History',   icon: <IconHistory /> },
  { to: '/analytics',   label: 'Analytics', icon: <IconAnalytics /> },
  { to: '/settings',     label: 'Settings',  icon: <IconSettings /> },
  { to: '/support',      label: 'Support',   icon: <IconSupport /> },
];
const ADMIN_NAV = [
  { to: '/admin/users',        label: 'Users',         icon: <IconUsers /> },
  { to: '/admin/transactions', label: 'All Transfers',  icon: <IconTransfer /> },
];

// ── Public shell ──────────────────────────────────────────────────────────────
function PublicShell() {
  return (
    <Routes>
      <Route path="/"                element={<Landing />} />
      <Route path="/login"           element={<Login />} />
      <Route path="/register"        element={<Navigate to="/login?tab=register" replace />} />
      <Route path="/status"          element={<LegalPage slug="status" />} />
      <Route path="/legal"           element={<LegalPage slug="legal" />} />
      <Route path="/licenses"        element={<LegalPage slug="licenses" />} />
      <Route path="/privacy"         element={<LegalPage slug="privacy" />} />
      <Route path="/privacy-choices" element={<LegalPage slug="privacy-choices" />} />
      <Route path="/terms"           element={<LegalPage slug="terms" />} />
      <Route path="/security"        element={<LegalPage slug="security" />} />
      <Route path="/cookies"         element={<LegalPage slug="cookies" />} />
      <Route path="*"                element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// ── Authenticated shell ───────────────────────────────────────────────────────
function AuthenticatedShell({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">

      {/* Top navigation */}
      <TopNav onMenuToggle={() => setMenuOpen(v => !v)} />

      {/* ── Desktop sidebar (fixed, below header + security strip) ─────────── */}
      <aside className="hidden md:flex flex-col fixed top-24 left-0 bottom-0 w-60 bg-white border-r border-gray-200 z-30 overflow-y-auto">
        <nav className="flex-1 p-3 space-y-0.5 pt-4">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#EEF4FF] text-navy'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <span className="shrink-0">{icon}</span>
              {label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <>
              <p className="section-label px-3 pt-5 pb-1">Admin</p>
              {ADMIN_NAV.map(({ to, label, icon }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#EEF4FF] text-navy'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <span className="shrink-0">{icon}</span>
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Bottom user info strip */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: user?.avatarColor || '#003087' }}
            >
              {user?.avatarInitials || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 text-xs font-semibold truncate">{user?.fullName}</p>
              <p className="text-gray-400 text-[10px] truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-card-lg flex flex-col
                    transition-transform duration-300 ease-in-out md:hidden
                    ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="font-bold text-navy text-lg tracking-tight">CoreWallet</span>
          </div>
          <button onClick={closeMenu} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <XIcon />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 pt-3 overflow-y-auto">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={closeMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-[#EEF4FF] text-navy' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span className="shrink-0">{icon}</span>
              {label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <>
              <p className="section-label px-3 pt-4 pb-1">Admin</p>
              {ADMIN_NAV.map(({ to, label, icon }) => (
                <NavLink key={to} to={to} onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive ? 'bg-[#EEF4FF] text-navy' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <span className="shrink-0">{icon}</span>
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </aside>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      {/* pt-14 clears mobile header (56px); md:pt-24 clears header+strip (96px) */}
      {/* md:ml-60 shifts right of desktop sidebar (240px)                       */}
      <main className="md:ml-60 pt-14 md:pt-24 pb-20 md:pb-0 min-h-screen">
        <Routes>
          <Route path="/"                  element={<Dashboard />} />
          <Route path="/cards"             element={<Cards />} />
          <Route path="/transactions"      element={<Transactions />} />
          <Route path="/analytics"         element={<Analytics />} />
          <Route path="/settings"          element={<Settings />} />
          <Route path="/support"           element={<Support />} />
          <Route path="/support/:id"       element={<SupportTicket />} />
          <Route path="/status"            element={<LegalPage slug="status" />} />
          <Route path="/legal"             element={<LegalPage slug="legal" />} />
          <Route path="/licenses"          element={<LegalPage slug="licenses" />} />
          <Route path="/privacy"           element={<LegalPage slug="privacy" />} />
          <Route path="/privacy-choices"   element={<LegalPage slug="privacy-choices" />} />
          <Route path="/terms"             element={<LegalPage slug="terms" />} />
          <Route path="/security"          element={<LegalPage slug="security" />} />
          <Route path="/cookies"           element={<LegalPage slug="cookies" />} />
          {user.role === 'admin' && (
            <Route path="/admin/users"     element={<AdminUsers />} />
          )}
          <Route path="*"                  element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <NotificationPanel />
      <BottomNav />
    </div>
  );
}

// ── Root shell ────────────────────────────────────────────────────────────────
function AppShell() {
  const { user, loading, hydrate } = useAuth();
  const location = useLocation();

  useEffect(() => { hydrate(); }, [hydrate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/>
            <path d="M21 12a9 9 0 00-9-9"/>
          </svg>
          <span className="text-sm font-medium text-navy">Loading CoreWallet…</span>
        </div>
      </div>
    );
  }

  const LEGAL = ['/status', '/legal', '/licenses', '/privacy', '/privacy-choices', '/terms', '/security', '/cookies'];
  const PUBLIC = ['/', '/login', '/register', ...LEGAL];

  if (!user && !PUBLIC.includes(location.pathname)) return <Navigate to="/login" replace />;
  if (user && (location.pathname === '/login' || location.pathname === '/register')) return <Navigate to="/" replace />;

  return user ? <AuthenticatedShell user={user} /> : <PublicShell />;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppShell />
      </NotificationProvider>
    </AuthProvider>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function XIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function IconHome()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IconCard()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>; }
function IconHistory()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function IconAnalytics() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function IconSettings()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>; }
function IconSupport()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>; }
function IconUsers()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>; }
function IconTransfer()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>; }
