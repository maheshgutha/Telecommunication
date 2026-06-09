import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, PhoneOff, Mail, MapPin, Award, IndianRupee, Globe, User, Calendar, Tag, Star, Edit3, Save, X, Plus, Clock, MessageCircle, MessageSquare, Copy, Check, Trash2, BookOpen, Smartphone } from 'lucide-react';
import { leadsAPI, campaignsAPI, usersAPI, coursesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import { formatDistanceToNow, format } from 'date-fns';

const STATUSES = ['Fresh', 'Connected', 'Call Not Responding', 'Call Back Later', 'Not interested', 'Demo Scheduled', 'Demo Done', 'Won', 'Lost'];
const SOURCES = ['Manual', 'Facebook', 'WhatsApp', 'Website', 'Excel', 'Referral'];
const MODES = ['Online', 'Offline', 'Hybrid'];

function fmtDuration(sec) {
  if (!sec) return '0s';
  const m = Math.floor(sec / 60); const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function CallTimer({ onStop }) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(ref.current);
  }, []);
  return (
    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm animate-pulse">
      <div className="w-3.5 h-3.5 bg-green-500 rounded-full animate-ping" />
      <div className="flex-1">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Call in progress</p>
        <p className="text-2xl font-mono font-bold text-green-800">{fmtDuration(elapsed)}</p>
      </div>
      <button onClick={() => onStop(elapsed)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm">
        <PhoneOff className="w-4 h-4" /> End Call
      </button>
    </div>
  );
}

