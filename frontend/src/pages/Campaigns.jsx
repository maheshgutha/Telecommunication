import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignsAPI } from '../services/api';

const PURPLE = '#5b3fc7';
const PURPLE_LIGHT = '#f0ecff';
const TEXT_MAIN = '#2d2d6b';
const TEXT_MUTED = '#888';

function CreateCampaignModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await campaignsAPI.create(form); onSuccess(); onClose(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 8px 32px rgba(91,63,199,0.12)', width: '100%', maxWidth: 440, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: TEXT_MAIN }}>New Campaign</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa', lineHeight: 1 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <input
              placeholder="Campaign name *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e2f5', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <textarea
              placeholder="Description"
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e2f5', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px', border: '1px solid #e5e2f5', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: '#fff', color: TEXT_MAIN }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: PURPLE, color: '#fff', fontWeight: 600 }}>
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssigneeAvatars({ callers }) {
  if (!callers || callers.length === 0) return <span style={{ color: TEXT_MUTED, fontSize: 12 }}>—</span>;
  const shown = callers.slice(0, 4);
  const extra = callers.length - 4;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((c, i) => (
        <div key={c._id || i} style={{
          width: 26, height: 26, borderRadius: '50%',
          background: '#d4c9f7', color: PURPLE,
          fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #fff',
          marginLeft: i === 0 ? 0 : -6, zIndex: shown.length - i,
          position: 'relative',
        }}>
          {c.name?.slice(0, 2).toUpperCase() || 'U'}
        </div>
      ))}
      {extra > 0 && (
        <div style={{ fontSize: 10, color: TEXT_MUTED, marginLeft: 4 }}>+{extra}</div>
      )}
    </div>
  );
}

function ProgressCircle({ value = 0 }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#e5e2f5" strokeWidth="3" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={PURPLE} strokeWidth="3"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
        <text x="18" y="22" textAnchor="middle" fontSize="9" fill={TEXT_MAIN} fontWeight="700">{pct}%</text>
      </svg>
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  return `${mins}m ago`;
}

