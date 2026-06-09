import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Clock, MessageSquare, MessageCircle, Plus, RefreshCw, Star, Copy, Check, X } from 'lucide-react';
import { leadsAPI, followupsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

const STATUSES = ['Fresh', 'Connected', 'Call Not Responding', 'Call Back Later', 'Not interested', 'Demo Scheduled', 'Demo Done', 'Won', 'Lost'];

function fmtDuration(sec) {
  if (!sec) return '0s';
  const m = Math.floor(sec / 60); const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function CallTimer({ onStop }) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);
  useEffect(() => { ref.current = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(ref.current); }, []);
  return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-green-700">Call in progress</p>
        <p className="text-xl font-mono font-bold text-green-800">{fmtDuration(elapsed)}</p>
      </div>
      <button onClick={() => onStop(elapsed)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors">
        <PhoneOff className="w-4 h-4" /> End
      </button>
    </div>
  );
}

function AddNoteModal({ onClose, onSubmit }) {
  const [note, setNote] = useState('');
  const [type, setType] = useState('note');
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Add Note</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-2 mb-3">
          {['note', 'whatsapp', 'sms'].map(t => (
            <button key={t} onClick={() => setType(t)} className={`text-xs px-3 py-1.5 rounded-full capitalize transition-colors ${type === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>
          ))}
        </div>
        <textarea className="input-field resize-none" rows={4} placeholder="Write your note..." value={note} onChange={e => setNote(e.target.value)} />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => onSubmit(note, type)} className="btn-primary flex-1" disabled={!note.trim()}>Save Note</button>
        </div>
      </div>
    </div>
  );
}

function LogCallModal({ lead, onClose, onSubmit }) {
  const [form, setForm] = useState({ callStatus: 'connected', duration: 0, note: '' });
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Log Call — {lead.name}</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Call Status</label>
            <select className="input-field" value={form.callStatus} onChange={e => setForm({ ...form, callStatus: e.target.value })}>
              <option value="connected">Connected</option>
              <option value="no_answer">No Answer</option>
              <option value="busy">Busy</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Duration (seconds)</label>
            <input type="number" className="input-field" value={form.duration} onChange={e => setForm({ ...form, duration: +e.target.value })} min={0} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Note</label>
            <textarea className="input-field resize-none" rows={3} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Call notes..." />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => onSubmit(form)} className="btn-primary flex-1">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function MyCalls() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLead, setActiveLead] = useState(null);
  const [showNote, setShowNote] = useState(false);
  const [showLogCall, setShowLogCall] = useState(false);
  const [activeTab, setActiveTab] = useState('history');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLeads = async () => {
    try {
      const res = await leadsAPI.getMyCalls();
      const allLeads = res.data.leads || [];

      // ── KEY FIX ──────────────────────────────────────────────────────────
      // Only show leads where the logged-in user has performed at least one call.
      // This ensures admin/super admin only see their OWN calls, not all callers'.
      const myLeads = allLeads.filter(lead =>
        lead.activities?.some(a =>
          a.type === 'call' && a.performedBy &&
          (a.performedBy === user?._id ||
           a.performedBy?._id === user?._id ||
           a.performedBy?.toString() === user?._id?.toString())
        )
      );

      // If user is a caller (not admin), show all assigned leads (original behaviour)
      const isAdmin = user?.role === 'admin' || user?.role === 'super admin';
      const finalLeads = isAdmin ? myLeads : allLeads;

      setLeads(finalLeads);
      if (finalLeads.length > 0 && !selected) setSelected(finalLeads[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeads(); }, []);

  const refreshSelected = async () => {
    if (!selected) return;
    const res = await leadsAPI.getOne(selected._id);
    setSelected(res.data.lead);
    setLeads(prev => prev.map(l => l._id === res.data.lead._id ? res.data.lead : l));
  };

  const handleCall = () => { if (!activeLead) setActiveLead(selected); };

  const handleCallEnd = async (duration) => {
    setSaving(true);
    try {
      await leadsAPI.logCall(activeLead._id, { duration, callStatus: 'connected', note: '' });
      setActiveLead(null);
      await refreshSelected();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleLogCall = async (form) => {
    setSaving(true);
    try {
      await leadsAPI.logCall(selected._id, form);
      setShowLogCall(false);
      await refreshSelected();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleNote = async (note, type) => {
    setSaving(true);
    try {
      await leadsAPI.addNote(selected._id, { note, type });
      setShowNote(false);
      await refreshSelected();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleStatus = async (status) => {
    try {
      await leadsAPI.updateStatus(selected._id, { status });
      await refreshSelected();
    } catch (err) { console.error(err); }
  };

  const handleRating = async (r) => {
    try {
      await leadsAPI.update(selected._id, { rating: r });
      await refreshSelected();
    } catch (err) { console.error(err); }
  };

  const copyPhone = (phone) => {
    navigator.clipboard.writeText(phone);
    setCopied(phone);
    setTimeout(() => setCopied(''), 2000);
  };

  const filtered = leads.filter(l =>
    !search ||
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search)
  );

  const activityIcon = (type) => {
    if (type === 'call') return <Phone className="w-3.5 h-3.5" />;
    if (type === 'whatsapp') return <MessageCircle className="w-3.5 h-3.5" />;
    if (type === 'sms') return <MessageSquare className="w-3.5 h-3.5" />;
    return <MessageSquare className="w-3.5 h-3.5" />;
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super admin';

  return (
    <div className="flex gap-0" style={{ height: 'calc(100vh - 48px)' }}>
      {/* Left: Call list */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-600" />
              {isAdmin ? 'My Logged Calls' : 'My Calls'}
            </h2>
            <button onClick={fetchLeads} className="text-gray-400 hover:text-indigo-600 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {isAdmin && (
            <p className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg mb-2">
              Showing only calls you personally made
            </p>
          )}
          <input
            className="input-field"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Phone className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {isAdmin ? 'No calls logged by you yet' : 'No leads assigned'}
              </p>
            </div>
          ) : (
            filtered.map(lead => {
              // Count calls made by this user on this lead
              const myCallCount = lead.activities?.filter(a =>
                a.type === 'call' && (
                  a.performedBy === user?._id ||
                  a.performedBy?._id === user?._id ||
                  a.performedBy?.toString() === user?._id?.toString()
                )
              ).length || 0;

              return (
                <div
                  key={lead._id}
                  onClick={() => setSelected(lead)}
                  className={`p-3.5 border-b border-gray-50 cursor-pointer hover:bg-indigo-50/40 transition-colors ${selected?._id === lead._id ? 'bg-indigo-50 border-l-2 border-l-indigo-600' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${selected?._id === lead._id ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {lead.name}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">{lead.phone}</p>
                    </div>
                    {myCallCount > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {myCallCount} call{myCallCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <StatusBadge status={lead.status} />
                  </div>
                  {lead.activities?.[0] && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="text-gray-400">{activityIcon(lead.activities[0].type)}</div>
                      <p className="text-xs text-gray-400">
                        {lead.activities[0].callDuration > 0 ? fmtDuration(lead.activities[0].callDuration) : 'No feedback'}
                      </p>
                      {lead.activities[0].callStatus && (
                        <span className={`text-xs uppercase font-medium ${lead.activities[0].callStatus === 'connected' ? 'text-green-600' : 'text-red-500'}`}>
                          {lead.activities[0].callStatus === 'connected' ? 'CONNECTED' : 'NO ANSWER'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Lead detail */}
      {selected ? (
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6 max-w-3xl mx-auto space-y-4">
            {/* Header */}
            <div className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <select value={selected.status} onChange={e => handleStatus(e.target.value)}
                      className="text-xs border-0 bg-transparent font-medium text-indigo-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-2 py-1 bg-indigo-50">
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(r => (
                        <button key={r} onClick={() => handleRating(r)}>
                          <Star className={`w-4 h-4 ${r <= selected.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Assigned to</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                      {selected.assignedTo?.name?.[0] || 'U'}
                    </div>
                    <p className="text-sm font-medium text-gray-700">{selected.assignedTo?.name || 'Unassigned'}</p>
                  </div>
                </div>
              </div>
              {activeLead?._id === selected._id && (
                <div className="mt-4"><CallTimer onStop={handleCallEnd} /></div>
              )}
            </div>

            {/* Lead info */}
            <div className="card p-5 grid grid-cols-2 gap-4">
              {[
                { label: 'Phone', value: selected.phone, copyable: true },
                { label: 'Email', value: selected.email || 'Empty' },
                { label: 'Alternate Phone', value: selected.alternatePhone || 'Empty', copyable: !!selected.alternatePhone },
                { label: 'Lead Source', value: selected.leadSource || 'Empty' },
                { label: 'Preferred Courses', value: selected.preferredCourses?.join(', ') || 'Empty' },
                { label: 'Location', value: selected.location || 'Empty' },
                { label: 'Last Qualification', value: selected.lastQualification || 'Empty' },
                { label: 'Budget', value: selected.budget ? `₹${selected.budget.toLocaleString()}` : 'Empty' },
              ].map(({ label, value, copyable }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${value === 'Empty' ? 'text-gray-300' : 'text-gray-800'}`}>{value}</p>
                    {copyable && value !== 'Empty' && (
                      <button onClick={() => copyPhone(value)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                        {copied === value ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="card p-4">
              <div className="grid grid-cols-5 gap-2">
                {[
                  { icon: Phone, label: 'CALL', action: handleCall, color: 'text-green-600', disabled: !!activeLead },
                  { icon: Clock, label: 'CALL LATER', action: () => handleStatus('Call Back Later'), color: 'text-orange-600' },
                  { icon: MessageCircle, label: 'WHATSAPP', action: () => leadsAPI.addNote(selected._id, { note: 'WhatsApp message sent', type: 'whatsapp' }).then(refreshSelected), color: 'text-green-500' },
                  { icon: MessageSquare, label: 'SMS', action: () => leadsAPI.addNote(selected._id, { note: 'SMS sent', type: 'sms' }).then(refreshSelected), color: 'text-blue-600' },
                  { icon: Plus, label: 'ADD NOTE', action: () => setShowNote(true), color: 'text-indigo-600' },
                ].map(({ icon: Icon, label, action, color, disabled }) => (
                  <button key={label} onClick={action} disabled={disabled}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl hover:bg-gray-50 transition-colors group disabled:opacity-40 disabled:cursor-not-allowed">
                    <div className={`w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center ${color} transition-colors`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{label}</span>
                  </button>
                ))}
              </div>
              {/* Initiate Call to Mobile — sends FCM push to caller's phone */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-3">
                <button
                  onClick={async () => {
                    try {
                      await leadsAPI.initiateCall(selected._id, selected.assignedTo?._id || selected.assignedTo);
                      alert('📲 Call notification sent to mobile app!');
                    } catch (err) {
                      alert('Failed to initiate call: ' + (err.response?.data?.message || err.message));
                    }
                  }}
                  style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  📲 Initiate Call to Mobile
                </button>
                <button onClick={() => setShowLogCall(true)} className="text-xs text-indigo-600 hover:underline">+ Log call manually</button>
              </div>
            </div>

            {/* Activity */}
            <div className="card p-5">
              <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-3">
                {['history', 'task'].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`text-sm font-medium capitalize pb-2 -mb-3 border-b-2 transition-colors ${activeTab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {t === 'history' ? 'Activity History' : 'Task'}
                  </button>
                ))}
              </div>
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {selected.activities?.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No activities yet</p>
                  ) : (
                    selected.activities?.map((a, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${a.type === 'call' ? 'bg-green-100 text-green-600' : a.type === 'note' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                          {activityIcon(a.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-800">
                              {a.type === 'call' ? `${fmtDuration(a.callDuration)} — ${a.callStatus?.toUpperCase() || ''}` : a.description}
                            </p>
                            <p className="text-xs text-gray-400 flex-shrink-0">
                              {a.createdAt ? formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }) : ''}
                            </p>
                          </div>
                          {a.type === 'call' && a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                          <p className="text-xs text-gray-400 mt-0.5">{a.performedBy?.name || ''}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {activeTab === 'task' && (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No tasks yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Phone className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Select a lead to view details</p>
          </div>
        </div>
      )}

      {showNote && <AddNoteModal onClose={() => setShowNote(false)} onSubmit={handleNote} />}
      {showLogCall && selected && <LogCallModal lead={selected} onClose={() => setShowLogCall(false)} onSubmit={handleLogCall} />}
    </div>
  );
}