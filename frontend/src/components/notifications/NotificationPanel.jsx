import { useEffect, useRef } from 'react';
import { useNotifications } from '../../store/notificationStore';

// ── Severity → colour mapping ─────────────────────────────────────────────────
const SEVERITY = {
  info:     { dot: 'bg-blue-400',    ring: 'border-blue-400/20',  text: 'text-blue-400'    },
  success:  { dot: 'bg-emerald-400', ring: 'border-emerald-400/20', text: 'text-emerald-400' },
  warning:  { dot: 'bg-amber-400',   ring: 'border-amber-400/20', text: 'text-amber-400'   },
  critical: { dot: 'bg-red-400',     ring: 'border-red-400/20',   text: 'text-red-400'     },
};

const TYPE_ICONS = {
  login_success:       '🔓',
  login_failed:        '⚠️',
  password_changed:    '🔑',
  email_changed:       '✉️',
  card_issued:         '💳',
  account_frozen:      '🔒',
  account_unfrozen:    '✅',
  transaction_sent:    '↗',
  transaction_received:'↙',
  account_credited:    '💰',
  account_debited:     '📤',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)    return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60)    return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)    return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)    return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export default function NotificationPanel() {
  const {
    notifications, unreadCount, loading,
    panelOpen, closePanel,
    markRead, markAllRead, deleteNotification,
  } = useNotifications();

  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) closePanel();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen, closePanel]);

  // Close on Escape
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e) => { if (e.key === 'Escape') closePanel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [panelOpen, closePanel]);

  if (!panelOpen) return null;

  return (
    <>
      {/* Backdrop (transparent — closes on outside click) */}
      <div className="fixed inset-0 z-40" aria-hidden="true" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 bottom-0 z-50 flex flex-col bg-[#111211] border-r border-white/[0.07] shadow-2xl animate-slide-in-left"
        style={{ left: '240px', width: '360px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <BellIcon className="text-white/50" />
            <span className="text-white font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-accent/70 hover:text-accent text-[11px] font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={closePanel}
              className="text-white/20 hover:text-white/60 transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <XIcon />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/30 text-sm">
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-white/20">
              <BellIcon size={28} />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {notifications.map(n => (
                <NotificationItem
                  key={n.id}
                  item={n}
                  onRead={() => !n.is_read && markRead(n.id)}
                  onDelete={() => deleteNotification(n.id)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] shrink-0">
          <p className="text-white/20 text-[10px] text-center">
            Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </>
  );
}

// ── Single notification row ───────────────────────────────────────────────────
function NotificationItem({ item, onRead, onDelete }) {
  const sev    = SEVERITY[item.severity] || SEVERITY.info;
  const icon   = TYPE_ICONS[item.type] || '•';
  const isRead = item.is_read;

  return (
    <li
      onClick={onRead}
      className={`relative flex gap-3 px-5 py-3.5 cursor-pointer transition-colors
        ${isRead ? 'hover:bg-white/[0.02]' : 'bg-white/[0.03] hover:bg-white/[0.05]'}`}
    >
      {/* Unread indicator */}
      {!isRead && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-accent" />
      )}

      {/* Icon bubble */}
      <div className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-sm mt-0.5 ${sev.ring} bg-white/[0.03]`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs font-semibold leading-snug ${isRead ? 'text-white/60' : 'text-white'}`}>
            {item.title}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="shrink-0 text-white/15 hover:text-white/50 transition-colors mt-0.5"
          >
            <XSmallIcon />
          </button>
        </div>
        <p className={`text-[11px] leading-relaxed mt-0.5 ${isRead ? 'text-white/30' : 'text-white/45'}`}>
          {item.message}
        </p>
        <p className="text-[10px] text-white/20 mt-1.5">{timeAgo(item.created_at)}</p>
      </div>
    </li>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function BellIcon({ className = '', size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function XSmallIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
