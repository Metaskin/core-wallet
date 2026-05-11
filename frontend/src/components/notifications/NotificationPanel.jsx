import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../../store/notificationStore';

// ── Severity colour mapping ───────────────────────────────────────────────────
const SEVERITY = {
  info:     { dot: 'bg-blue-400',    ring: 'border-blue-400/20',    text: 'text-blue-400',    label: 'Info' },
  success:  { dot: 'bg-emerald-400', ring: 'border-emerald-400/20', text: 'text-emerald-400', label: 'Success' },
  warning:  { dot: 'bg-amber-400',   ring: 'border-amber-400/20',   text: 'text-amber-400',   label: 'Warning' },
  critical: { dot: 'bg-red-400',     ring: 'border-red-400/20',     text: 'text-red-400',     label: 'Critical' },
};

const TYPE_ICONS = {
  login_success:        '🔓',
  login_failed:         '⚠️',
  password_changed:     '🔑',
  email_changed:        '✉️',
  card_issued:          '💳',
  account_frozen:       '🔒',
  account_unfrozen:     '✅',
  transaction_sent:     '↗',
  transaction_received: '↙',
  account_credited:     '💰',
  account_debited:      '📤',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)   return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatFullDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export default function NotificationPanel() {
  const {
    notifications, unreadCount, loading,
    panelOpen, closePanel,
    markRead, markAllRead, deleteNotification,
  } = useNotifications();

  const panelRef = useRef(null);
  // null = show list; item = show detail view for that notification
  const [selected, setSelected] = useState(null);

  // Reset detail view whenever panel re-opens
  useEffect(() => {
    if (!panelOpen) setSelected(null);
  }, [panelOpen]);

  // Close on outside click (desktop: area to the right of panel)
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
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (selected) setSelected(null);
        else closePanel();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [panelOpen, selected, closePanel]);

  if (!panelOpen) return null;

  const handleItemClick = (n) => {
    if (!n.is_read) markRead(n.id);
    setSelected(n);
  };

  const handleDelete = (n) => {
    deleteNotification(n.id);
    if (selected?.id === n.id) setSelected(null);
  };

  return (
    <>
      {/* Backdrop
           Mobile: visible dark overlay behind the full-screen panel.
           Desktop: transparent, just intercepts outside clicks. */}
      <div className="fixed inset-0 z-40 bg-black/50 md:bg-transparent" aria-hidden="true" />

      {/* Panel
           Mobile  (< md): fixed full-screen, slides in from left.
           Desktop (≥ md): fixed strip, left-edge flush with sidebar right edge (240px). */}
      <div
        ref={panelRef}
        className={[
          'fixed z-50 flex flex-col',
          'bg-[#111211] border-r border-white/[0.07] shadow-2xl',
          'animate-slide-in-left',
          // Mobile: full screen (top: 56px clears mobile top bar)
          'inset-x-0 top-14 bottom-0',
          // Desktop: strip next to sidebar
          'md:inset-y-0 md:top-0 md:bottom-0 md:left-60 md:right-auto md:w-[360px]',
        ].join(' ')}
      >
        {selected ? (
          <DetailView
            item={selected}
            onBack={() => setSelected(null)}
            onDelete={() => handleDelete(selected)}
            onClose={closePanel}
          />
        ) : (
          <ListView
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            onClose={closePanel}
            onItemClick={handleItemClick}
            onDelete={handleDelete}
            onMarkAllRead={markAllRead}
          />
        )}
      </div>
    </>
  );
}

