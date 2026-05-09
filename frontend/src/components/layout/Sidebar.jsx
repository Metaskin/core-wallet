import { NavLink } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { useNotifications } from '../../store/notificationStore';
import NotificationPanel from '../notifications/NotificationPanel';
import { getInitials } from '../../utils/formatters';

const NAV = [
  { to: '/',             label: 'Dashboard', icon: <IconHome /> },
  { to: '/cards',        label: 'Cards',     icon: <IconCard /> },
  { to: '/transactions', label: 'History',   icon: <IconHistory /> },
  { to: '/settings',     label: 'Settings',  icon: <IconSettings /> },
  { to: '/support',      label: 'Support',   icon: <IconSupport /> },
];

const ADMIN_NAV = [
  { to: '/admin/users',        label: 'Users',        icon: <IconUsers /> },
  { to: '/admin/transactions', label: 'All Transfers', icon: <IconTransfer /> },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { unreadCount, panelOpen, openPanel, closePanel } = useNotifications();

  return (
    <>
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col border-r border-white/[0.06] bg-surface-2">
      {/* Logo + notification bell */}
      <div className="px-6 pt-7 pb-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">C</div>
        <span className="font-display font-bold text-white text-lg tracking-tight">CoreWallet</span>
        <button
          onClick={panelOpen ? closePanel : openPanel}
          title="Notifications"
          className={`ml-auto relative p-1.5 rounded-lg transition-colors
            ${panelOpen
              ? 'text-accent bg-accent/10'
              : 'text-white/30 hover:text-white/70 hover:bg-white/5'}`}
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent
                             text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <p className="text-white/20 text-[10px] uppercase tracking-widest px-3 pt-4 pb-1">Admin</p>
            {ADMIN_NAV.map(({ to, label, icon }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent/15 text-accent'
                      : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                  }`
                }
              >
                {icon}
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: user?.avatarColor || '#6366f1' }}
          >
            {getInitials(user?.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.fullName}</p>
            <p className="text-white/30 text-[10px] truncate">{user?.email}</p>
          </div>
          <button onClick={logout} title="Sign out"
            className="text-white/20 hover:text-white/60 transition-colors p-1">
            <IconLogout />
          </button>
        </div>
      </div>
    </aside>
    <NotificationPanel />
    </>
  );
}

function BellIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
}
function IconHome()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IconCard()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>; }
function IconHistory()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function IconUsers()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>; }
function IconTransfer() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>; }
function IconSettings() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>; }
function IconSupport()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>; }
function IconLogout()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>; }
