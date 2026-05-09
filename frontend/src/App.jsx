import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/authStore';
import { NotificationProvider } from './store/notificationStore';
import Sidebar    from './components/layout/Sidebar';
import Dashboard  from './pages/Dashboard';
import Cards      from './pages/Cards';
import Transactions from './pages/Transactions';
import AdminUsers     from './pages/AdminUsers';
import Settings       from './pages/Settings';
import Support        from './pages/Support';
import SupportTicket  from './pages/SupportTicket';
import Login          from './pages/Login';
import Landing        from './pages/Landing';
import LegalPage      from './pages/LegalPage';

function AppShell() {
  const { user, loading, hydrate } = useAuth();
  const location = useLocation();

  // Fix: include hydrate in deps array (it's stable via useCallback so no extra calls)
  useEffect(() => { hydrate(); }, [hydrate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/40">
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/>
            <path d="M21 12a9 9 0 00-9-9"/>
          </svg>
          <span className="text-sm">Loading CoreWallet...</span>
        </div>
      </div>
    );
  }

  const LEGAL_PATHS = ['/status', '/legal', '/licenses', '/privacy', '/privacy-choices', '/terms', '/security', '/cookies'];
  const PUBLIC = ['/', '/login', '/register', ...LEGAL_PATHS];

  // Not logged in: allow public paths, redirect everything else to /login
  if (!user && !PUBLIC.includes(location.pathname)) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but on an auth page → redirect to dashboard
  if (user && (location.pathname === '/login' || location.pathname === '/register')) {
    return <Navigate to="/" replace />;
  }

  // Show public pages (unauthenticated)
  if (!user) {
    return (
      <Routes>
        <Route path="/"         element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Navigate to="/login?tab=register" replace />} />
        <Route path="/status"          element={<LegalPage slug="status" />} />
        <Route path="/legal"           element={<LegalPage slug="legal" />} />
        <Route path="/licenses"        element={<LegalPage slug="licenses" />} />
        <Route path="/privacy"         element={<LegalPage slug="privacy" />} />
        <Route path="/privacy-choices" element={<LegalPage slug="privacy-choices" />} />
        <Route path="/terms"           element={<LegalPage slug="terms" />} />
        <Route path="/security"        element={<LegalPage slug="security" />} />
        <Route path="/cookies"         element={<LegalPage slug="cookies" />} />
        <Route path="*"         element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Authenticated — show main app layout
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/"                  element={<Dashboard />} />
          <Route path="/cards"             element={<Cards />} />
          <Route path="/transactions"      element={<Transactions />} />
          <Route path="/settings"          element={<Settings />} />
          <Route path="/support"           element={<Support />} />
          <Route path="/support/:id"       element={<SupportTicket />} />
          <Route path="/status"          element={<LegalPage slug="status" />} />
          <Route path="/legal"           element={<LegalPage slug="legal" />} />
          <Route path="/licenses"        element={<LegalPage slug="licenses" />} />
          <Route path="/privacy"         element={<LegalPage slug="privacy" />} />
          <Route path="/privacy-choices" element={<LegalPage slug="privacy-choices" />} />
          <Route path="/terms"           element={<LegalPage slug="terms" />} />
          <Route path="/security"        element={<LegalPage slug="security" />} />
          <Route path="/cookies"         element={<LegalPage slug="cookies" />} />
          {user.role === 'admin' && (
            <>
              <Route path="/admin/users" element={<AdminUsers />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
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
