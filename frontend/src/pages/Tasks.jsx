import { useState, useEffect, useRef } from 'react';
import { followupsAPI } from '../services/api';

const PURPLE = '#5b3fc7';
const PURPLE_LIGHT = '#f0ecff';
const TEXT_MAIN = '#2d2d6b';
const TEXT_MUTED = '#888';

const STATUS_COLORS = {
  pending: { bg: '#fff8e6', color: '#b45309' },
  done: { bg: '#e8f8f0', color: '#22a163' },
  late: { bg: '#fff0f0', color: '#e53e3e' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280' },
};

const PRIORITY_COLORS = {
  high: { bg: '#fff0f0', color: '#e53e3e' },
  medium: { bg: '#fff8e6', color: '#b45309' },
  low: { bg: '#e8f8f0', color: '#22a163' },
};

export default function Tasks() {
  const [activeTab, setActiveTab] = useState('Call Followups');
  const [forFilter, setForFilter] = useState('Me');
  const [dueFilter, setDueFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(['pending', 'late']);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdditional, setShowAdditional] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortField, setSortField] = useState('dueDate');
  const [sortDir, setSortDir] = useState('asc');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Map frontend status names to backend values
      // Backend uses 'upcoming' for pending, 'done', 'late', 'cancelled'
      const statusMap = { pending: 'upcoming', late: 'upcoming', done: 'done', cancelled: 'cancelled' };
      const mappedStatuses = [...new Set(statusFilter.map(s => statusMap[s] || s))];

      const res = await followupsAPI.getAll({
        forMe: forFilter === 'Me',
        due: dueFilter ? dueFilter.toLowerCase().replace(' ', '_') : undefined,
        status: mappedStatuses.join(','),
        type: activeTab === 'Call Followups' ? 'call_followup' : 'todo',
      });
      let items = res.data.followups || res.data.tasks || [];

      // Client-side: filter overdue if 'late' selected but 'pending' not (late = upcoming + past date)
      if (statusFilter.includes('late') && !statusFilter.includes('pending')) {
        items = items.filter(t => t.status === 'upcoming' && new Date(t.scheduledAt) < new Date());
      } else if (statusFilter.includes('pending') && !statusFilter.includes('late')) {
        items = items.filter(t => !(t.status === 'upcoming' && new Date(t.scheduledAt) < new Date()) || t.status === 'upcoming');
      }

      // Client-side priority filter
      if (priorityFilter) {
        items = items.filter(t => t.priority === priorityFilter);
      }

      setTasks(items);
    } catch (err) {
      console.error(err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [activeTab, forFilter, dueFilter, statusFilter.join(','), priorityFilter]);

  const additionalRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (additionalRef.current && !additionalRef.current.contains(e.target)) {
        setShowAdditional(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleStatus = (s) => {
    setStatusFilter(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
      stroke={sortField === field ? PURPLE : '#ccc'} strokeWidth="2.5">
      {sortField === field && sortDir === 'asc'
        ? <polyline points="18 15 12 9 6 15"/>
        : <polyline points="6 9 12 15 18 9"/>}
    </svg>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: TEXT_MAIN, display: 'flex', alignItems: 'center', gap: 8 }}>
            Tasks
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2.5"
              style={{ cursor: 'pointer' }} onClick={fetchTasks}>
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5"/>
            </svg>
          </div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 3 }}>
            Never miss a followup by creating task{' '}
            <span style={{ color: PURPLE, cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
              Learn More
            </span>
          </div>
        </div>

        {/* Bulk upload button */}
        <label style={{
          background: PURPLE, color: '#fff', border: 'none',
          padding: '9px 18px', borderRadius: 8, fontSize: 13,
          fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 7
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Bulk upload task
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              try {
                const formData = new FormData();
                formData.append('file', file);
                const res = await followupsAPI.import(formData);
                alert(`✅ Bulk upload complete: ${res.data.count} of ${res.data.total} tasks created.`);
                fetchTasks();
              } catch (err) {
                alert('Failed to import tasks: ' + (err.response?.data?.message || err.message));
              }
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderBottom: '2px solid #e5e2f5', marginBottom: 20 }}>
        {['Call Followups', 'Todo'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '9px 20px', border: 'none', background: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: activeTab === tab ? PURPLE : TEXT_MUTED,
              borderBottom: activeTab === tab ? `2px solid ${PURPLE}` : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7
            }}
          >
            {tab}
            {tab === 'Call Followups' && (
              <span style={{
                width: 20, height: 20, borderRadius: 6,
                border: `1.5px solid ${activeTab === tab ? PURPLE : '#ddd'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke={activeTab === tab ? PURPLE : TEXT_MUTED} strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {/* For filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500 }}>For:</span>

          <button
            onClick={() => setForFilter('Me')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 6, border: 'none',
              background: forFilter === 'Me' ? PURPLE : '#f3f1fb',
              color: forFilter === 'Me' ? '#fff' : TEXT_MAIN,
              fontSize: 12, fontWeight: 600, cursor: 'pointer'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke={forFilter === 'Me' ? '#fff' : PURPLE} strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Me
          </button>

          <button
            onClick={() => setForFilter('Team')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 6,
              border: forFilter === 'Team' ? 'none' : '1px solid #e5e2f5',
              background: forFilter === 'Team' ? PURPLE : '#f3f1fb',
              color: forFilter === 'Team' ? '#fff' : TEXT_MAIN,
              fontSize: 12, fontWeight: 600, cursor: 'pointer'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={forFilter === 'Team' ? '#fff' : PURPLE} strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Team
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={forFilter === 'Team' ? '#fff' : '#aaa'} strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: '#e5e2f5' }} />

        {/* Due filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500 }}>Due:</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            border: `1px solid ${dueFilter ? PURPLE : '#e5e2f5'}`, borderRadius: 6,
            background: dueFilter ? '#f0ecff' : '#fff', padding: '5px 10px', cursor: 'pointer',
            transition: 'all 0.15s'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <select
              value={dueFilter || ''}
              onChange={e => setDueFilter(e.target.value || null)}
              style={{ border: 'none', outline: 'none', background: 'none', fontSize: 12, color: dueFilter ? PURPLE : TEXT_MAIN, cursor: 'pointer', fontWeight: dueFilter ? 600 : 400 }}
            >
              <option value="">All</option>
              {['Today', 'Tomorrow', 'This Week', 'Overdue'].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {dueFilter && (
              <span
                onClick={(e) => { e.stopPropagation(); setDueFilter(null); }}
                style={{ cursor: 'pointer', color: PURPLE, fontWeight: 700, fontSize: 14, lineHeight: 1, marginLeft: 2 }}
                title="Clear filter"
              >×</span>
            )}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: '#e5e2f5' }} />

        {/* Status filter - colored squares */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500 }}>Status:</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            border: '1px solid #e5e2f5', borderRadius: 6,
            background: '#fff', padding: '5px 10px', cursor: 'pointer'
          }}>
            {/* Orange square = pending */}
            <div
              onClick={() => toggleStatus('pending')}
              style={{
                width: 16, height: 16, borderRadius: 3,
                background: '#f59e0b',
                opacity: statusFilter.includes('pending') ? 1 : 0.3,
                cursor: 'pointer', transition: 'opacity 0.15s'
              }}
              title="Pending"
            />
            {/* Red square = late/overdue */}
            <div
              onClick={() => toggleStatus('late')}
              style={{
                width: 16, height: 16, borderRadius: 3,
                background: '#e53e3e',
                opacity: statusFilter.includes('late') ? 1 : 0.3,
                cursor: 'pointer', transition: 'opacity 0.15s'
              }}
              title="Late / Overdue"
            />
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* Additional Filters */}
        <div ref={additionalRef} style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
          <span style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: 500 }}>Additional Filters:</span>
          <button
            onClick={() => setShowAdditional(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              border: `1.5px solid ${(showAdditional || priorityFilter) ? PURPLE : '#e5e2f5'}`,
              borderRadius: 6, padding: '5px 11px',
              background: (showAdditional || priorityFilter) ? PURPLE_LIGHT : '#fff',
              color: (showAdditional || priorityFilter) ? PURPLE : TEXT_MAIN,
              fontSize: 12, fontWeight: 600, cursor: 'pointer'
            }}
          >
            {priorityFilter ? `Priority: ${priorityFilter}` : 'Select filters'}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points={showAdditional ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}/>
            </svg>
          </button>
          {priorityFilter && (
            <span
              onClick={() => setPriorityFilter('')}
              style={{ cursor: 'pointer', color: PURPLE, fontWeight: 700, fontSize: 14 }}
              title="Clear"
            >×</span>
          )}
          {showAdditional && (
            <div style={{
              position: 'absolute', top: '110%', left: 0, zIndex: 200,
              background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12,
              boxShadow: '0 8px 24px rgba(91,63,199,0.12)', padding: 16, minWidth: 220
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Filter by Priority</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['', 'high', 'medium', 'low'].map(p => (
                  <div
                    key={p}
                    onClick={() => { setPriorityFilter(p); setShowAdditional(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                      background: priorityFilter === p ? PURPLE_LIGHT : 'transparent',
                      color: priorityFilter === p ? PURPLE : TEXT_MAIN,
                      fontWeight: priorityFilter === p ? 600 : 400, fontSize: 13,
                    }}
                  >
                    {p === '' ? (
                      <span style={{ fontSize: 13 }}>All Priorities</span>
                    ) : (
                      <>
                        <span style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: p === 'high' ? '#e53e3e' : p === 'medium' ? '#f59e0b' : '#22a163',
                          flexShrink: 0
                        }} />
                        <span style={{ textTransform: 'capitalize' }}>{p}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Spacer + Download */}
        <div style={{ flex: 1 }} />
        <button style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12, color: PURPLE, fontWeight: 600
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </button>
      </div>

      {/* Matching count */}
      <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 12 }}>
        <span style={{ fontWeight: 700, color: TEXT_MAIN }}>{tasks.length}</span> matching tasks found
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f0ecff' }}>
              {[
                { label: 'Lead', field: 'lead' },
                { label: 'Description', field: 'description' },
                { label: 'Assignee', field: 'assignee' },
                { label: 'Status', field: 'status' },
                { label: 'Due date', field: 'dueDate', highlight: !!dueFilter },
                { label: 'Priority', field: 'priority' },
                { label: 'Actions', field: null },
              ].map(col => (
                <th
                  key={col.label}
                  onClick={() => col.field && handleSort(col.field)}
                  style={{
                    padding: '11px 16px', textAlign: 'left',
                    fontSize: 12, fontWeight: 600,
                    color: sortField === col.field ? PURPLE : TEXT_MUTED,
                    background: col.highlight ? '#f3f1fb' : 'transparent',
                    cursor: col.field ? 'pointer' : 'default',
                    userSelect: 'none', whiteSpace: 'nowrap'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    {col.field && col.field !== 'description' && col.field !== 'assignee' && (
                      <SortIcon field={col.field} />
                    )}
                    {col.field === 'dueDate' && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5">
                        <polyline points="8 9 12 5 16 9"/><polyline points="16 15 12 19 8 15"/>
                      </svg>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center' }}>
                  <div className="animate-spin" style={{ width: 24, height: 24, border: `3px solid ${PURPLE}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }} />
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '80px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, color: '#ccc', fontWeight: 300, letterSpacing: 2 }}>No Tasks</div>
                </td>
              </tr>
            ) : (
              tasks.map((task, i) => (
                <tr key={task._id || i}
                  style={{ borderBottom: '1px solid #f9f8ff' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#faf9ff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Lead */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: TEXT_MAIN, fontWeight: 500 }}>
                    <div style={{ fontWeight: 600 }}>{task.lead?.name || '—'}</div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED }}>{task.lead?.phone}</div>
                  </td>
                  {/* Description */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#555', maxWidth: 200 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.description || task.note || '—'}
                    </div>
                  </td>
                  {/* Assignee */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: PURPLE_LIGHT, color: PURPLE,
                        fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {task.assignee?.name?.slice(0, 2).toUpperCase() || 'ME'}
                      </div>
                      <span style={{ fontSize: 12, color: TEXT_MAIN }}>{task.assignee?.name || 'Me'}</span>
                    </div>
                  </td>
                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10,
                      background: STATUS_COLORS[task.status]?.bg || '#f3f4f6',
                      color: STATUS_COLORS[task.status]?.color || TEXT_MUTED
                    }}>
                      {task.status || 'pending'}
                    </span>
                  </td>
                  {/* Due date */}
                  <td style={{ padding: '12px 16px', background: '#faf9ff', fontSize: 12, color: TEXT_MAIN }}>
                    {task.scheduledAt
                      ? new Date(task.scheduledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  {/* Priority */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10,
                      background: PRIORITY_COLORS[task.priority || 'low']?.bg || '#f3f4f6',
                      color: PRIORITY_COLORS[task.priority || 'low']?.color || TEXT_MUTED
                    }}>
                      {task.priority || 'Low'}
                    </span>
                  </td>
                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button title="Edit" style={{ background: 'none', border: '1px solid #e5e2f5', borderRadius: 6, padding: '4px 7px', cursor: 'pointer' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button title="Delete" style={{ background: 'none', border: '1px solid #e5e2f5', borderRadius: 6, padding: '4px 7px', cursor: 'pointer' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                          <path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}