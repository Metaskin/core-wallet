import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supportAPI } from '../api';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  open:     { label: 'Open',     cls: 'bg-accent/10 text-accent border-accent/20' },
  pending:  { label: 'Pending',  cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  resolved: { label: 'Resolved', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

export default function Support() {
  const navigate = useNavigate();
  const [tickets,     setTickets]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await supportAPI.getTickets();
      setTickets(data.data.tickets);
    } catch {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreated = (ticket) => {
    setTickets(prev => [ticket, ...prev]);
    setShowCreate(false);
    navigate(`/support/${ticket.id}`);
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="text-white font-bold text-2xl font-display">Support</h1>
          <p className="text-white/40 text-sm mt-1">Get help with your account</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary h-10 px-4 text-sm"
        >
          <PlusIcon /> New Ticket
        </button>
      </div>

      {/* Ticket list */}
      <div className="glass rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: '0.05s' }}>
        {loading ? (
          <TicketSkeletons />
        ) : tickets.length === 0 ? (
          <EmptyState onNew={() => setShowCreate(true)} />
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {tickets.map((t, i) => (
              <TicketRow
                key={t.id}
                ticket={t}
                delay={i * 0.03}
                onClick={() => navigate(`/support/${t.id}`)}
              />
            ))}
          </ul>
        )}
      </div>

      {showCreate && (
        <NewTicketModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

// ── Ticket row ────────────────────────────────────────────────────────────────
function TicketRow({ ticket, delay, onClick }) {
  const s = STATUS[ticket.status] || STATUS.open;
  return (
    <li
      onClick={onClick}
      className="flex items-center gap-4 px-5 py-4 cursor-pointer
                 hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
        <TicketIcon />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{ticket.subject}</p>
        <p className="text-white/30 text-xs mt-0.5">
          {ticket.messageCount} {ticket.messageCount === 1 ? 'message' : 'messages'}
          {' · '}
          {formatDate(ticket.updatedAt)}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className={`badge border text-[10px] capitalize ${s.cls}`}>{s.label}</span>
        <ChevronIcon />
      </div>
    </li>
  );
}

// ── New ticket modal ──────────────────────────────────────────────────────────
function NewTicketModal({ onClose, onCreated }) {
  const [subject,   setSubject]   = useState('');
  const [message,   setMessage]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [visible,   setVisible]   = useState(false);

  useEffect(() => {
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const close = () => {
    setVisible(false);
    setTimeout(() => { setMounted(false); onClose(); }, 260);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (subject.trim().length < 5) { toast.error('Subject must be at least 5 characters'); return; }
    if (message.trim().length < 10) { toast.error('Message must be at least 10 characters'); return; }
    setSubmitting(true);
    try {
      const { data } = await supportAPI.createTicket({ subject: subject.trim(), message: message.trim() });
      toast.success('Ticket created');
      onCreated(data.data.ticket);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-260
        ${visible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0'}`}
      onClick={e => e.target === e.currentTarget && close()}
    >
      <div
        className={`glass rounded-2xl p-6 w-full max-w-lg transition-all duration-260
          ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold">New Support Ticket</h2>
            <p className="text-white/40 text-xs mt-0.5">We typically respond within 24 hours</p>
          </div>
          <button onClick={close} className="text-white/20 hover:text-white/60 transition-colors">
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              maxLength={255}
              placeholder="Brief description of your issue"
              className="input-base w-full"
              autoFocus
            />
          </div>

          <div>
            <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={5000}
              rows={5}
              placeholder="Describe your issue in detail…"
              className="input-base w-full resize-none"
            />
            <p className="text-white/20 text-[10px] text-right mt-1">{message.length}/5000</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={close}
              className="btn-ghost flex-1 h-11 border border-white/10 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || subject.trim().length < 5 || message.trim().length < 10}
              className="btn-primary flex-1 h-11 text-sm justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <><Spinner /> Submitting…</> : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-white/20">
      <svg className="mb-3 opacity-40" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
      <p className="text-sm mb-1">No tickets yet</p>
      <p className="text-xs text-white/20 mb-4">Create a ticket and our team will help you</p>
      <button onClick={onNew} className="text-accent text-xs font-medium hover:text-accent/70 transition-colors">
        + Create your first ticket
      </button>
    </div>
  );
}

function TicketSkeletons() {
  return (
    <div className="divide-y divide-white/[0.05]">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="w-9 h-9 rounded-xl shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-48 rounded shimmer" />
            <div className="h-2.5 w-32 rounded shimmer" />
          </div>
          <div className="h-5 w-16 rounded-full shimmer" />
        </div>
      ))}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function PlusIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function TicketIcon()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>; }
function ChevronIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/15"><polyline points="9 18 15 12 9 6"/></svg>; }
function XIcon()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function Spinner()     { return <svg className="animate-spin mr-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>; }
