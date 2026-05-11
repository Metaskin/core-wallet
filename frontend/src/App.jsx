import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth }           from './store/authStore';
import { NotificationProvider, useNotifications } from './store/notificationStore';
import Sidebar          from './components/layout/Sidebar';
import BottomNav        from './components/layout/BottomNav';
import NotificationPanel from './components/notifications/NotificationPanel';
import Dashboard        from './pages/Dashboard';
import Cards            from './pages/Cards';
import Transactions     from './pages/Transactions';
import AdminUsers       from './pages/AdminUsers';
import Settings         from './pages/Settings';
import Support          from './pages/Support';
import SupportTicket    from './pages/SupportTicket';
import Login            from './pages/Login';
import Landing          from './pages/Landing';
import LegalPage        from './pages/LegalPage';

// ── Public-only shell (unauthenticated) ──────────────────────────────────────
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
// Rendered only when `user` is truthy. Can use all context hooks safely.
function AuthenticatedShell({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { unreadCount, panelOpen, openPanel, closePanel } = useNotifications();

  // Lock body scroll when the mobile sidebar drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Mobile top bar ──────────────────────────────────────────────────
           Hidden on md+. Provides: hamburger → sidebar drawer, logo, bell.   */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-surface-2
                         border-b border-white/[0.06] flex items-center px-3 gap-3 shrink-0">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
        >
          <MenuIcon />
        </button>

        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-xs shrink-0">C</div>
          <span className="font-display font-bold text-white text-base tracking-tight">CoreWallet</span>
        </div>

        {/* Notification bell — always visible on mobile top bar */}
        <button
          onClick={panelOpen ? closePanel : openPanel}
          aria-label="Notifications"
          className={`relative p-2 rounded-xl transition-colors ${
            panelOpen ? 'text-accent bg-accent/10' : 'text-white/40 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full
                             bg-accent text-white text-[8px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* ── Body row (sidebar + main content) ─────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar — mobile: slide-in drawer; desktop: sticky column */}
        <Sidebar mobileOpen={menuOpen} onMobileClose={() => setMenuOpen(false)} />

        {/* Mobile sidebar backdrop */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content
             pt-14 md:pt-0  — clears fixed mobile top bar (56px)
             pb-20 md:pb-0  — clears fixed bottom nav (80px) + safe area */}
        <main className="flex-1 overflow-auto pt-14 md:pt-0 pb-20 md:pb-0 min-w-0">
          <Routes>
            <Route path="/"                  element={<Dashboard />} />
            <Route path="/cards"             element={<Cards />} />
            <Route path="/transactions"      element={<Transactions />} />
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
      </div>

      {/* Notification panel — rendered at root level, handles its own positioning */}
      <NotificationPanel />

      {/* Bottom nav — mobile only, md:hidden inside the component */}
      <BottomNav />
    </div>
  );
}

// ── Root shell ─────────────────────────────────────────────────────────────────
function AppShell() {
  const { user, loading, hydrate } = useAuth();
  const location = useLocation();

  useEffect(() => { hydrate(); }, [hydrate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/40">
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/>
            <path d="M21 12a9 9 0 00-9-9"/>
          </svg>
          <span className="text-sm">Loading CoreWallet…</span>
        </div>
      </div>
    );
  }

  const LEGAL_PATHS = ['/status', '/legal', '/licenses', '/privacy', '/privacy-choices', '/terms', '/security', '/cookies'];
  const PUBLIC = ['/', '/login', '/register', ...LEGAL_PATHS];

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

// ── Icons (mobile top bar) ────────────────────────────────────────────────────
function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}
