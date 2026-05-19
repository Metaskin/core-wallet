import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/authStore';
import { useNotifications } from '../../store/notificationStore';
import { formatDate } from '../../utils/formatters';

export default function TopNav({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const { unreadCount, panelOpen, openPanel, closePanel } = useNotifications();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  const handleLogout = () => {
    setDropOpen(false);
    logout();
  };

  const lastLogin = user?.lastLoginAt
    ? formatDate(user.lastLoginAt)
    : 'Recently';

  return (
    <>
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 h-14 md:h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-6 gap-3">

        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          aria-label="Open menu"
          className="md:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <MenuIcon />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <MCTLogoMark size={32} />
          <div className="hidden sm:block leading-none">
            <div className="font-bold text-navy text-sm tracking-tight leading-none">Metropolitan Capital</div>
            <div className="text-gray-400 text-[9px] tracking-widest uppercase leading-none mt-0.5">&amp; Trust Bank</div>
          </div>
        </div>

        <div className="flex-1" />

        {/* Notification bell */}
        <button
          onClick={panelOpen ? closePanel : openPanel}
          aria-label="Notifications"
          className={`relative p-2 rounded-lg transition-colors ${
            panelOpen
              ? 'text-[#0072CE] bg-[#EEF4FF]'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#C0392B]
                             text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropOpen(v => !v)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: user?.avatarColor || '#003087' }}
            >
              {user?.avatarInitials || '?'}
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
              {user?.firstName || user?.fullName}
            </span>
            <ChevronIcon className={`hidden md:block text-gray-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-card-md z-50 overflow-hidden animate-fade-in">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
              </div>
              {/* Menu items */}
              <div className="py-1">
                <DropItem icon={<SettingsIcon />} label="Settings" onClick={() => { setDropOpen(false); navigate('/settings'); }} />
                <DropItem icon={<ShieldIcon />}   label="Security"  onClick={() => { setDropOpen(false); navigate('/settings'); }} />
              </div>
              <div className="py-1 border-t border-gray-100">
                <DropItem icon={<LogoutIcon />} label="Log Out" onClick={handleLogout} danger />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Security strip — desktop only ──────────────────────────────────── */}
      <div className="hidden md:flex fixed top-16 inset-x-0 z-40 h-8 bg-[#EEF4FF] border-b border-[#C7D7FF] items-center px-6 gap-2">
        <LockIcon className="text-navy w-3 h-3 shrink-0" />
        <span className="text-[11px] text-navy/70 truncate">
          Your connection is secure · Last login: {lastLogin}
        </span>
      </div>
    </>
  );
}

function DropItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors
        ${danger
          ? 'text-bank-red hover:bg-red-50'
          : 'text-gray-700 hover:bg-gray-50'
        }`}
    >
      <span className={danger ? 'text-bank-red' : 'text-gray-400'}>{icon}</span>
      {label}
    </button>
  );
}

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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}
function ChevronIcon({ className }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
function SettingsIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
}
function ShieldIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function LogoutIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
}
function LockIcon({ className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
}

function MCTLogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="#003087"/>
      <path d="M7 19 L20 9 L33 19" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="8"  y="21" width="5" height="12" rx="1" fill="white" opacity="0.6"/>
      <rect x="17" y="17" width="6" height="16" rx="1" fill="white"/>
      <rect x="27" y="19" width="5" height="14" rx="1" fill="white" opacity="0.6"/>
    </svg>
  );
}
