import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { leadsAPI, campaignsAPI, usersAPI, coursesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['Fresh', 'Connected', 'Call Not Responding', 'Call Back Later', 'Not interested', 'Demo Scheduled', 'Demo Done', 'Won', 'Lost'];
const SOURCES = ['Manual', 'Facebook', 'WhatsApp', 'Website', 'Excel', 'Referral'];
const COURSES = ['MBA', 'BBA', 'B.Tech', 'MCA', 'B.Sc', 'M.Tech', 'B.Com', 'M.Com'];

// ✅ Moved OUTSIDE component to prevent remounting on every render
const Field = ({ label, children, required }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export default function AddLead() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    name: '', phone: '', alternatePhone: '', email: '',
    status: 'Fresh', leadSource: 'Manual', preferredCourses: [],
    courseInterest: '', mode: '',
    budget: '', location: '', lastQualification: '',
    nextFollowupDate: '', demoScheduledDate: '', demoDoneDate: '',
    assignedTo: '', campaign: '',
  });

  useEffect(() => {
    Promise.all([campaignsAPI.getAll(), usersAPI.getAll(), coursesAPI.getAll()]).then(([c, u, cr]) => {
      setCampaigns(c.data.campaigns || []);
      setUsers(u.data.users || []);
      setCourses(cr.data.courses || []);
    });
    if (isEdit) {
      setLoading(true);
      leadsAPI.getOne(id).then(res => {
        const l = res.data.lead;
        setForm({
          name: l.name || '', phone: l.phone || '', alternatePhone: l.alternatePhone || '',
          email: l.email || '', status: l.status || 'Fresh', leadSource: l.leadSource || 'Manual',
          preferredCourses: l.preferredCourses || [], budget: l.budget || '',
          courseInterest: l.courseInterest?._id || l.courseInterest || '',
          mode: l.mode || '',
          location: l.location || '', lastQualification: l.lastQualification || '',
          nextFollowupDate: l.nextFollowupDate?.slice(0, 16) || '',
          demoScheduledDate: l.demoScheduledDate?.slice(0, 16) || '',
          demoDoneDate: l.demoDoneDate?.slice(0, 16) || '',
          assignedTo: l.assignedTo?._id || '', campaign: l.campaign?._id || '',
        });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleCourse = (c) =>
    set('preferredCourses',
      form.preferredCourses.includes(c)
        ? form.preferredCourses.filter(x => x !== c)
        : [...form.preferredCourses, c]
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, budget: form.budget ? +form.budget : 0, assignedTo: form.assignedTo || user._id };
      if (isEdit) await leadsAPI.update(id, data);
      else await leadsAPI.create(data);
      navigate('/leads');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save lead');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-48">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/leads')}
          className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Lead' : 'Add New Lead'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic info */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 text-sm">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name" required>
              <input
                className="input-field"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Enter full name"
                required
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="abc@xyz.com"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone" required>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-gray-500 text-sm">🇮🇳 +91</span>
                <input
                  className="input-field rounded-l-none"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </Field>
            <Field label="Alternate Phone">
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-gray-500 text-sm">🇮🇳 +91</span>
                <input
                  className="input-field rounded-l-none"
                  value={form.alternatePhone}
                  onChange={e => set('alternatePhone', e.target.value)}
                  placeholder="Alternate number"
                />
              </div>
            </Field>
          </div>
          <Field label="Location">
            <input
              className="input-field"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="City, State"
            />
          </Field>
        </div>

        {/* Lead details */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 text-sm">Lead Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Lead Source">
              <select className="input-field" value={form.leadSource} onChange={e => set('leadSource', e.target.value)}>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Interested Course">
              <select className="input-field" value={form.courseInterest} onChange={e => set('courseInterest', e.target.value)}>
                <option value="">Select Interested Course</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.name} (₹{c.cost.toLocaleString()})</option>
                ))}
              </select>
            </Field>
            <Field label="Study Mode">
              <select className="input-field" value={form.mode} onChange={e => set('mode', e.target.value)}>
                <option value="">Select Mode</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </Field>
          </div>
          <Field label="Preferred Courses">
            <div className="flex flex-wrap gap-2">
              {COURSES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCourse(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    form.preferredCourses.includes(c)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Budget">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              <input
                type="number"
                className="input-field pl-7"
                value={form.budget}
                onChange={e => set('budget', e.target.value)}
                placeholder="20,000"
              />
            </div>
          </Field>
          <Field label="Last Qualification">
            <input
              className="input-field"
              value={form.lastQualification}
              onChange={e => set('lastQualification', e.target.value)}
              placeholder="Qualification details..."
            />
          </Field>
        </div>

        {/* Dates */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 text-sm">Scheduling</h3>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Next Follow-up">
              <input
                type="datetime-local"
                className="input-field"
                value={form.nextFollowupDate}
                onChange={e => set('nextFollowupDate', e.target.value)}
              />
            </Field>
            <Field label="Demo Scheduled">
              <input
                type="datetime-local"
                className="input-field"
                value={form.demoScheduledDate}
                onChange={e => set('demoScheduledDate', e.target.value)}
              />
            </Field>
            <Field label="Demo Done">
              <input
                type="datetime-local"
                className="input-field"
                value={form.demoDoneDate}
                onChange={e => set('demoDoneDate', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Assignment */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 text-sm">Assignment</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Assign To">
              <select className="input-field" value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)}>
                <option value="">Assign to me</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
              </select>
            </Field>
            <Field label="Campaign">
              <select className="input-field" value={form.campaign} onChange={e => set('campaign', e.target.value)}>
                <option value="">No Campaign</option>
                {campaigns.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/leads')} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : isEdit ? 'Update Lead' : 'Add Lead'}
          </button>
        </div>
      </form>
    </div>
  );
}