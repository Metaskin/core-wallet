import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../../store/notificationStore';

const SEVERITY = {
  info:     { dot: 'bg-blue-400',    ring: 'border-blue-200',    text: 'text-blue-600',    label: 'Info',     bg: 'bg-blue-50' },
  success:  { dot: 'bg-emerald-500', ring: 'border-emerald-200', text: 'text-bank-green',  label: 'Success',  bg: 'bg-emerald-50' },
  warning:  { dot: 'bg-amber-500',   ring: 'border-amber-200',   text: 'text-bank-amber',  label: 'Warning',  bg: 'bg-amber-50' },
  critical: { dot: 'bg-bank-red',    ring: 'border-red-200',     text: 'text-bank-red',    label: 'Critical', bg: 'bg-red-50' },
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
  if (s < 60)  return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatFullDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function NotificationPanel() {
  const {
    notifications, unreadCount, loading,
    panelOpen, closePanel,
    markRead, markAllRead, deleteNotification,
  } = useNotifications();

  const panelRef = useRef(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!panelOpen) setSelected(null);
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) closePanel();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen, closePanel]);

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
      {/* Backdrop: dark on mobile, transparent on desktop */}
      <div className="fixed inset-0 z-40 bg-black/40 md:bg-transparent" aria-hidden="true" />

      {/* Panel */}
      <div
        ref={panelRef}
        className={[
          'fixed z-50 flex flex-col',
          'bg-white border-r border-gray-200 shadow-card-lg',
          'animate-slide-in-left',
          // Mobile: full-screen below top bar
          'inset-x-0 top-14 bottom-0',
          // Desktop: 360px strip to the right of the sidebar
          'md:inset-y-0 md:top-0 md:bottom-0 md:left-60 md:right-auto md:w-[360px] md:border-r md:border-l-0',
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

function ListView({ notifications, unreadCount, loading, onClose, onItemClick, onDelete, onMarkAllRead }) {
  return (
    <>
      <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <BellIcon className="text-gray-500" />
          <span className="text-gray-800 font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-bank-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-[#0072CE] hover:text-navy text-[11px] font-medium transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            aria-label="Close notifications"
          >
            <XIcon />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-300">
            <BellIcon size={28} />
            <p className="text-sm text-gray-500">No notifications yet</p>
            <p className="text-xs text-gray-400">Activity like logins and transfers will appear here</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
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

      <div className="px-4 py-3 border-t border-gray-100 shrink-0">
        <p className="text-gray-400 text-[10px] text-center">
          {notifications.length === 0
            ? 'No notifications'
            : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
        </p>
      </div>
    </>
  );
}

function NotificationRow({ item, onClick, onDelete }) {
  const sev  = SEVERITY[item.severity] || SEVERITY.info;
  const icon = TYPE_ICONS[item.type] || '•';

  const preview = item.message.length > 80
    ? item.message.slice(0, 80).trimEnd() + '…'
    : item.message;

  return (
    <li
      onClick={onClick}
      className={`relative flex gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
        item.is_read ? 'hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/50'
      }`}
    >
      {/* Unread indicator */}
      {!item.is_read && (
        <span className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r bg-[#0072CE]" />
      )}

      {/* Icon */}
      <div className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center text-sm mt-0.5 ${sev.bg} ${sev.ring}`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs font-semibold leading-snug ${item.is_read ? 'text-gray-500' : 'text-gray-800'}`}>
            {item.title}
          </p>
          <button
            onClick={onDelete}
            className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors mt-0.5 p-0.5"
            aria-label="Delete notification"
          >
            <XSmallIcon />
          </button>
        </div>
        <p className={`text-[11px] leading-relaxed mt-0.5 line-clamp-2 ${item.is_read ? 'text-gray-400' : 'text-gray-600'}`}>
          {preview}
        </p>
        <div className="flex items-center justify-between mt-1.5 gap-2">
          <p className="text-[10px] text-gray-400">{timeAgo(item.created_at)}</p>
          {!item.is_read && (
            <span className="text-[9px] font-bold text-[#0072CE] uppercase tracking-wider">Unread</span>
          )}
        </div>
      </div>
    </li>
  );
}

function DetailView({ item, onBack, onDelete, onClose }) {
  const sev  = SEVERITY[item.severity] || SEVERITY.info;
  const icon = TYPE_ICONS[item.type] || '•';

  return (
    <>
      <div className="flex items-center gap-2 px-4 pt-5 pb-4 border-b border-gray-100 shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Back to list"
        >
          <BackIcon />
        </button>
        <span className="text-gray-500 text-sm font-medium flex-1">Notification detail</span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <XIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl ${sev.bg} ${sev.ring}`}>
            {icon}
          </div>
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${sev.text}`}>
              {sev.label}
            </span>
            {!item.is_read && (
              <p className="text-[10px] text-[#0072CE] font-medium mt-0.5">Unread</p>
            )}
          </div>
        </div>

        <h2 className="text-gray-900 font-semibold text-base leading-snug mb-3">{item.title}</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-5">{item.message}</p>

        <div className="space-y-2 border-t border-gray-100 pt-4">
          <MetaRow label="Received" value={formatFullDate(item.created_at)} />
          <MetaRow label="Status"   value={item.is_read ? 'Read' : 'Unread'} />
          <MetaRow label="Type"     value={item.type?.replace(/_/g, ' ')} />
          {item.read_at && <MetaRow label="Read at" value={formatFullDate(item.read_at)} />}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-gray-100 shrink-0">
        <button
          onClick={onDelete}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-bank-red
                     hover:bg-red-50 transition-colors border border-red-200"
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
      <span className="text-gray-400 text-xs shrink-0">{label}</span>
      <span className="text-gray-700 text-xs text-right capitalize">{value}</span>
    </div>
  );
}

function BellIcon({ className = '', size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}
function XIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function XSmallIcon() {
  return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function BackIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
}
