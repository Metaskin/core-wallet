import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { supportAPI } from '../api';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const STATUS = {
  open:     { label: 'Open',     cls: 'bg-accent/10 text-accent border-accent/20' },
  pending:  { label: 'Pending',  cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  resolved: { label: 'Resolved', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

export default function SupportTicket() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const isAdmin    = user?.role === 'admin';

  const [ticket,    setTicket]    = useState(null);
  const [messages,  setMessages]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [body,      setBody]      = useState('');
  const [sending,   setSending]   = useState(false);

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);
  const pollRef     = useRef(null);

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { data } = await supportAPI.getTicket(id);
      setTicket(data.data.ticket);
      setMessages(data.data.messages);
    } catch (err) {
      if (!silent) {
        toast.error(err.response?.data?.message || 'Failed to load ticket');
        navigate('/support');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
    // Poll every 6 s for new messages without WebSockets
    pollRef.current = setInterval(() => load(true), 6000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    setSending(true);
    // Optimistic append
    const optimistic = {
      id:         `opt-${Date.now()}`,
      message:    trimmed,
      senderRole: isAdmin ? 'admin' : 'user',
      senderName: user?.fullName,
      userId:     user?.id,
      createdAt:  new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setBody('');
    textareaRef.current?.focus();

    try {
      const send = isAdmin ? supportAPI.adminReply : supportAPI.sendMessage;
      const { data } = await send(id, trimmed);
      // Replace optimistic with real message; refresh ticket status
      setMessages(prev => prev.map(m => m.id === optimistic.id ? data.data.message : m));
      setTicket(prev => ({ ...prev, status: data.data.message.ticketStatus ?? prev.status }));
      // Silent refresh so status badge updates
      load(true);
    } catch (err) {
      // Roll back optimistic message
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setBody(trimmed);
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Ctrl/Cmd + Enter to send
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSend();
  };

  // ── Admin: change status ───────────────────────────────────────────────────
  const handleStatusChange = async (status) => {
    try {
      await supportAPI.adminSetStatus(id, status);
      setTicket(prev => ({ ...prev, status }));
      toast.success(`Ticket marked as ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="h-8 w-48 rounded-lg shimmer mb-8" />
        <div className="glass rounded-2xl p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 rounded-full shimmer shrink-0" />
              <div className={`h-14 rounded-2xl shimmer ${i % 2 ? 'w-56' : 'w-64'}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const s = STATUS[ticket.status] || STATUS.open;
  const isResolved = ticket.status === 'resolved';

  return (
    <div className="p-6 lg:p-8 max-w-3xl flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>

      {/* ── Header ── */}
      <div className="mb-6 animate-fade-up">
        <button
          onClick={() => navigate('/support')}
          className="flex items-center gap-2 text-white/30 hover:text-white/70 text-sm transition-colors mb-4"
        >
          <BackIcon /> Back to tickets
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-white font-bold text-xl font-display truncate">{ticket.subject}</h1>
            <p className="text-white/30 text-xs mt-1">
              Opened {formatDate(ticket.createdAt)}
              {isAdmin && ` · ${ticket.userName}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`badge border text-xs capitalize ${s.cls}`}>{s.label}</span>
            {/* Admin status controls */}
            {isAdmin && (
              <StatusMenu current={ticket.status} onChange={handleStatusChange} />
            )}
          </div>
        </div>
      </div>

      {/* ── Chat window ── */}
      <div className="glass rounded-2xl flex flex-col flex-1 min-h-0 animate-fade-up" style={{ animationDelay: '0.05s' }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <p className="text-white/20 text-sm text-center py-8">No messages yet</p>
          )}
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              msg={msg}
              isOwn={msg.userId === user?.id}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06]" />

        {/* Input area */}
        {isResolved ? (
          <div className="px-5 py-4 flex items-center justify-center gap-2 text-white/30">
            <LockIcon />
            <span className="text-sm">This ticket has been resolved</span>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-4 flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message… (Ctrl+Enter to send)"
              rows={2}
              maxLength={5000}
              className="input-base flex-1 resize-none text-sm leading-relaxed"
            />
            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="btn-primary h-10 px-4 text-sm shrink-0 self-end
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? <Spinner /> : <SendIcon />}
              {sending ? '' : 'Send'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Chat bubble ───────────────────────────────────────────────────────────────
function ChatBubble({ msg, isOwn }) {
  const isAdmin = msg.senderRole === 'admin';

  return (
    <div className={`flex items-end gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
          ${isAdmin
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-accent/20 text-accent'
          }`}
      >
        {isAdmin ? 'S' : getInitial(msg.senderName)}
      </div>

      {/* Bubble */}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words
            ${isOwn
              ? 'bg-accent text-white rounded-br-sm'
              : isAdmin
                ? 'bg-emerald-500/10 border border-emerald-500/15 text-white rounded-bl-sm'
                : 'bg-white/[0.06] text-white/80 rounded-bl-sm'
            }`}
        >
          {msg.message}
        </div>
        <div className={`flex items-center gap-1.5 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
          {isAdmin && (
            <span className="text-emerald-400/60 text-[10px] font-medium">Support</span>
          )}
          <span className="text-white/20 text-[10px]">{formatDate(msg.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Admin status dropdown ─────────────────────────────────────────────────────
function StatusMenu({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const options = ['open', 'pending', 'resolved'].filter(s => s !== current);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-white/30 hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-white/5"
        title="Change status"
      >
        <DotsIcon />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 glass-bright border border-white/10 rounded-xl overflow-hidden shadow-xl min-w-[130px]">
            {options.map(s => {
              const st = STATUS[s];
              return (
                <button
                  key={s}
                  onClick={() => { onChange(s); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-white/5 transition-colors text-left"
                >
                  <span className={`badge border text-[10px] capitalize ${st.cls}`}>{st.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitial = (name = '') => (name || '?')[0].toUpperCase();

// ── Icons ─────────────────────────────────────────────────────────────────────
function BackIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>; }
function SendIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>; }
function LockIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>; }
function DotsIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>; }
function Spinner()   { return <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>; }
