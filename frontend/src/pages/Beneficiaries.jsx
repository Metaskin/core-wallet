import { useState, useEffect } from 'react';
import { beneficiaryAPI } from '../api';
import toast from 'react-hot-toast';

const RELATIONSHIPS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Other'];
const REL_COLORS = {
  Spouse:  'bg-pink-100 text-pink-700',
  Child:   'bg-blue-100 text-blue-700',
  Parent:  'bg-purple-100 text-purple-700',
  Sibling: 'bg-green-100 text-green-700',
  Other:   'bg-gray-100 text-gray-600',
};

const SEG_COLORS = ['#0072CE', '#1A7A4A', '#F59E0B', '#6366F1', '#EC4899', '#14B8A6'];

export default function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [confirmDel,    setConfirmDel]    = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await beneficiaryAPI.getAll();
      setBeneficiaries(data.data?.beneficiaries || data.data || []);
    } catch {
      toast.error('Failed to load beneficiaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalPct = beneficiaries.reduce((s, b) => s + (parseFloat(b.percentage) || 0), 0);

  const handleDelete = async (id) => {
    try {
      await beneficiaryAPI.delete(id);
      setBeneficiaries(prev => prev.filter(b => b.id !== id));
      toast.success('Beneficiary removed');
    } catch {
      toast.error('Failed to remove beneficiary');
    } finally {
      setConfirmDel(null);
    }
  };

  const onFormDone = (saved) => {
    if (editItem) {
      setBeneficiaries(prev => prev.map(b => b.id === saved.id ? saved : b));
    } else {
      setBeneficiaries(prev => [...prev, saved]);
    }
    setShowForm(false);
    setEditItem(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="text-gray-900 font-bold text-2xl">Beneficiaries &amp; Contacts</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account beneficiaries</p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="btn-primary text-sm"
        >
          <PlusIcon /> Add Beneficiary
        </button>
      </div>

      {/* Info notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 flex gap-3 items-start animate-fade-up" style={{ animationDelay: '0.03s' }}>
        <InfoIcon className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-blue-700 text-xs leading-relaxed">
          Beneficiary information is used to direct assets in case of the account holder's passing. Keep this information current.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => <div key={i} className="h-24 rounded-xl shimmer" />)}
        </div>
      ) : (
        <>
          {/* Allocation bar */}
          {beneficiaries.length > 0 && (
            <div className="bank-card p-4 mb-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="section-label">Allocation</p>
                <span className={`text-xs font-medium ${totalPct > 100 ? 'text-bank-red' : totalPct === 100 ? 'text-bank-green' : 'text-gray-500'}`}>
                  {totalPct}% {totalPct > 100 ? '— exceeds 100%' : totalPct < 100 ? `— ${100 - totalPct}% unallocated` : '— fully allocated'}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                {beneficiaries.map((b, i) => {
                  const pct = Math.min(parseFloat(b.percentage) || 0, 100);
                  return pct > 0 ? (
                    <div
                      key={b.id}
                      title={`${b.name}: ${pct}%`}
                      className="h-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: SEG_COLORS[i % SEG_COLORS.length] }}
                    />
                  ) : null;
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {beneficiaries.map((b, i) => (
                  <div key={b.id} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SEG_COLORS[i % SEG_COLORS.length] }} />
                    <span className="text-xs text-gray-600">{b.name} ({b.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Beneficiary list */}
          {beneficiaries.length === 0 ? (
            <div className="bank-card flex flex-col items-center justify-center py-16 text-center animate-fade-up">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <UsersIcon className="text-gray-400" />
              </div>
              <p className="text-gray-700 font-semibold text-sm">No beneficiaries added</p>
              <p className="text-gray-400 text-xs mt-1 max-w-xs">Add beneficiaries to designate who receives your assets</p>
              <button onClick={() => { setEditItem(null); setShowForm(true); }} className="mt-4 btn-primary text-xs">
                Add Beneficiary
              </button>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              {beneficiaries.map((b, i) => (
                <div key={b.id} className="bank-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-900 font-semibold text-sm">{b.name}</span>
                        <span className={`badge ${REL_COLORS[b.relationship] || 'bg-gray-100 text-gray-600'}`}>{b.relationship}</span>
                        {b.isEmergencyContact && (
                          <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                            <StarIcon /> Emergency Contact
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 mt-2 flex-wrap text-xs text-gray-500">
                        {b.email && <span>{b.email}</span>}
                        {b.phone && <span>{b.phone}</span>}
                        {b.dateOfBirth && (
                          <span>DOB: {new Date(b.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className="text-2xl font-bold amount-display"
                        style={{ color: SEG_COLORS[i % SEG_COLORS.length] }}
                      >
                        {b.percentage}%
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setEditItem(b); setShowForm(true); }}
                      className="btn-ghost text-xs px-3 py-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDel(b.id)}
                      className="btn-danger text-xs px-3 py-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showForm && (
        <BeneficiaryFormModal
          item={editItem}
          currentTotal={totalPct}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSaved={onFormDone}
        />
      )}

      {confirmDel && (
        <ConfirmModal
          message="Remove this beneficiary? This action cannot be undone."
          onConfirm={() => handleDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}

function BeneficiaryFormModal({ item, currentTotal, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:               item?.name               || '',
    relationship:       item?.relationship       || RELATIONSHIPS[0],
    dateOfBirth:        item?.dateOfBirth        ? item.dateOfBirth.split('T')[0] : '',
    email:              item?.email              || '',
    phone:              item?.phone              || '',
    address:            item?.address            || '',
    percentage:         item?.percentage         || '',
    isEmergencyContact: item?.isEmergencyContact || false,
  });
  const [saving, setSaving] = useState(false);

  const update = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())         return toast.error('Enter a name');
    const pct = parseFloat(form.percentage);
    if (!pct || pct <= 0 || pct > 100) return toast.error('Enter a valid percentage (1–100)');
    const used = currentTotal - (item ? parseFloat(item.percentage) || 0 : 0);
    if (used + pct > 100) return toast.error(`Total allocation would exceed 100% (${100 - used}% remaining)`);

    setSaving(true);
    try {
      const payload = {
        name:               form.name.trim(),
        relationship:       form.relationship,
        dateOfBirth:        form.dateOfBirth || undefined,
        email:              form.email.trim() || undefined,
        phone:              form.phone.trim() || undefined,
        address:            form.address.trim() || undefined,
        percentage:         pct,
        isEmergencyContact: form.isEmergencyContact,
      };
      let saved;
      if (item) {
        const { data } = await beneficiaryAPI.update(item.id, payload);
        saved = data.data?.beneficiary || { ...item, ...payload };
      } else {
        const { data } = await beneficiaryAPI.create(payload);
        saved = data.data?.beneficiary || { id: Date.now(), ...payload };
      }
      toast.success(item ? 'Beneficiary updated' : 'Beneficiary added');
      onSaved(saved);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-gray-900 font-bold text-lg">{item ? 'Edit Beneficiary' : 'Add Beneficiary'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Full Name</label>
              <input className="input-base" value={form.name} onChange={update('name')} placeholder="Jane Doe" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Relationship</label>
              <select className="input-base" value={form.relationship} onChange={update('relationship')}>
                {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Date of Birth</label>
              <input type="date" className="input-base" value={form.dateOfBirth} onChange={update('dateOfBirth')} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Allocation %</label>
              <div className="relative">
                <input type="number" min="1" max="100" step="0.1" className="input-base pr-8" value={form.percentage} onChange={update('percentage')} placeholder="0" />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Email (optional)</label>
              <input type="email" className="input-base" value={form.email} onChange={update('email')} placeholder="jane@example.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-medium mb-1.5">Phone (optional)</label>
              <input type="tel" className="input-base" value={form.phone} onChange={update('phone')} placeholder="+1 (555) 000-0000" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1.5">Address (optional)</label>
            <input className="input-base" value={form.address} onChange={update('address')} placeholder="123 Main St, City, State 00000" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm(p => ({ ...p, isEmergencyContact: !p.isEmergencyContact }))}
              className={`w-10 h-6 rounded-full transition-colors ${form.isEmergencyContact ? 'bg-navy' : 'bg-gray-200'} relative shrink-0`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isEmergencyContact ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-gray-700">Emergency Contact</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Spinner /> : (item ? 'Save Changes' : 'Add Beneficiary')}
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
        <p className="text-gray-800 font-semibold text-sm mb-1">Confirm Removal</p>
        <p className="text-gray-500 text-xs mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 px-5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-medium text-sm transition-all">Remove</button>
        </div>
      </div>
    </div>
  );
}

function Spinner() { return <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 00-9-9"/></svg>; }
function XIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function PlusIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function StarIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function InfoIcon({ className = '' }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function UsersIcon({ className = '' }) { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