function fmtLeads(n) {
  if (!n) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(2)}K`;
  return String(n);
}

// Generic dropdown filter component
function FilterDropdown({ label, options, value, onChange, icon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = !!value;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: active ? PURPLE_LIGHT : '#fff',
          border: `1px solid ${active ? PURPLE : '#e5e2f5'}`,
          borderRadius: 8, padding: '7px 12px', cursor: 'pointer',
          fontSize: 13, color: active ? PURPLE : TEXT_MUTED,
          fontWeight: active ? 600 : 400, whiteSpace: 'nowrap',
          transition: 'all 0.15s'
        }}
      >
        {icon && icon}
        {active ? value : label}
        {active
          ? <span onClick={e => { e.stopPropagation(); onChange(''); }} style={{ fontWeight: 700, fontSize: 15, lineHeight: 1, marginLeft: 2, color: PURPLE }}>×</span>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        }
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, zIndex: 300,
          background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12,
          boxShadow: '0 8px 24px rgba(91,63,199,0.12)', padding: 8, minWidth: 180
        }}>
          <div
            onClick={() => { onChange(''); setOpen(false); }}
            style={{ padding: '8px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: !value ? PURPLE : TEXT_MUTED, background: !value ? PURPLE_LIGHT : 'transparent', fontWeight: !value ? 600 : 400, marginBottom: 2 }}
          >
            All
          </div>
          {options.map(opt => (
            <div
              key={opt.value || opt}
              onClick={() => { onChange(opt.value || opt); setOpen(false); }}
              style={{
                padding: '8px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 13,
                color: value === (opt.value || opt) ? PURPLE : TEXT_MAIN,
                background: value === (opt.value || opt) ? PURPLE_LIGHT : 'transparent',
                fontWeight: value === (opt.value || opt) ? 600 : 400,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {opt.dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.dot, flexShrink: 0 }} />}
              {opt.label || opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Filter states
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState('');

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const res = await campaignsAPI.getAll();
      const raw = res.data.campaigns || [];
      // Compute progress from statusBreakdown (backend returns this for every campaign)
      const withProgress = raw.map(c => {
        const breakdown = c.statusBreakdown || [];
        let total = 0, called = 0, won = 0;
        breakdown.forEach(s => {
          total += s.count;
          if (s._id !== 'Fresh') called += s.count;
          if (s._id === 'Won') won += s.count;
        });
        // Use computed total if backend totalLeads is stale
        const totalLeads = total || c.totalLeads || 0;
        const progress = totalLeads > 0 ? Math.round((called / totalLeads) * 100) : 0;
        return { ...c, totalLeads, called, won, progress };
      });
      setCampaigns(withProgress);
    }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadCampaigns(); }, []);

  // Derive unique assignees and creators from data
  const allAssignees = [...new Map(
    campaigns.flatMap(c => c.assignedCallers || []).map(a => [a._id, a])
  ).values()];

  const allCreators = [...new Map(
    campaigns.filter(c => c.createdBy).map(c => [c.createdBy._id || c.createdBy, c.createdBy])
  ).values()];

  // Date filter ranges
  const dateRanges = {
    'Today': 1,
    'Last 7 days': 7,
    'Last 30 days': 30,
    'Last 3 months': 90,
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  // Apply all filters
  let filtered = campaigns.filter(c => {
    // Search
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false;
    // Priority
    if (priorityFilter && c.priority !== priorityFilter) return false;
    // Date
    if (dateFilter && dateRanges[dateFilter]) {
      const cutoff = Date.now() - dateRanges[dateFilter] * 24 * 60 * 60 * 1000;
      if (new Date(c.createdAt).getTime() < cutoff) return false;
    }
    // Assignee
    if (assigneeFilter) {
      const has = (c.assignedCallers || []).some(a => (a._id || a) === assigneeFilter);
      if (!has) return false;
    }
    // Created by
    if (createdByFilter) {
      const creator = c.createdBy?._id || c.createdBy;
      if (creator !== createdByFilter) return false;
    }
    return true;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    let av = a[sortField], bv = b[sortField];
    if (sortField === 'createdAt') { av = new Date(av); bv = new Date(bv); }
    if (sortField === 'totalLeads' || sortField === 'progress') { av = Number(av) || 0; bv = Number(bv) || 0; }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }) => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      {sortField === field
        ? <polyline points={sortDir === 'asc' ? '8 9 12 5 16 9' : '8 15 12 19 16 15'} />
        : <><polyline points="8 9 12 5 16 9"/><polyline points="16 15 12 19 8 15"/></>
      }
    </svg>
  );

  const refresh = () => loadCampaigns();

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: TEXT_MAIN, display: 'flex', alignItems: 'center', gap: 8 }}>
            Campaign
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2.5" style={{ cursor: 'pointer' }} onClick={refresh}>
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5"/>
            </svg>
          </div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>
            Your calling list sorted.{' '}
            <span style={{ color: PURPLE, cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>Learn More</span>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ background: PURPLE, color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          + Create New
        </button>
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 180, maxWidth: 360, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e2f5', borderRadius: 8, padding: '7px 12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search campaign"
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: TEXT_MAIN, width: '100%' }}
          />
          {search && <span onClick={() => setSearch('')} style={{ cursor: 'pointer', color: '#aaa', fontWeight: 700, fontSize: 15 }}>×</span>}
        </div>

        {/* Priority filter */}
        <FilterDropdown
          label="Priority"
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={[
            { label: 'High', value: 'high', dot: '#e53e3e' },
            { label: 'Medium', value: 'medium', dot: '#f59e0b' },
            { label: 'Low', value: 'low', dot: '#22a163' },
          ]}
          icon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          }
        />

        {/* Date filter */}
        <FilterDropdown
          label="Date"
          value={dateFilter}
          onChange={setDateFilter}
          options={['Today', 'Last 7 days', 'Last 30 days', 'Last 3 months']}
          icon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          }
        />

        {/* Assignee filter */}
        <FilterDropdown
          label="Select Assignee"
          value={assigneeFilter ? (allAssignees.find(a => a._id === assigneeFilter)?.name || assigneeFilter) : ''}
          onChange={(val) => {
            if (!val) { setAssigneeFilter(''); return; }
            const found = allAssignees.find(a => a.name === val);
            setAssigneeFilter(found?._id || val);
          }}
          options={allAssignees.map(a => ({ label: a.name, value: a.name }))}
          icon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          }
        />

        {/* Created by filter */}
        <FilterDropdown
          label="Select Created by"
          value={createdByFilter ? (typeof allCreators.find(c => (c._id || c) === createdByFilter) === 'object' ? allCreators.find(c => (c._id || c) === createdByFilter)?.name : createdByFilter) : ''}
          onChange={(val) => {
            if (!val) { setCreatedByFilter(''); return; }
            const found = allCreators.find(c => c.name === val);
            setCreatedByFilter(found?._id || val);
          }}
          options={allCreators.filter(c => c && c.name).map(c => ({ label: c.name, value: c.name }))}
          icon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          }
        />
      </div>

      {/* Active filter summary */}
      {(priorityFilter || dateFilter || assigneeFilter || createdByFilter) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: TEXT_MUTED }}>Active filters:</span>
          {[
            priorityFilter && { label: `Priority: ${priorityFilter}`, clear: () => setPriorityFilter('') },
            dateFilter && { label: `Date: ${dateFilter}`, clear: () => setDateFilter('') },
            assigneeFilter && { label: `Assignee: ${allAssignees.find(a => a._id === assigneeFilter)?.name || assigneeFilter}`, clear: () => setAssigneeFilter('') },
            createdByFilter && { label: `Created by: ${allCreators.find(c => (c._id || c) === createdByFilter)?.name || createdByFilter}`, clear: () => setCreatedByFilter('') },
          ].filter(Boolean).map((f, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: PURPLE_LIGHT, color: PURPLE, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
              {f.label}
              <span onClick={f.clear} style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>×</span>
            </span>
          ))}
          <span
            onClick={() => { setPriorityFilter(''); setDateFilter(''); setAssigneeFilter(''); setCreatedByFilter(''); }}
            style={{ fontSize: 11, color: PURPLE, cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
          >Clear all</span>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
            <div className="animate-spin" style={{ width: 28, height: 28, border: `4px solid ${PURPLE}`, borderTopColor: 'transparent', borderRadius: '50%' }} />
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0ecff', background: '#faf9ff' }}>
                {[
                  { label: 'Name', field: 'name' },
                  { label: 'Priority', field: 'priority' },
                  { label: 'Assignee', field: 'assignee' },
                  { label: 'Total Leads', field: 'totalLeads' },
                  { label: 'Progress', field: 'progress' },
                  { label: 'Created on', field: 'createdAt' },
                  { label: 'Actions', field: null },
                ].map(col => (
                  <th
                    key={col.label}
                    onClick={() => col.field && handleSort(col.field)}
                    style={{
                      padding: '12px 18px', textAlign: 'left', fontSize: 12,
                      color: sortField === col.field ? PURPLE : TEXT_MUTED,
                      fontWeight: 600, cursor: col.field ? 'pointer' : 'default',
                      userSelect: 'none', whiteSpace: 'nowrap'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      {col.field && <SortIcon field={col.field} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 18px', textAlign: 'center', color: TEXT_MUTED, fontSize: 13 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📢</div>
                    {search || priorityFilter || dateFilter || assigneeFilter || createdByFilter
                      ? 'No campaigns match your filters'
                      : 'No campaigns yet'}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c._id}
                    style={{ borderBottom: '1px solid #f9f8ff', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#faf9ff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => navigate(`/campaigns/${c._id}`)}
                  >
                    {/* Name */}
                    <td style={{ padding: '14px 18px', fontSize: 13, color: TEXT_MAIN, fontWeight: 600 }}>
                      @{c.name}
                    </td>

                    {/* Priority flag */}
                    <td style={{ padding: '14px 18px' }}>
                      {c.priority ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          background: c.priority === 'high' ? '#fff0f0' : c.priority === 'medium' ? '#fff8e6' : '#e8f8f0',
                          color: c.priority === 'high' ? '#e53e3e' : c.priority === 'medium' ? '#b45309' : '#22a163',
                          textTransform: 'capitalize'
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                          {c.priority}
                        </span>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                        </svg>
                      )}
                    </td>

                    {/* Assignee avatars */}
                    <td style={{ padding: '14px 18px' }}>
                      <AssigneeAvatars callers={c.assignedCallers} />
                    </td>

                    {/* Total leads */}
                    <td style={{ padding: '14px 18px', fontSize: 13, color: TEXT_MAIN }}>
                      {fmtLeads(c.totalLeads || 0)}
                    </td>

                    {/* Progress circle */}
                    <td style={{ padding: '14px 18px' }} onClick={e => e.stopPropagation()}>
                      <ProgressCircle value={c.progress || 0} />
                    </td>

                    {/* Created on */}
                    <td style={{ padding: '14px 18px', fontSize: 12, color: TEXT_MUTED }}>
                      {timeAgo(c.createdAt)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 18px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          title="Analytics"
                          style={{ background: 'none', border: '1px solid #e5e2f5', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          onClick={() => navigate(`/campaigns/${c._id}`)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2">
                            <polyline points="18 20 18 10"/><polyline points="12 20 12 4"/><polyline points="6 20 6 14"/>
                          </svg>
                        </button>
                        <button
                          title="Refresh"
                          style={{ background: 'none', border: '1px solid #e5e2f5', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          onClick={loadCampaigns}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2">
                            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && <CreateCampaignModal onClose={() => setShowCreate(false)} onSuccess={loadCampaigns} />}
    </div>
  );
}