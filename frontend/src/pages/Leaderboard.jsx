import { useState, useEffect } from 'react';

const PURPLE = '#5b3fc7';
const PURPLE_LIGHT = '#f0ecff';
const TEXT_MAIN = '#2d2d6b';
const TEXT_MUTED = '#888';
const GREEN = '#22a163';

const TABS = ['DAY', 'WEEK', 'MONTH', 'YEAR'];
const METRICS = ['Calls', 'Duration', 'Sales'];

function fmtDuration(sec) {
  if (!sec) return '0s';
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtMoney(n) {
  if (!n) return '₹0';
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function RankBadge({ rank }) {
  if (rank === 1) return <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>#1</span>;
  if (rank === 2) return <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>#2</span>;
  if (rank === 3) return <span style={{ background: '#fef3c7', color: '#b45309', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>#3</span>;
  return <span style={{ background: '#f3f4f6', color: TEXT_MUTED, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>#{rank}</span>;
}

function CallerCard({ caller, rank, metric }) {
  const initials = caller.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const primaryValue = metric === 'Calls' ? caller.calls
    : metric === 'Duration' ? fmtDuration(caller.duration)
    : fmtMoney(caller.sales);
  const primaryLabel = metric;

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12,
      padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(91,63,199,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: PURPLE_LIGHT, color: PURPLE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700
        }}>
          {initials}
        </div>
      </div>

      {/* Name + role */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_MAIN, marginBottom: 2 }}>{caller.name}</div>
        <div style={{ fontSize: 11, color: TEXT_MUTED }}>Caller</div>
        {(caller.firstCall || caller.lastCall) && (
          <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>
            {caller.firstCall && `First Call: ${caller.firstCall}`}
            {caller.firstCall && caller.lastCall && '  '}
            {caller.lastCall && `Last Call: ${caller.lastCall}`}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_MAIN, lineHeight: 1 }}>{caller.calls}</div>
          <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 3 }}>Calls</div>
          <div style={{ marginTop: 4 }}><RankBadge rank={rank} /></div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_MAIN, lineHeight: 1 }}>{fmtDuration(caller.duration)}</div>
          <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 3 }}>Duration</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: caller.sales > 0 ? GREEN : TEXT_MAIN, lineHeight: 1 }}>{caller.sales}</div>
          <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 3 }}>Sales</div>
        </div>
      </div>
    </div>
  );
}

function DateRangePicker({ value, onChange }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e5e2f5', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', background: '#fff', fontSize: 12, color: TEXT_MAIN }}
      onClick={() => {/* Future: open calendar */}}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <span style={{ fontWeight: 600 }}>{value}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
  );
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('DAY');
  const [metric, setMetric] = useState('Calls');
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('');

  // Set date range label based on tab
  useEffect(() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

    if (activeTab === 'DAY') {
      const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
      setDateRange(`${fmt(now)}-${fmt(tomorrow)}`);
    } else if (activeTab === 'WEEK') {
      const start = new Date(now); start.setDate(now.getDate() - now.getDay());
      const end = new Date(start); end.setDate(start.getDate() + 6);
      setDateRange(`${fmt(start)}-${fmt(end)}`);
    } else if (activeTab === 'MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateRange(`${fmt(start)}-${fmt(end)}`);
    } else {
      setDateRange(`01/01/${now.getFullYear()}-31/12/${now.getFullYear()}`);
    }
  }, [activeTab]);

  // Load leaderboard data
  useEffect(() => {
    setLoading(true);
    const loadData = async () => {
      try {
        // Map tab name to backend period param: DAY→day, WEEK→week, MONTH→month, YEAR→year
        const periodMap = { DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year' };
        const period = periodMap[activeTab] || 'week';
        const { reportsAPI } = await import('../services/api');
        const res = await reportsAPI.leaderboard({ period });
        // Backend returns { leaderboard: [{user, totalCalls, totalDuration, sales, connectedCalls}] }
        const raw = res.data?.leaderboard || [];
        // Normalize to shape CallerCard expects: { name, calls, duration, sales }
        const normalized = raw.map(item => ({
          _id: item.user?._id || item._id,
          name: item.user?.name || item.name || 'Unknown',
          calls: item.totalCalls || item.calls || 0,
          duration: item.totalDuration || item.duration || 0,
          sales: item.sales || 0,
          firstCall: item.firstCall || null,
          lastCall: item.lastCall || null,
        }));
        setData(normalized);
      } catch (err) {
        console.error('Leaderboard fetch error:', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeTab]);

  const filtered = data.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: TEXT_MAIN }}>Leaderboard</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2.5"
            style={{ cursor: 'pointer' }}
            onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 600); }}>
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5"/>
          </svg>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Analytics icon */}
          <button style={{ background: 'none', border: '1px solid #e5e2f5', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2">
              <polyline points="18 20 18 10"/><polyline points="12 20 12 4"/><polyline points="6 20 6 14"/>
            </svg>
          </button>
          {/* Download */}
          <button style={{ background: 'none', border: '1px solid #e5e2f5', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid #e5e2f5' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 24px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              color: activeTab === tab ? PURPLE : TEXT_MUTED,
              borderBottom: activeTab === tab ? `2px solid ${PURPLE}` : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.15s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <DateRangePicker value={dateRange} />

        {/* Metric selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e5e2f5', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', background: '#fff', fontSize: 12, color: TEXT_MAIN }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          <select
            value={metric}
            onChange={e => setMetric(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'none', fontSize: 12, color: TEXT_MAIN, cursor: 'pointer' }}
          >
            {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: 180, maxWidth: 300, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e5e2f5', borderRadius: 8, padding: '7px 12px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by teammember name"
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: TEXT_MAIN, width: '100%' }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160 }}>
          <div className="animate-spin" style={{ width: 28, height: 28, border: `4px solid ${PURPLE}`, borderTopColor: 'transparent', borderRadius: '50%' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_MAIN, marginBottom: 6 }}>No data yet</div>
          <div style={{ fontSize: 13, color: TEXT_MUTED }}>
            {search ? 'No team members match your search' : `No calls recorded for this ${activeTab.toLowerCase()}`}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((caller, i) => (
            <CallerCard key={caller._id || caller.name || i} caller={caller} rank={i + 1} metric={metric} />
          ))}
        </div>
      )}
    </div>
  );
}