// ── Notification list view ────────────────────────────────────────────────────
function ListView({ notifications, unreadCount, loading, onClose, onItemClick, onDelete, onMarkAllRead }) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
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
              onClick={onMarkAllRead}
              className="text-accent/70 hover:text-accent text-[11px] font-medium transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-white/20 hover:text-white/60 transition-colors p-1 rounded-lg hover:bg-white/5"
            aria-label="Close notifications"
          >
            <XIcon />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-white/20">
            <BellIcon size={28} />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs text-white/15">Activity like logins and transfers will appear here</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {notifications.map(n => (
              <NotificationRow
                key={n.id}
                item={n}
                onClick={() => onItemClick(n)}
                onDelete={(e) => { e.stopPropagation(); onDelete(n); }}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.06] shrink-0">
        <p className="text-white/20 text-[10px] text-center">
          {notifications.length === 0
            ? 'No notifications'
            : `Showing ${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
        </p>
      </div>
    </>
  );
}

// ── Single notification row (list view) ───────────────────────────────────────
function NotificationRow({ item, onClick, onDelete }) {
  const sev    = SEVERITY[item.severity] || SEVERITY.info;
  const icon   = TYPE_ICONS[item.type] || '•';
  const isRead = item.is_read;

  // Show a trimmed preview of the message (max 80 chars)
  const preview = item.message.length > 80
    ? item.message.slice(0, 80).trimEnd() + '…'
    : item.message;

  return (
    <li
      onClick={onClick}
      className={`relative flex gap-3 px-4 py-3.5 cursor-pointer transition-colors active:bg-white/[0.08] ${
        isRead ? 'hover:bg-white/[0.02]' : 'bg-white/[0.03] hover:bg-white/[0.05]'
      }`}
    >
      {/* Unread indicator strip */}
      {!isRead && (
        <span className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r bg-accent" />
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
            onClick={onDelete}
            className="shrink-0 text-white/15 hover:text-white/50 transition-colors mt-0.5 p-0.5"
            aria-label="Delete notification"
          >
            <XSmallIcon />
          </button>
        </div>
        {/* Preview — always visible, truncated */}
        <p className={`text-[11px] leading-relaxed mt-0.5 line-clamp-2 ${isRead ? 'text-white/30' : 'text-white/45'}`}>
          {preview}
        </p>
        <div className="flex items-center justify-between mt-1.5 gap-2">
          <p className="text-[10px] text-white/20">{timeAgo(item.created_at)}</p>
          {!isRead && (
            <span className="text-[9px] font-semibold text-accent uppercase tracking-wider">Unread</span>
          )}
        </div>
      </div>
    </li>
  );
}

// ── Detail view ───────────────────────────────────────────────────────────────
function DetailView({ item, onBack, onDelete, onClose }) {
  const sev  = SEVERITY[item.severity] || SEVERITY.info;
  const icon = TYPE_ICONS[item.type] || '•';

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
          aria-label="Back to list"
        >
          <BackIcon />
        </button>
        <span className="text-white/50 text-sm font-medium flex-1">Notification detail</span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/5 transition-colors"
          aria-label="Close"
        >
          <XIcon />
        </button>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-5">
        {/* Icon + severity */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl ${sev.ring} bg-white/[0.04]`}>
            {icon}
          </div>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${sev.text}`}>
              {sev.label}
            </span>
            {!item.is_read && (
              <p className="text-[10px] text-accent font-medium mt-0.5">Unread</p>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-white font-semibold text-base leading-snug mb-3">
          {item.title}
        </h2>

        {/* Full message */}
        <p className="text-white/55 text-sm leading-relaxed mb-5">
          {item.message}
        </p>

        {/* Metadata */}
        <div className="space-y-2 border-t border-white/[0.06] pt-4">
          <MetaRow label="Received" value={formatFullDate(item.created_at)} />
          <MetaRow label="Status"   value={item.is_read ? 'Read' : 'Unread'} />
          <MetaRow label="Type"     value={item.type?.replace(/_/g, ' ')} />
          {item.read_at && (
            <MetaRow label="Read at" value={formatFullDate(item.read_at)} />
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-5 py-4 border-t border-white/[0.06] shrink-0">
        <button
          onClick={onDelete}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-red-400/70
                     hover:text-red-400 hover:bg-red-400/5 transition-colors border border-red-400/10"
        >
          Delete notification
        </button>
      </div>
    </>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-white/30 text-xs shrink-0">{label}</span>
      <span className="text-white/60 text-xs text-right capitalize">{value}</span>
    </div>
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function XSmallIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