function AddNoteModal({ onClose, onSubmit }) {
  const [note, setNote] = useState('');
  const [type, setType] = useState('note');
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-base">Add Note / Log Activity</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex gap-2 mb-4">
          {['note', 'whatsapp', 'sms'].map(t => (
            <button key={t} onClick={() => setType(t)} className={`text-xs px-3 py-1.5 rounded-full capitalize font-semibold transition-all ${type === t ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t}</button>
          ))}
        </div>
        <textarea className="input-field resize-none w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" rows={4} placeholder="Write details here..." value={note} onChange={e => setNote(e.target.value)} />
        <div className="flex gap-2.5 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1 rounded-xl py-2.5 font-semibold text-sm">Cancel</button>
          <button onClick={() => onSubmit(note, type)} className="btn-primary flex-1 rounded-xl py-2.5 font-semibold text-sm justify-center" disabled={!note.trim()}>Save Activity</button>
        </div>
      </div>
    </div>
  );
}

function LogCallModal({ lead, onClose, onSubmit }) {
  const [form, setForm] = useState({ callStatus: 'connected', duration: 0, note: '' });
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-base">Log Call — {lead.name}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Call Status</label>
            <select className="input-field w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.callStatus} onChange={e => setForm({ ...form, callStatus: e.target.value })}>
              <option value="connected">Connected</option>
              <option value="no_answer">No Answer</option>
              <option value="busy">Busy</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Duration (seconds)</label>
            <input type="number" className="input-field w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.duration} onChange={e => setForm({ ...form, duration: +e.target.value })} min={0} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Call Summary Note</label>
            <textarea className="input-field w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" rows={3} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Write call feedback notes..." />
          </div>
        </div>
        <div className="flex gap-2.5 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1 rounded-xl py-2.5 font-semibold text-sm">Cancel</button>
          <button onClick={() => onSubmit(form)} className="btn-primary flex-1 rounded-xl py-2.5 font-semibold text-sm justify-center">Save Call Log</button>
        </div>
      </div>
    </div>
  );
}

// ── Initiate Call Modal (website → mobile push notification) ─────────────────
function InitiateCallModal({ lead, callers, currentUser, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const isCaller = currentUser?.role === 'caller';
  // Caller sends to themselves; admin can pick any caller
  const [selectedCaller, setSelectedCaller] = useState(
    isCaller ? currentUser?._id : (lead?.assignedTo?._id || '')
  );

  const handleSend = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await leadsAPI.initiateCall(lead._id, selectedCaller || undefined);
      setResult({ success: true, message: res.data.message });
      if (onSuccess) onSuccess();
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Failed to send notification' });
    } finally {
      setLoading(false);
    }
  };

  const callersList = callers.filter(c => c.role === 'caller');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">📲 Initiate Call</h3>
              <p className="text-xs text-gray-500">Send notification to caller's mobile app</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Lead info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Lead</p>
            <p className="font-bold text-gray-800 text-lg">{lead?.name}</p>
            <p className="text-gray-500 font-mono text-sm">{lead?.phone}</p>
            {lead?.assignedTo?.name && (
              <p className="text-xs text-indigo-600 font-semibold mt-1">Assigned to: {lead.assignedTo.name}</p>
            )}
          </div>

          {/* Caller selector — only show for admin; caller always sends to themselves */}
          {isCaller ? (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
              <p className="text-indigo-700 text-sm font-semibold">
                📱 Sending to your mobile: <span className="font-bold">{currentUser?.name}</span>
              </p>
              <p className="text-indigo-500 text-xs mt-1">The notification will appear on your phone</p>
            </div>
          ) : callersList.length > 0 && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Send notification to</label>
              <select
                value={selectedCaller}
                onChange={e => setSelectedCaller(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Assigned Caller ({lead?.assignedTo?.name || 'None'}) --</option>
                {callersList.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-blue-700 text-xs leading-relaxed">
              💡 The caller will receive a push notification on their mobile app showing this lead's name and phone number. They can tap it to call directly.
            </p>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-xl p-4 border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-sm font-semibold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.success ? '✅ ' : '❌ '}{result.message}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-semibold text-sm">
            {result?.success ? 'Close' : 'Cancel'}
          </button>
          {!result?.success && (
            <button
              onClick={handleSend}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
              ) : (
                <><Smartphone className="w-4 h-4" />Send to Mobile</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LeadProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super admin';
  const isAdmin = user?.role === 'admin' || user?.role === 'super admin';

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [callers, setCallers] = useState([]);
  const [courses, setCourses] = useState([]);

  const [isCalling, setIsCalling] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showLogCallModal, setShowLogCallModal] = useState(false);
  const [showInitiateCallModal, setShowInitiateCallModal] = useState(false); // NEW
  const [copiedText, setCopiedText] = useState('');

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingInfo, setSavingInfo] = useState(false);

  const fetchLeadDetails = async () => {
    try {
      const res = await leadsAPI.getOne(id);
      setLead(res.data.lead);
      const l = res.data.lead;
      setEditForm({
        name: l.name || '',
        phone: l.phone || '',
        alternatePhone: l.alternatePhone || '',
        email: l.email || '',
        status: l.status || 'Fresh',
        rating: l.rating || 0,
        leadSource: l.leadSource || 'Manual',
        courseInterest: l.courseInterest?._id || l.courseInterest || '',
        mode: l.mode || '',
        budget: l.budget || 0,
        location: l.location || '',
        lastQualification: l.lastQualification || '',
        assignedTo: l.assignedTo?._id || '',
        campaign: l.campaign?._id || '',
      });
    } catch (err) {
      console.error('Failed to load lead details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
    campaignsAPI.getAll().then(res => setCampaigns(res.data.campaigns || [])).catch(console.error);
    coursesAPI.getAll().then(res => setCourses(res.data.courses || [])).catch(console.error);
    usersAPI.getAll().then(res => {
      setCallers((res.data.users || []).filter(u => u.role === 'caller' || u.role === 'admin' || u.role === 'super admin'));
    }).catch(console.error);
  }, [id]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleToggleStar = async () => {
    try {
      const res = await leadsAPI.update(lead._id, { isStarred: !lead.isStarred });
      setLead(prev => ({ ...prev, isStarred: res.data.lead.isStarred }));
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await leadsAPI.updateStatus(lead._id, { status: newStatus });
      setLead(res.data.lead);
      setEditForm(prev => ({ ...prev, status: newStatus }));
    } catch (err) { console.error(err); }
  };

  const handleRatingChange = async (newRating) => {
    try {
      const res = await leadsAPI.update(lead._id, { rating: newRating });
      setLead(res.data.lead);
      setEditForm(prev => ({ ...prev, rating: newRating }));
    } catch (err) { console.error(err); }
  };

  const handleDeleteLead = async () => {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) return;
    try {
      await leadsAPI.delete(lead._id);
      navigate('/leads');
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete lead'); }
  };

  const handleStartCall = () => { if (!isCalling) setIsCalling(true); };

  const handleCallEnded = async (duration) => {
    setIsCalling(false);
    setSavingInfo(true);
    try {
      await leadsAPI.logCall(lead._id, { duration, callStatus: 'connected', note: 'Autologged duration call' });
      await fetchLeadDetails();
    } catch (err) { console.error(err); }
    finally { setSavingInfo(false); }
  };

  const handleLogManualCall = async (form) => {
    setSavingInfo(true);
    try {
      await leadsAPI.logCall(lead._id, form);
      setShowLogCallModal(false);
      await fetchLeadDetails();
    } catch (err) { console.error(err); }
    finally { setSavingInfo(false); }
  };

  const handleAddNote = async (note, type) => {
    setSavingInfo(true);
    try {
      await leadsAPI.addNote(lead._id, { note, type });
      setShowNoteModal(false);
      await fetchLeadDetails();
    } catch (err) { console.error(err); }
    finally { setSavingInfo(false); }
  };

  const handleInstantActivity = async (type, desc) => {
    setSavingInfo(true);
    try {
      await leadsAPI.addNote(lead._id, { note: desc, type });
      await fetchLeadDetails();
    } catch (err) { console.error(err); }
    finally { setSavingInfo(false); }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const data = { ...editForm, budget: editForm.budget ? +editForm.budget : 0, assignedTo: editForm.assignedTo || null, campaign: editForm.campaign || null, courseInterest: editForm.courseInterest || null };
      const res = await leadsAPI.update(lead._id, data);
      setLead(res.data.lead);
      setIsEditingInfo(false);
    } catch (err) { alert(err.response?.data?.message || 'Failed to update lead profile information'); }
    finally { setSavingInfo(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading lead profile...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center bg-white p-8 rounded-2xl shadow-md max-w-sm">
          <X className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 text-lg">Lead Not Found</h3>
          <p className="text-gray-500 text-sm mt-1">The lead you are trying to view does not exist or has been deleted.</p>
          <button onClick={() => navigate('/leads')} className="btn-primary mt-5 inline-flex items-center gap-1.5"><ArrowLeft className="w-4 h-4" /> Back to Leads</button>
        </div>
      </div>
    );
  }

  const activityIcon = (type) => {
    if (type === 'call') return <Phone className="w-4 h-4 text-green-600" />;
    if (type === 'whatsapp') return <MessageCircle className="w-4 h-4 text-green-500" />;
    if (type === 'sms') return <MessageSquare className="w-4 h-4 text-blue-600" />;
    if (type === 'status_change') return <Tag className="w-4 h-4 text-orange-600" />;
    return <Clock className="w-4 h-4 text-indigo-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Top Navigation Banner */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => navigate('/leads')} className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-all active:scale-95">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 truncate">{lead.name}</h2>
              <button onClick={handleToggleStar} className="text-yellow-400 hover:scale-110 transition-transform active:scale-90">
                <Star className={`w-5 h-5 ${lead.isStarred ? 'fill-yellow-400' : 'text-gray-300'}`} />
              </button>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{lead._id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* ── Initiate Call Button (all users) ── */}
          <button
            onClick={() => setShowInitiateCallModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            title="Send call notification to mobile app"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">📲 Initiate Call</span>
          </button>

          <select
            value={lead.status}
            onChange={e => handleStatusChange(e.target.value)}
            className="text-xs font-semibold border border-indigo-200 rounded-xl px-3 py-2 bg-indigo-50/40 text-indigo-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all hover:bg-indigo-50"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {isSuperAdmin && (
            <button onClick={handleDeleteLead} className="w-9 h-9 rounded-xl border border-red-200 hover:bg-red-50 text-red-500 flex items-center justify-center transition-all hover:text-red-700 active:scale-95" title="Delete Lead">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/40">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" /> Basic Information
              </h3>
              {!isEditingInfo ? (
                <button onClick={() => setIsEditingInfo(true)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-indigo-50">
                  <Edit3 className="w-3.5 h-3.5" /> Edit Info
                </button>
              ) : (
                <button onClick={() => setIsEditingInfo(false)} className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-red-50">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>
            <form onSubmit={handleSaveInfo}>
              <div className="p-5 space-y-4">
                {isEditingInfo ? (
                  <div className="space-y-3.5">
                    {[
                      ['Full Name', 'name', 'text', true],
                      ['Phone Number', 'phone', 'text', true],
                      ['Alternate Phone', 'alternatePhone', 'text', false],
                      ['Email', 'email', 'email', false],
                      ['Location', 'location', 'text', false],
                      ['Last Qualification', 'lastQualification', 'text', false],
                    ].map(([label, field, type, required]) => (
                      <div key={field}>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
                        <input type={type} className="input-field w-full border border-gray-200 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={editForm[field]} onChange={e => setEditForm({ ...editForm, [field]: e.target.value })} required={required} />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Budget (INR)</label>
                      <input type="number" className="input-field w-full border border-gray-200 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.budget} onChange={e => setEditForm({ ...editForm, budget: +e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Lead Source</label>
                      <select className="input-field w-full border border-gray-200 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.leadSource} onChange={e => setEditForm({ ...editForm, leadSource: e.target.value })}>
                        {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    {isAdmin && (
                      <>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Assignee</label>
                          <select className="input-field w-full border border-gray-200 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.assignedTo} onChange={e => setEditForm({ ...editForm, assignedTo: e.target.value })}>
                            <option value="">Unassigned</option>
                            {callers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Campaign</label>
                          <select className="input-field w-full border border-gray-200 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.campaign} onChange={e => setEditForm({ ...editForm, campaign: e.target.value })}>
                            <option value="">No Campaign</option>
                            {campaigns.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                          </select>
                        </div>
                      </>
                    )}
                    <button type="submit" disabled={savingInfo} className="btn-primary w-full justify-center rounded-xl py-2.5 font-bold text-sm shadow-sm mt-4">
                      <Save className="w-4 h-4 mr-1.5" /> Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { icon: Phone, label: 'Phone', value: lead.phone, copyable: true },
                      { icon: Phone, label: 'Alternate Phone', value: lead.alternatePhone || '—', copyable: !!lead.alternatePhone },
                      { icon: Mail, label: 'Email', value: lead.email || '—' },
                      { icon: MapPin, label: 'Location', value: lead.location || '—' },
                      { icon: Award, label: 'Qualification', value: lead.lastQualification || '—' },
                      { icon: IndianRupee, label: 'Budget', value: lead.budget ? `₹${lead.budget.toLocaleString()}` : '—' },
                      { icon: Globe, label: 'Source', value: lead.leadSource },
                      { icon: User, label: 'Campaign', value: lead.campaign?.name || 'None' },
                      { icon: User, label: 'Assignee', value: lead.assignedTo?.name || 'Unassigned' },
                    ].map(({ icon: Icon, label, value, copyable }) => (
                      <div key={label} className="flex items-start gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 text-gray-400 mt-0.5"><Icon className="w-4 h-4" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="font-semibold text-gray-800 break-all">{value}</p>
                            {copyable && value !== '—' && (
                              <button type="button" onClick={() => copyToClipboard(value)} className="text-gray-400 hover:text-indigo-600 transition-colors flex-shrink-0">
                                {copiedText === value ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">Rating</span>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(r => (
                          <button type="button" key={r} onClick={() => handleRatingChange(r)} className="hover:scale-110 active:scale-95 transition-transform">
                            <Star className={`w-4 h-4 ${r <= lead.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-6">
          {isCalling && <CallTimer onStop={handleCallEnded} />}

          {/* Course Section */}
          <div className="card bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/40 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" /> Course Interest & Enrollment Mode
              </h3>
            </div>
            <div className="p-5">
              {isEditingInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Course Target</label>
                    <select className="input-field w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.courseInterest} onChange={e => setEditForm({ ...editForm, courseInterest: e.target.value })}>
                      <option value="">No Course Linked</option>
                      {courses.map(c => <option key={c._id} value={c._id}>{c.name} (₹{c.cost.toLocaleString()})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Learning Mode</label>
                    <select className="input-field w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={editForm.mode} onChange={e => setEditForm({ ...editForm, mode: e.target.value })}>
                      <option value="">Select Mode</option>
                      {MODES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2 bg-indigo-50/20 border border-indigo-100 rounded-2xl p-5 flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5"><BookOpen className="w-6 h-6" /></div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Selected Course</p>
                      <h4 className="text-lg font-bold text-gray-800">{lead.courseInterest?.name || 'No Course Selected'}</h4>
                      {lead.courseInterest?.description && <p className="text-xs text-gray-500 leading-relaxed pt-1">{lead.courseInterest.description}</p>}
                      {lead.courseInterest?.duration && (
                        <div className="inline-flex items-center gap-1 bg-white border border-indigo-100 text-[10px] font-bold text-indigo-600 px-2 py-0.5 rounded-full mt-2.5 shadow-xs">
                          <Clock className="w-3 h-3" /> {lead.courseInterest.duration}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-emerald-50/25 border border-emerald-100 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Course Fee</p>
                      <h4 className="text-3xl font-extrabold text-emerald-800 mt-1">{lead.courseInterest?.cost ? `₹${lead.courseInterest.cost.toLocaleString()}` : '₹0'}</h4>
                    </div>
                    <div className="pt-4 border-t border-emerald-100/50 mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Learning Mode</span>
                      {lead.mode ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">{lead.mode}</span>
                      ) : <span className="text-xs text-gray-400 italic">Not set</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Center */}
          <div className="card bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Quick Action Center</h3>
              {/* Initiate Call button inside action center too */}
              <button
                onClick={() => setShowInitiateCallModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-xs font-bold transition-colors border border-green-200"
              >
                <Smartphone className="w-3.5 h-3.5" /> 📲 Send to Mobile
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { icon: Phone, label: 'CALL NOW', action: handleStartCall, color: 'bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow', disabled: isCalling },
                { icon: Clock, label: 'CALLBACK LATER', action: () => handleStatusChange('Call Back Later'), color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200' },
                { icon: MessageCircle, label: 'WHATSAPP LOG', action: () => handleInstantActivity('whatsapp', 'WhatsApp outreach message sent'), color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250' },
                { icon: MessageSquare, label: 'SMS LOG', action: () => handleInstantActivity('sms', 'SMS template message dispatched'), color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200' },
                { icon: Plus, label: 'ADD NOTE', action: () => setShowNoteModal(true), color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200' },
              ].map(({ icon: Icon, label, action, color, disabled }) => (
                <button key={label} onClick={action} disabled={disabled}
                  className={`flex flex-col items-center justify-center gap-2 py-3 px-2.5 rounded-xl font-bold transition-all text-center ${color} disabled:opacity-40 disabled:cursor-not-allowed`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] tracking-wider font-extrabold uppercase">{label}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <button onClick={() => setShowLogCallModal(true)} className="text-xs font-bold text-indigo-650 hover:text-indigo-800 hover:underline transition-colors">
                + Log call records manually
              </button>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="card bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide mb-6 pb-2.5 border-b border-gray-100">Activity & calling history</h3>
            <div className="relative border-l border-gray-100 ml-4 space-y-6">
              {lead.activities?.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No activity history logged yet.</p>
                </div>
              ) : (
                lead.activities?.map((a, i) => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute -left-3.5 top-0 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-xs flex items-center justify-center text-gray-500">
                      {activityIcon(a.type)}
                    </div>
                    <div className="bg-gray-50/50 rounded-xl p-3.5 border border-gray-100 hover:border-gray-200 transition-colors shadow-2xs">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="font-bold text-sm text-gray-800">
                          {a.type === 'call' ? (
                            <span>Logged Call — {fmtDuration(a.callDuration)} ({a.callStatus?.toUpperCase() || 'CONNECTED'})</span>
                          ) : a.type === 'status_change' ? (
                            <span className="text-orange-700">{a.description}</span>
                          ) : (
                            <span>{a.description}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 font-medium">{a.createdAt ? formatDistanceToNow(new Date(a.createdAt), { addSuffix: true }) : ''}</span>
                      </div>
                      {a.type === 'call' && a.description && (
                        <p className="text-xs text-gray-500 italic mt-1.5 bg-white border border-gray-100/50 rounded-lg p-2">"{a.description}"</p>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/30 text-[10px] text-gray-400 font-semibold">
                        <span>BY: {a.performedBy?.name || 'System / Unassigned'}</span>
                        {a.createdAt && <span>{format(new Date(a.createdAt), 'dd MMM yyyy, hh:mm a')}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNoteModal && <AddNoteModal onClose={() => setShowNoteModal(false)} onSubmit={handleAddNote} />}
      {showLogCallModal && <LogCallModal lead={lead} onClose={() => setShowLogCallModal(false)} onSubmit={handleLogManualCall} />}

      {/* NEW: Initiate Call Modal */}
      {showInitiateCallModal && (
        <InitiateCallModal
          lead={lead}
          callers={callers}
          currentUser={user}
          onClose={() => setShowInitiateCallModal(false)}
          onSuccess={fetchLeadDetails}
        />
      )}
    </div>
  );
}