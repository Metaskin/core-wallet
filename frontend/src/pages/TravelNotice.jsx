import { useState, useEffect } from 'react';
import { travelNoticeAPI } from '../api';
import toast from 'react-hot-toast';

const TOP_COUNTRIES = [
  'United States','United Kingdom','Canada','Australia','Germany','France','Japan',
  'Mexico','Spain','Italy','Brazil','India','China','Netherlands','Switzerland',
  'Singapore','South Korea','New Zealand','South Africa','Argentina',
];

function statusBadge(s) {
  if (s === 'active')    return 'bg-blue-100 text-blue-700';
  if (s === 'completed') return 'bg-gray-100 text-gray-500';
  if (s === 'cancelled') return 'bg-red-100 text-red-600';
  return 'bg-gray-100 text-gray-500';
}

export default function TravelNotice() {
  const [notices,    setNotices]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [confirmId,  setConfirmId]  = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await travelNoticeAPI.getAll();
      setNotices(data.data?.notices || data.data || []);
    } catch {
      toast.error('Failed to load travel notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const active = notices.find(n => n.status === 'active');

  const handleCancel = async (id) => {
    try {
      await travelNoticeAPI.cancel(id);
      setNotices(prev => prev.map(n => n.id === id ? { ...n, status: 'cancelled' } : n));
      toast.success('Travel notice cancelled');
    } catch {
      toast.error('Failed to cancel notice');
    } finally {
      setConfirmId(null);
    }
  };

  const onCreated = (notice) => {
    setNotices(prev => [notice, ...prev]);
    setShowForm(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="text-gray-900 font-bold text-2xl">Travel Notices</h1>
          <p className="text-gray-500 text-sm mt-1">Avoid declined transactions while traveling</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          <PlusIcon /> Add Notice
        </button>
      </div>

      {/* Active notice banner */}
      {active && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 animate-fade-up">
          <PlaneIcon className="text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-amber-700 font-semibold text-sm">Active: {active.destination}</p>
            <p className="text-amber-600 text-xs">
              {new Date(active.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
              {new Date(active.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <span className="badge bg-amber-100 text-amber-700">Active</span>
        </div>
      )}

      {/* Notice list */}
      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => <div key={i} className="h-28 rounded-xl shimmer" />)}
        </div>
      ) : notices.length === 0 ? (
        <div className="bank-card flex flex-col items-center justify-center py-16 text-center animate-fade-up">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <PlaneIcon className="text-gray-400" />
          </div>
          <p className="text-gray-700 font-semibold text-sm">No travel notices</p>
          <p className="text-gray-400 text-xs mt-1 max-w-xs">Add a notice before traveling to prevent card declines abroad</p>
          <button onClick={() => setShowForm(true)} className="mt-4 btn-primary text-xs">Add Notice</button>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          {notices.map(n => (
            <div key={n.id} className="bank-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-gray-900 font-semibold text-sm">{n.destination}</span>
                    {n.countryCode && (
                      <span className="badge bg-gray-100 text-gray-600 font-mono text-[10px]">{n.countryCode}</span>
                    )}
                    <span className={`badge ${statusBadge(n.status)} capitalize`}>{n.status}</span>
                  </div>
                  <p className="text-gray-500 text-xs">
                    {new Date(n.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' '}–{' '}
                    {new Date(n.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {(n.emergencyContactName || n.emergencyContactPhone) && (
                    <p className="text-gray-400 text-xs mt-1">
                      Emergency: {n.emergencyContactName}{n.emergencyContactPhone ? ` · ${n.emergencyContactPhone}` : ''}
                    </p>
                  )}
                  {n.notes && <p className="text-gray-400 text-xs mt-1 italic">"{n.notes}"</p>}
                </div>
                {n.status === 'active' && (
                  <button
                    onClick={() => setConfirmId(n.id)}
                    className="btn-danger text-xs shrink-0 px-3 py-1.5"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TravelFormModal onClose={() => setShowForm(false)} onCreated={onCreated} />
      )}

      {confirmId && (
        <ConfirmModal
          message="Cancel this travel notice? Card activity in the destination may be flagged."
          onConfirm={() => handleCancel(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}

function TravelFormModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    destination:           '',
    country:               '',
    startDate:             '',
    endDate:               '',
    emergencyContactName:  '',
    emergencyContactPhone: '',
    notes:                 '',
  });
  const [saving, setSaving] = useState(false);

  const update = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.destination.trim()) return toast.error('Enter a destination');
    if (!form.startDate)          return toast.error('Select a start date');
    if (!form.endDate)            return toast.error('Select an end date');
    if (new Date(form.endDate) <= new Date(form.startDate)) return toast.error('End date must be after start date');

    setSaving(true);
    try {
      const { data } = await travelNoticeAPI.create({
        destination:           form.destination.trim(),
        country:               form.country || undefined,
        startDate:             form.startDate,
        endDate:               form.endDate,
        emergencyContactName:  form.emergencyContactName.trim() || undefined,
        emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
        notes:                 form.notes.trim() || undefined,
      });
      const notice = data.data?.notice || { id: Date.now(), ...form, status: 'active' };
      toast.success('Travel notice created');
      onCreated(notice);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create notice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-gray-900 font-bold text-lg">Add Travel Notice</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Destination</label>
            <input className="input-base" value={form.destination} onChange={update('destination')} placeholder="Paris, France" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Country / Region</label>
            <select className="input-base" value={form.country} onChange={update('country')}>
              <option value="">Select country</option>
              {TOP_COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Start Date</label>
              <input type="date" className="input-base" value={form.startDate} onChange={update('startDate')} min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">End Date</label>
              <input type="date" className="input-base" value={form.endDate} onChange={update('endDate')} min={form.startDate || new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Emergency Contact Name</label>
              <input className="input-base" value={form.emergencyContactName} onChange={update('emergencyContactName')} placeholder="Optional" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Emergency Phone</label>
              <input type="tel" className="input-base" value={form.emergencyContactPhone} onChange={update('emergencyContactPhone')} placeholder="Optional" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Notes (optional)</label>
            <textarea rows={2} className="input-base resize-none" value={form.notes} onChange={update('notes')} placeholder="Hotel info, itinerary notes..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner /> : 'Add Notice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl animate-fade-up p-6 text-center">
        <p className="text-gray-800 font-semibold text-sm mb-1">Confirm Cancellation</p>
        <p className="text-gray-500 text-xs mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Keep</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 px-5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-medium text-sm transition-all">Cancel Notice</button>
        </div>
      </div>
    </div>
  );
}

function Spinner() { return <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>; }
function XIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function PlusIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function PlaneIcon({ className = '' }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 2s-4 0-4 0L3 14.2l3 1 1.5 3.5L11 17l1 3 3-1z"/></svg>; }
