import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadsAPI, followupsAPI, reportsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

const PURPLE = '#5b3fc7';
const PURPLE_LIGHT = '#f0ecff';
const TEXT_MAIN = '#2d2d6b';
const TEXT_MUTED = '#888';
const GREEN = '#22a163';
const RED = '#e53e3e';
const AMBER = '#d97706';
const COLORS = [PURPLE, '#8b5cf6', '#ec4899', '#f59e0b', GREEN, RED, '#3b82f6', '#a78bfa'];
const BORDER = '#e5e2f5';

function fmtDuration(sec) {
  if (!sec) return '0s';
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const StatCard = ({ icon, label, value, sub, bg, iconColor }) => (
  <div className="stat-card" style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ color: iconColor, display: 'flex' }}>{icon}</span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, color: TEXT_MUTED, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: TEXT_MAIN, lineHeight: 1.1, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{sub}</div>}
    </div>
  </div>
);

const SortIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const filterRows = [
  { label: 'All Leads' },
  { label: 'Leads Assigned to Caller' },
  { label: 'My Leads' },
];

function FiltersTable({ leadsStats }) {
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [lastRefresh] = useState('Just now');
  const calRef = useState(null);

  const formatDateLabel = (date) => {
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const dateLabel = formatDateLabel(selectedDate);

  // Mini calendar state
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() };
  });

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCalMonth(prev => {
    const d = new Date(prev.year, prev.month - 1); return { year: d.getFullYear(), month: d.getMonth() };
  });
  const nextMonth = () => setCalMonth(prev => {
    const d = new Date(prev.year, prev.month + 1); return { year: d.getFullYear(), month: d.getMonth() };
  });

  const getCount = (filterLabel, col) => {
    if (!leadsStats) return 0;
    const map = {
      'All Leads': { Fresh: leadsStats?.fresh || 0, Active: leadsStats?.active || 0, Won: leadsStats?.won || 0, Lost: leadsStats?.lost || 0 },
      'Leads Assigned to Caller': { Fresh: 0, Active: 0, Won: 0, Lost: 0 },
      'My Leads': { Fresh: leadsStats?.myFresh || 0, Active: leadsStats?.myActive || 0, Won: leadsStats?.myWon || 0, Lost: leadsStats?.myLost || 0 },
    };
    return map[filterLabel]?.[col] ?? 0;
  };

  const filtered = filterRows.filter(r => r.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, overflow: 'hidden', marginBottom: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 10px', borderBottom: '1px solid #f3f1fb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MAIN} strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 14, color: TEXT_MAIN }}>Quick Filter Matrices</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          <span style={{ fontSize: 11, color: TEXT_MUTED }}>Created on</span>
          <div
            onClick={() => setShowCalendar(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: TEXT_MAIN, fontWeight: 600, border: '1px solid #e5e2f5', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', background: showCalendar ? '#f0ecff' : '#fff' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {dateLabel}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          {showCalendar && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, zIndex: 200,
              background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12,
              boxShadow: '0 8px 24px rgba(91,63,199,0.12)', padding: 16, minWidth: 260
            }}>
              {/* Month navigation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PURPLE, fontWeight: 700, fontSize: 16, padding: '2px 6px' }}>‹</button>
                <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_MAIN }}>
                  {new Date(calMonth.year, calMonth.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PURPLE, fontWeight: 700, fontSize: 16, padding: '2px 6px' }}>›</button>
              </div>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: TEXT_MUTED, padding: '2px 0' }}>{d}</div>
                ))}
              </div>
              {/* Days grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {Array.from({ length: getFirstDayOfMonth(calMonth.year, calMonth.month) }).map((_, i) => (
                  <div key={`e${i}`} />
                ))}
                {Array.from({ length: getDaysInMonth(calMonth.year, calMonth.month) }).map((_, i) => {
                  const day = i + 1;
                  const thisDate = new Date(calMonth.year, calMonth.month, day);
                  const isSelected = thisDate.toDateString() === selectedDate.toDateString();
                  const isToday = thisDate.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={day}
                      onClick={() => { setSelectedDate(thisDate); setShowCalendar(false); }}
                      style={{
                        textAlign: 'center', fontSize: 12, padding: '5px 2px', borderRadius: 6, cursor: 'pointer',
                        background: isSelected ? PURPLE : isToday ? '#f0ecff' : 'transparent',
                        color: isSelected ? '#fff' : isToday ? PURPLE : TEXT_MAIN,
                        fontWeight: isSelected || isToday ? 700 : 400,
                      }}
                    >{day}</div>
                  );
                })}
              </div>
              {/* Quick options */}
              <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                {['Today', 'Yesterday', 'This Week'].map(opt => {
                  const d = new Date();
                  const optDate = opt === 'Yesterday' ? new Date(d.setDate(d.getDate() - 1)) : new Date();
                  return (
                    <button key={opt} onClick={() => { setSelectedDate(optDate); setShowCalendar(false); }} style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 20, border: `1px solid ${PURPLE}`,
                      background: 'transparent', color: PURPLE, cursor: 'pointer', fontWeight: 600
                    }}>{opt}</button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '6px 18px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: TEXT_MUTED }}>Refreshed: {lastRefresh}</span>
      </div>

      <div style={{ padding: '0 18px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8f7ff', border: '1px solid #e5e2f5', borderRadius: 8, padding: '6px 12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search filters..."
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: TEXT_MAIN, width: '100%' }}
          />
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #f0ecff', background: '#faf9ff' }}>
            <th style={{ padding: '8px 18px', textAlign: 'left', fontSize: 12, color: TEXT_MUTED, fontWeight: 600 }}>
              Filters <SortIcon />
            </th>
            {['Fresh', 'Active', 'Won', 'Lost'].map(col => (
              <th key={col} style={{ padding: '8px 18px', textAlign: 'center', fontSize: 12, color: TEXT_MUTED, fontWeight: 600 }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #f9f8ff' }}>
              <td style={{ padding: '12px 18px', fontSize: 13, color: TEXT_MAIN, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                {row.label}
              </td>
              <td style={{ padding: '12px 18px', textAlign: 'center', fontSize: 13, color: TEXT_MAIN, fontWeight: 500 }}>
                {getCount(row.label, 'Fresh')}
              </td>
              <td style={{ padding: '12px 18px', textAlign: 'center', fontSize: 13, color: TEXT_MAIN, fontWeight: 500 }}>
                {getCount(row.label, 'Active')}
              </td>
              <td style={{ padding: '12px 18px', textAlign: 'center', fontSize: 13, color: GREEN, fontWeight: 600 }}>
                {getCount(row.label, 'Won')}
              </td>
              <td style={{ padding: '12px 18px', textAlign: 'center', fontSize: 13, color: RED, fontWeight: 600 }}>
                {getCount(row.label, 'Lost')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [callers, setCallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // Leaderboard tab & user modal states
  const [leaderboardTab, setLeaderboardTab] = useState('callers');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userAnalysisData, setUserAnalysisData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Caller Priorities workspace states
  const [activeQueueIndex, setActiveQueueIndex] = useState(null);
  const [workspaceLead, setWorkspaceLead] = useState(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [callStatus, setCallStatus] = useState('connected');
  const [callNote, setCallNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');
  const [nextFollowupNote, setNextFollowupNote] = useState('');
  const [savingCall, setSavingCall] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super admin';
  const isCaller = user?.role === 'caller' || (!isAdmin && !isSuperAdmin);

  const openAnalysisModal = async (userId) => {
    setSelectedUserId(userId);
    setModalLoading(true);
    setUserAnalysisData(null);
    try {
      const res = await reportsAPI.userAnalysis(userId);
      setUserAnalysisData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const closeAnalysisModal = () => {
    setSelectedUserId(null);
    setUserAnalysisData(null);
  };

  const handleReassignLead = async (leadId, callerId) => {
    if (!callerId) return;
    setUpdatingId(leadId);
    try {
      await leadsAPI.update(leadId, { assignedTo: callerId });
      // Refresh admin data
      try {
        const adminRes = await reportsAPI.adminAnalysis();
        if (adminRes.data) setAdminStats(adminRes.data);
      } catch (e) { console.warn('admin-analysis refresh failed:', e.message); }
    } catch (err) {
      console.error(err);
      alert('Failed to reassign lead: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const sendWhatsAppTemplate = (phone, name) => {
    const cleanedPhone = phone.replace(/[^0-9]/g, '');
    const message = `Hello ${name}, this is ${user?.name || 'your caller'} from AOTMS. Just wanted to follow up on our scheduled chat. Please let me know when you're free. Thanks!`;
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanedPhone.length === 10 ? '91' + cleanedPhone : cleanedPhone}?text=${encodedMsg}`, '_blank');
  };

  const exportToCSV = () => {
    if (!adminStats || !adminStats.campaignPerformance) return;
    const headers = ['Campaign Name', 'Total Leads', 'Called Leads', 'Won Leads', 'Lost Leads', 'Conversion Rate %'];
    const rows = adminStats.campaignPerformance.map(c => {
      const convPct = c.totalLeads > 0 ? Math.round((c.won / c.totalLeads) * 100) : 0;
      return [
        `"${c.name}"`,
        c.totalLeads,
        c.called,
        c.won,
        c.lost,
        `${convPct}%`
      ];
    });
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campaign_performance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchData = async () => {
    setFetchError(null);
    try {
      if (isAdmin || isSuperAdmin) {
        const [statsRes, fuRes, leadsRes, adminRes, usersRes] = await Promise.all([
          leadsAPI.getStats().catch(e => { throw new Error(`leads/stats API: ${e.response?.data?.message || e.message}`); }),
          followupsAPI.getAll({ date: 'today' }).catch(e => { throw new Error(`followups API: ${e.response?.data?.message || e.message}`); }),
          leadsAPI.getMyCalls().catch(e => { throw new Error(`leads/my-calls API: ${e.response?.data?.message || e.message}`); }),
          reportsAPI.adminAnalysis().catch(e => { console.warn('admin-analysis API unavailable:', e.message); return { data: null }; }),
          usersAPI.getAll().catch(e => { throw new Error(`users API: ${e.response?.data?.message || e.message}`); })
        ]);
        setStats(statsRes.data);
        setFollowups(fuRes.data.followups || []);
        setRecentLeads((leadsRes.data.leads || []).slice(0, 8));
        if (adminRes.data) setAdminStats(adminRes.data);
        setCallers(usersRes.data.users?.filter(u => u.role === 'caller') || []);
      } else {
        const [statsRes, fuRes, leadsRes] = await Promise.all([
          leadsAPI.getStats().catch(e => { throw new Error(`leads/stats API: ${e.response?.data?.message || e.message}`); }),
          followupsAPI.getAll({ date: 'today' }).catch(e => { throw new Error(`followups API: ${e.response?.data?.message || e.message}`); }),
          leadsAPI.getMyCalls().catch(e => { throw new Error(`leads/my-calls API: ${e.response?.data?.message || e.message}`); })
        ]);
        setStats(statsRes.data);
        setFollowups(fuRes.data.followups || []);
        setRecentLeads((leadsRes.data.leads || []).slice(0, 8));
      }
    } catch (err) {
      console.error(err);
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role) {
      fetchData();
    }
  }, [user?.role]);

  const refresh = () => {
    setLoading(true);
    fetchData();
  };

  // Call timer effect
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Load lead details when calling workspace opens
  useEffect(() => {
    if (activeQueueIndex !== null && stats?.startMyDayQueue?.[activeQueueIndex]) {
      const leadId = stats.startMyDayQueue[activeQueueIndex].lead._id;
      setWorkspaceLoading(true);
      setWorkspaceLead(null);
      setCallDuration(0);
      setTimerActive(true);
      setCallStatus('connected');
      setCallNote('');
      setNewStatus('');
      setNextFollowupDate('');
      setNextFollowupNote('');
      
      leadsAPI.getOne(leadId)
        .then(res => {
          setWorkspaceLead(res.data.lead);
          setNewStatus(res.data.lead.status);
        })
        .catch(err => console.error(err))
        .finally(() => setWorkspaceLoading(false));
    } else {
      setTimerActive(false);
    }
  }, [activeQueueIndex, stats]);

  const handleSaveCall = async () => {
    if (!workspaceLead) return;
    setSavingCall(true);
    try {
      // 1. Log call activity
      await leadsAPI.logCall(workspaceLead._id, {
        duration: callDuration,
        callStatus,
        note: callNote
      });

      // 2. Update status if updated in UI
      if (newStatus && newStatus !== workspaceLead.status) {
        await leadsAPI.updateStatus(workspaceLead._id, { status: newStatus });
      }

      // 3. Create follow-up if date is set
      if (nextFollowupDate) {
        await followupsAPI.create({
          lead: workspaceLead._id,
          scheduledAt: new Date(nextFollowupDate),
          note: nextFollowupNote || 'Scheduled from calling queue workspace'
        });
      }

      // Move to next or close workspace
      if (activeQueueIndex < (stats.startMyDayQueue.length - 1)) {
        setActiveQueueIndex(prev => prev + 1);
      } else {
        setActiveQueueIndex(null);
        refresh();
      }
    } catch (err) {
      console.error(err);
      alert('Error saving call outcome: ' + err.message);
    } finally {
      setSavingCall(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
      <div style={{ width: 32, height: 32, border: `4px solid ${PURPLE}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  // -------------------------------------------------------------
  // CALLER PORTAL DASHBOARD VIEW
  // -------------------------------------------------------------
  const renderCallerDashboard = () => {
    const callsToday = stats?.todayCalls?.count || 0;
    const quotaPercentage = Math.min(100, Math.round((callsToday / 30) * 100));
    const startMyDayQueue = stats?.startMyDayQueue || [];

    // Circular ring constants
    const strokeWidth = 8;
    const size = 100;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (quotaPercentage / 100) * circumference;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Banner Alert for Overdue Follow-ups */}
        {stats?.overdueFollowupsCount > 0 && (
          <div style={{ background: '#fff0f0', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED, fontWeight: 'bold', fontSize: 18 }}>⚠️</div>
              <div>
                <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 14.5 }}>Overdue Follow-up Actions Required</div>
                <div style={{ fontSize: 12.5, color: '#b91c1c', marginTop: 2 }}>You have {stats.overdueFollowupsCount} lead callbacks scheduled in the past that are pending.</div>
              </div>
            </div>
            {startMyDayQueue.length > 0 && (
              <button 
                onClick={() => setActiveQueueIndex(0)} 
                style={{ background: RED, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(229, 62, 62, 0.2)' }}
              >
                Launch Priorities Queue
              </button>
            )}
          </div>
        )}

        {/* Action shortcut panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/><line x1="12" y1="19" x2="16" y2="19"/><line x1="14" y1="17" x2="14" y2="21"/>
              </svg>
            </div>
            <button onClick={() => navigate('/tasks')} style={{ border: `1.5px solid ${PURPLE}`, color: PURPLE, background: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
              Schedule a Callback
            </button>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: PURPLE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>
              </svg>
            </div>
            <button onClick={() => navigate('/leads/new')} style={{ border: `1.5px solid ${PURPLE}`, color: PURPLE, background: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
              Create New Lead Profile
            </button>
          </div>
        </div>

        {/* KPIs row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
          {/* Progress Ring Card */}
          <div className="stat-card" style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
              <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="#f3f0ff" strokeWidth={strokeWidth} />
                <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke={PURPLE} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.1 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: TEXT_MAIN }}>{callsToday}</span>
                <span style={{ fontSize: 8, color: TEXT_MUTED, marginTop: 1 }}>/ 30 Target</span>
              </div>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_MAIN }}>Daily Target</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: PURPLE, marginTop: 3 }}>{quotaPercentage}% Done</div>
            </div>
          </div>

          <StatCard 
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            label="Total Talk Time" value={fmtDuration(stats?.todayCalls?.duration || 0)} sub="All calls logged today" bg="#e8f8f0" iconColor={GREEN}
          />
          <StatCard 
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
            label="Calling Streak" value={`🔥 ${stats?.streak || 0} Days`} sub="Consecutive days logged" bg="#fff8e6" iconColor={AMBER}
          />
          <StatCard 
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
            label="Wins This Week" value={`🏆 ${stats?.weeklyWins || 0}`} sub="Won / Demo Scheduled" bg={PURPLE_LIGHT} iconColor={PURPLE}
          />
          <StatCard 
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 7 22 7 22 12"/></svg>}
            label="My Team Rank" value={`#${stats?.myRank || 1} of ${stats?.totalCallers || 1}`} sub={`Top dialer: ${stats?.topCallerCalls || 0}`} bg="#fcfbfe" iconColor={PURPLE}
          />
        </div>

        {/* Priority calling queue and sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                Start My Day prioritized Call Queue
              </div>
              {startMyDayQueue.length > 0 && (
                <button 
                  onClick={() => setActiveQueueIndex(0)} 
                  style={{ background: PURPLE, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  🚀 Run Queue
                </button>
              )}
            </div>

            {startMyDayQueue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: TEXT_MUTED, fontSize: 13 }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>🎉</span>
                Great job! Your calling queue is completely empty today.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_MUTED, height: 28 }}>
                      <th style={{ textAlign: 'left', fontWeight: 600, paddingBottom: 8 }}>Student Details</th>
                      <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 8 }}>Status</th>
                      <th style={{ textAlign: 'left', fontWeight: 600, paddingBottom: 8 }}>Priority Reason</th>
                      <th style={{ textAlign: 'right', fontWeight: 600, paddingBottom: 8 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {startMyDayQueue.slice(0, 15).map((item, idx) => (
                      <tr key={item.lead._id} style={{ borderBottom: '1px solid #faf9ff', height: 48 }}>
                        <td style={{ padding: '8px 0' }}>
                          <div style={{ fontWeight: 600, color: TEXT_MAIN }}>{item.lead.name}</div>
                          <div style={{ fontSize: 11, color: TEXT_MUTED }}>{item.lead.phone} • {item.lead.campaign?.name || 'Manual'}</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px 0' }}>
                          <StatusBadge status={item.lead.status} />
                        </td>
                        <td style={{ padding: '8px 0' }}>
                          <span style={{ 
                            fontSize: 11, 
                            fontWeight: 600, 
                            background: item.score === 1 ? '#fff0f0' : item.score === 2 ? '#fff8e6' : '#f0ecff', 
                            color: item.score === 1 ? RED : item.score === 2 ? AMBER : PURPLE,
                            padding: '3px 8px',
                            borderRadius: 12
                          }}>
                            {item.queueReason}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px 0' }}>
                          <button 
                            onClick={() => sendWhatsAppTemplate(item.lead.phone, item.lead.name)}
                            style={{ background: '#e8f8f0', color: GREEN, border: 'none', padding: '5px 8px', borderRadius: 6, fontSize: 11, marginRight: 6, cursor: 'pointer', fontWeight: 600 }}
                            title="WhatsApp Template"
                          >
                            💬 WA
                          </button>
                          <button 
                            onClick={() => setActiveQueueIndex(idx)}
                            style={{ background: '#f3f0ff', color: PURPLE, border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = PURPLE; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f3f0ff'; e.currentTarget.style.color = PURPLE; }}
                          >
                            📞 Call
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Demos and schedules */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Upcoming Demos with countdowns */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                My Upcoming Demos
              </div>
              {stats?.upcomingDemos?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: TEXT_MUTED, fontSize: 12.5 }}>No upcoming demos scheduled.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stats?.upcomingDemos?.map(d => {
                    const demoDate = new Date(d.demoScheduledDate);
                    const isToday = demoDate.toDateString() === new Date().toDateString();
                    
                    let countdownText = null;
                    if (isToday) {
                      const diffMs = demoDate.getTime() - Date.now();
                      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      if (diffMs > 0) {
                        countdownText = `Starts in ${diffHrs > 0 ? `${diffHrs}h ` : ''}${diffMins}m`;
                      } else {
                        countdownText = 'Started / Passed';
                      }
                    }
                    
                    return (
                      <div key={d._id} style={{ border: '1px solid #f0ecff', borderRadius: 8, padding: 12, background: '#faf9ff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <strong style={{ color: TEXT_MAIN, fontSize: 13 }}>{d.name}</strong>
                          <span style={{ fontSize: 10, background: isToday ? '#fff0f0' : '#e8f8f0', color: isToday ? RED : GREEN, padding: '2px 6px', borderRadius: 10, fontWeight: 600 }}>
                            {isToday ? 'Today' : 'Demo'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>Phone: {d.phone}</div>
                        <div style={{ fontSize: 11, color: PURPLE, fontWeight: 600, marginTop: 4 }}>
                          📅 {demoDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {countdownText && (
                          <div style={{ fontSize: 10.5, color: RED, fontWeight: 700, marginTop: 4, background: '#fff0f0', padding: '3px 8px', borderRadius: 4, display: 'inline-block' }}>
                            ⏰ {countdownText}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My Weekly Sparkline Trend */}
            {stats?.trendThisWeek && (
              <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
                <div style={{ fontWeight: 600, color: TEXT_MAIN, fontSize: 13.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  My Weekly Dial Trends
                </div>
                <ResponsiveContainer width="100%" height={90}>
                  <BarChart data={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, idx) => ({
                    day: dayName,
                    'This Week': stats.trendThisWeek[idx] || 0,
                    'Last Week': stats.trendLastWeek[idx] || 0,
                  }))}>
                    <XAxis dataKey="day" stroke={TEXT_MUTED} fontSize={9} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="This Week" fill={PURPLE} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Last Week" fill="#cbd5e1" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, fontSize: 10, color: TEXT_MUTED, marginTop: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: PURPLE, borderRadius: 2 }} /> This Week</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: '#cbd5e1', borderRadius: 2 }} /> Last Week</div>
                </div>
              </div>
            )}

            {/* Stage Distribution */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                <span style={{ fontWeight: 600, color: TEXT_MAIN, fontSize: 14 }}>My Leads by Stages</span>
              </div>
              {stats?.statusCounts && stats.statusCounts.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={120}>
                    <PieChart>
                      <Pie data={stats.statusCounts.map(s => ({ name: s._id, value: s.count }))} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value">
                        {stats.statusCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                    {stats.statusCounts.slice(0, 6).map((s, i) => (
                      <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, fontSize: 11 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s._id}</span>
                        <span style={{ fontWeight: 600, color: TEXT_MAIN }}>{s.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: TEXT_MUTED, fontSize: 12 }}>No leads data found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick filter table */}
        <div>
          <FiltersTable leadsStats={stats} />
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // ADMIN PORTAL DASHBOARD VIEW
  // -------------------------------------------------------------
  const renderAdminDashboard = () => {
    if (!adminStats) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: 12 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_MAIN }}>Analytics Temporarily Unavailable</div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, textAlign: 'center', maxWidth: 340 }}>
            The admin analytics API could not be reached (404). Your other dashboard data has loaded successfully.<br/>
            Please check that the backend <code style={{ background: '#f3f1fb', padding: '1px 6px', borderRadius: 4 }}>reports/admin-analysis</code> route is running.
          </div>
          <button
            onClick={() => { reportsAPI.adminAnalysis().then(r => setAdminStats(r.data)).catch(e => console.warn(e)); }}
            style={{ marginTop: 8, background: PURPLE, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >Retry Analytics</button>
        </div>
      );
    }
    const liveCallers = adminStats.teamStatus || [];
    const workload = adminStats.followupsLoad || [];
    const upcomingDemos = adminStats.upcomingDemos || [];
    const totalCalls = liveCallers.reduce((sum, c) => sum + c.callsToday, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Warning panel for unassigned leads */}
        {adminStats?.unassignedCount > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: AMBER, fontWeight: 'bold', fontSize: 18 }}>⚠️</div>
              <div>
                <div style={{ fontWeight: 700, color: '#92400e', fontSize: 14.5 }}>Unassigned Leads Alert</div>
                <div style={{ fontSize: 12.5, color: '#b45309', marginTop: 2 }}>There are {adminStats.unassignedCount} fresh leads currently in the system without an assigned caller.</div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/team-operations')} 
              style={{ background: AMBER, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)' }}
            >
              Assign Leads Now
            </button>
          </div>
        )}

        {/* KPIs row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard 
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            label="Total Leads In System" value={stats?.total || 0} sub="All time database size" bg={PURPLE_LIGHT} iconColor={PURPLE}
          />
          <StatCard 
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            label="Unassigned Leads Warning" value={adminStats?.unassignedCount || 0} sub="Awaiting distribution" bg="#fff0f0" iconColor={RED}
          />
          <StatCard 
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>}
            label="Team Calls Logged Today" value={totalCalls} sub="Dialed by team members" bg="#e8f8f0" iconColor={GREEN}
          />
          <StatCard 
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            label="Team Overdue Follow-ups" value={adminStats?.overdueFollowupsCount || 0} sub="Late lead callbacks pending" bg="#fff8e6" iconColor={AMBER}
          />
        </div>

        {/* Live Callers & Follow-ups */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Live Caller status */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Callers Activity & Live Status
              </div>
              {liveCallers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: TEXT_MUTED, fontSize: 13 }}>No caller accounts set up yet.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_MUTED, height: 28 }}>
                        <th style={{ textAlign: 'left', fontWeight: 600, paddingBottom: 8 }}>Caller Name</th>
                        <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 8 }}>Status</th>
                        <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 8 }}>Calls Logged Today</th>
                        <th style={{ textAlign: 'right', fontWeight: 600, paddingBottom: 8 }}>Last Call Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveCallers.map(caller => (
                        <tr 
                          key={caller.user?._id}
                          onClick={() => openAnalysisModal(caller.user?._id)}
                          style={{ borderBottom: '1px solid #faf9ff', height: 44, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#faf9ff'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: PURPLE_LIGHT, color: PURPLE, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {caller.user?.name?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ color: TEXT_MAIN }}>{caller.user?.name}</strong>
                              <div style={{ fontSize: 10, color: TEXT_MUTED }}>{caller.user?.email}</div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: caller.isActive ? GREEN : TEXT_MUTED }}>
                              <span className={caller.isActive ? 'pulse-dot' : ''} style={{ width: 8, height: 8, borderRadius: '50%', background: caller.isActive ? GREEN : '#cbd5e1' }} />
                              {caller.isActive ? 'Active Now' : 'Idle'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: TEXT_MAIN }}>
                            {caller.callsToday}
                          </td>
                          <td style={{ textAlign: 'right', color: TEXT_MUTED }}>
                            {caller.lastCallTime ? new Date(caller.lastCallTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <style>{`
                    .pulse-dot {
                      box-shadow: 0 0 0 0 rgba(34, 161, 99, 0.4);
                      animation: pulse 1.5s infinite;
                    }
                    @keyframes pulse {
                      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 161, 99, 0.7); }
                      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 161, 99, 0); }
                      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 161, 99, 0); }
                    }
                  `}</style>
                </div>
              )}
            </div>

            {/* Per-Caller Daily Progress Bars */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Per-Caller Daily Dial Targets (Quota: 30 Calls)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {liveCallers.map(caller => {
                  const callsToday = caller.callsToday || 0;
                  const quotaPct = Math.min(100, Math.round((callsToday / 30) * 100));
                  const barColor = callsToday >= 25 ? GREEN : callsToday >= 10 ? AMBER : RED;
                  return (
                    <div key={caller.user?._id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                        <span style={{ fontWeight: 600, color: TEXT_MAIN }}>{caller.user?.name}</span>
                        <span style={{ fontWeight: 700, color: barColor }}>{callsToday} / 30 ({quotaPct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: '#f1f0f6', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${quotaPct}%`, height: '100%', background: barColor, borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Overdue Follow-ups with inline reassignment */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Overdue Follow-ups List & Reassignment
              </div>
              {adminStats?.detailedOverdueFollowups?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: TEXT_MUTED, fontSize: 13 }}>🎉 No overdue follow-ups across the team!</div>
              ) : (
                <div style={{ overflowX: 'auto', maxHeight: 220, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_MUTED, height: 28 }}>
                        <th style={{ textAlign: 'left', fontWeight: 600, paddingBottom: 8 }}>Lead Target</th>
                        <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 8 }}>Scheduled At</th>
                        <th style={{ textAlign: 'right', fontWeight: 600, paddingBottom: 8 }}>Assign Caller</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminStats.detailedOverdueFollowups.slice(0, 15).map(fu => (
                        <tr key={fu._id} style={{ borderBottom: '1px solid #faf9ff', height: 42 }}>
                          <td>
                            <strong style={{ color: TEXT_MAIN }}>{fu.lead?.name || 'Lead'}</strong>
                            <div style={{ fontSize: 11, color: TEXT_MUTED }}>Assigned: {fu.assignedTo?.name || 'Unassigned'}</div>
                          </td>
                          <td style={{ textAlign: 'center', color: RED, fontWeight: 600 }}>
                            {new Date(fu.scheduledAt).toLocaleDateString()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <select
                              disabled={updatingId === fu.lead?._id}
                              value={fu.assignedTo?._id || ''}
                              onChange={(e) => handleReassignLead(fu.lead?._id, e.target.value)}
                              style={{ border: '1px solid #e5e2f5', borderRadius: 6, padding: '3px 6px', fontSize: 12, outline: 'none', color: TEXT_MAIN }}
                            >
                              <option value="">Select Caller...</option>
                              {callers.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Caller workload Allocation table */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Caller Follow-up Workload Allocation (Due Today)
              </div>
              {workload.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: TEXT_MUTED, fontSize: 13 }}>No follow-up workloads assigned for today.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_MUTED, height: 28 }}>
                        <th style={{ textAlign: 'left', fontWeight: 600, paddingBottom: 8 }}>Caller Name</th>
                        <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 8 }}>Role</th>
                        <th style={{ textAlign: 'right', fontWeight: 600, paddingBottom: 8 }}>Scheduled Callbacks Today</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workload.map(item => (
                        <tr key={item.user?._id} style={{ borderBottom: '1px solid #faf9ff', height: 38 }}>
                          <td style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff8e6', color: AMBER, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {item.user?.name?.[0]?.toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600, color: TEXT_MAIN }}>{item.user?.name}</span>
                          </td>
                          <td style={{ textAlign: 'center', color: TEXT_MUTED }}>
                            {item.user?.role}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: PURPLE }}>
                            {item.count} calls due
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* In-App Operations Alerts Feed */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Operations Alerts Panel
              </div>
              {adminStats?.notifications?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: TEXT_MUTED, fontSize: 12 }}>No recent operations alerts.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                  {adminStats.notifications.slice(0, 10).map(note => {
                    let badgeBg = '#f0ecff', badgeColor = PURPLE;
                    if (note.type === 'overdue') { badgeBg = '#fff0f0'; badgeColor = RED; }
                    else if (note.type === 'demo') { badgeBg = '#e8f8f0'; badgeColor = GREEN; }
                    else if (note.type === 'idle') { badgeBg = '#fff8e6'; badgeColor = AMBER; }
                    return (
                      <div key={note.id} style={{ display: 'flex', flexDirection: 'column', gap: 3, background: '#faf9ff', border: '1px solid #f0ecff', borderRadius: 8, padding: 8, fontSize: 11.5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ background: badgeBg, color: badgeColor, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8, textTransform: 'uppercase' }}>
                            {note.title}
                          </span>
                          <span style={{ fontSize: 9, color: TEXT_MUTED }}>
                            {new Date(note.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: TEXT_MAIN, fontWeight: 500, lineHeight: 1.3 }}>{note.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scheduled Demos */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Demos Scheduled (This Week)
              </div>
              {upcomingDemos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: TEXT_MUTED, fontSize: 12.5 }}>No demos booked this calendar week.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                  {upcomingDemos.map(demo => (
                    <div key={demo._id} style={{ border: '1px solid #e8f8f0', borderRadius: 8, padding: 12, background: '#fafdfb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong style={{ color: TEXT_MAIN, fontSize: 13 }}>{demo.name}</strong>
                        <span style={{ fontSize: 9.5, background: '#e8f8f0', color: GREEN, padding: '2px 6px', borderRadius: 8, fontWeight: 700 }}>Demo Slot</span>
                      </div>
                      <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>Course: {demo.preferredCourses?.join(', ') || 'N/A'}</div>
                      <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>Assigned Caller: {demo.assignedTo?.name || 'Unassigned'}</div>
                      <div style={{ fontSize: 11.5, color: GREEN, fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        📅 {new Date(demo.demoScheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Daily call trends bar chart */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 600, color: TEXT_MAIN, fontSize: 13.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Daily Call Volume (Last 7 Days)
              </div>
              {adminStats?.dailyVolume?.length > 0 ? (
                <ResponsiveContainer width="100%" height={165}>
                  <BarChart data={adminStats.dailyVolume.map(v => ({ name: v._id.slice(5), calls: v.count }))}>
                    <XAxis dataKey="name" stroke={TEXT_MUTED} fontSize={10} tickLine={false} />
                    <YAxis stroke={TEXT_MUTED} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(91, 63, 199, 0.04)' }} />
                    <Bar dataKey="calls" fill={PURPLE} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 165, color: TEXT_MUTED, fontSize: 12.5 }}>No calls logged recently.</div>
              )}
            </div>

            {/* Call Outcome Pie Chart */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Global Call Outcomes Breakdown
              </div>
              {adminStats?.outcomes?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie 
                        data={adminStats.outcomes.map(o => ({ 
                          name: o._id ? o._id.toUpperCase() : 'NO ANSWER', 
                          value: o.count 
                        }))} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={28} 
                        outerRadius={48} 
                        paddingAngle={3} 
                        dataKey="value"
                      >
                        {adminStats.outcomes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginTop: 12, maxHeight: 60, overflowY: 'auto' }}>
                    {adminStats.outcomes.map((o, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                          <span style={{ color: '#555', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(o._id || 'No answer').toLowerCase()}
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, color: TEXT_MAIN, flexShrink: 0 }}>{o.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: TEXT_MUTED, fontSize: 13 }}>No calls logged across the team yet.</div>
              )}
            </div>

            {/* Global Recent Activity Feed */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Global Recent Activities Timeline
              </div>
              {adminStats?.recentActivities?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 220, overflowY: 'auto', paddingRight: 6 }}>
                  {adminStats.recentActivities.map((act, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.5 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 3 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: act.activity.callStatus === 'connected' ? GREEN : RED }} />
                        {index < adminStats.recentActivities.length - 1 && <div style={{ width: 1, height: 32, background: '#f0ecff', marginTop: 4 }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#444', lineHeight: 1.4 }}>
                          <strong style={{ color: PURPLE }}>{act.performer?.name || 'Caller'}</strong> logged a call for <strong style={{ color: TEXT_MAIN }}>{act.leadName}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: TEXT_MUTED, marginTop: 3 }}>
                          <span>Status: <strong style={{ color: act.activity.callStatus === 'connected' ? GREEN : RED }}>{act.activity.callStatus || 'no answer'}</strong></span>
                          <span>•</span>
                          <span>Duration: {fmtDuration(act.activity.callDuration)}</span>
                          <span>•</span>
                          <span>{new Date(act.activity.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {new Date(act.activity.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: TEXT_MUTED, fontSize: 13 }}>No calls logged recently.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // SUPER ADMIN PORTAL DASHBOARD VIEW
  // -----------------------
  const renderSuperAdminDashboard = () => {
    if (!adminStats) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: 12 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_MAIN }}>Analytics Temporarily Unavailable</div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, textAlign: 'center', maxWidth: 340 }}>
            The admin analytics API could not be reached (404). Your other dashboard data has loaded successfully.<br/>
            Please check that the backend <code style={{ background: '#f3f1fb', padding: '1px 6px', borderRadius: 4 }}>reports/admin-analysis</code> route is running.
          </div>
          <button
            onClick={() => { reportsAPI.adminAnalysis().then(r => setAdminStats(r.data)).catch(e => console.warn(e)); }}
            style={{ marginTop: 8, background: PURPLE, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >Retry Analytics</button>
        </div>
      );
    }
    const revenueWon = adminStats.revenueWon || 0;
    const funnelStages = adminStats.conversionFunnel || [];
    const campaignStats = adminStats.campaignPerformance || [];

    // Calculate goal metrics using demos scheduled this month
    const actualDemosCombined = adminStats?.demosScheduledThisMonth || 0;
    const targetDemosGoal = 500;
    const goalPercentage = Math.min(100, Math.round((actualDemosCombined / targetDemosGoal) * 100));

    // Calculate days remaining this month
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysRemaining = lastDayOfMonth.getDate() - today.getDate();

    // Calculate overall conversion rate (Won / Total)
    const totalLeadsCount = stats?.total || 0;
    const wonCount = funnelStages.find(f => f.stage === 'Won')?.count || 0;
    const leadConversionRate = totalLeadsCount > 0 ? Math.round((wonCount / totalLeadsCount) * 100) : 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Stale Leads Alert Banner */}
        {(adminStats?.staleLeadsCount > 0 || adminStats?.overdue24hFollowupsCount > 0) && (
          <div style={{ background: '#fff0f0', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED, fontWeight: 'bold', fontSize: 18 }}>⚠️</div>
              <div>
                <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 14.5 }}>Stale Leads & Overdue Actions Detected</div>
                <div style={{ fontSize: 12.5, color: '#b91c1c', marginTop: 2 }}>
                  {adminStats?.staleLeadsCount || 0} leads are idle for 3+ days, and {adminStats?.overdue24hFollowupsCount || 0} followups are overdue by 24h+.
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/stale-leads')} 
              style={{ background: RED, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(229, 62, 62, 0.2)' }}
            >
              Open Stale Console
            </button>
          </div>
        )}

        {/* Strategic KPIs Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <StatCard 
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            label="Revenue Won (This Month)" 
            value={`₹${revenueWon.toLocaleString('en-IN')}`} 
            sub="Sum of Won lead budgets" 
            bg="#e8f8f0" 
            iconColor={GREEN}
          />
          <StatCard 
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            label="Unassigned Leads Count" 
            value={adminStats?.unassignedCount || 0} 
            sub="Awaiting owner assignment" 
            bg="#fff0f0" 
            iconColor={RED}
          />
          <StatCard 
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
            label="Lead-to-Won Success Rate" 
            value={`${leadConversionRate}%`} 
            sub="Based on database closed-won" 
            bg={PURPLE_LIGHT} 
            iconColor={PURPLE}
          />
          <StatCard 
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
            label="Strategic Demos Scheduled" 
            value={actualDemosCombined} 
            sub="Demos booked this month" 
            bg="#fff8e6" 
            iconColor={AMBER}
          />
        </div>

        {/* Monthly targets progress block */}
        <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <strong style={{ color: TEXT_MAIN, fontSize: 14.5 }}>Team Monthly Goal Targets Progress</strong>
              <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>Target: 500 Demos (Scheduled & Done) standard monthly milestone.</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong style={{ color: PURPLE, fontSize: 15 }}>{actualDemosCombined} / {targetDemosGoal} Demos ({goalPercentage}%)</strong>
              <div style={{ fontSize: 11, color: AMBER, fontWeight: 700, marginTop: 2 }}>⏳ {daysRemaining} days remaining</div>
            </div>
          </div>
          <div style={{ width: '100%', height: 12, background: '#f1f0f6', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
            <div style={{ 
              width: `${goalPercentage}%`, 
              height: '100%', 
              background: `linear-gradient(90deg, ${PURPLE} 0%, #8b5cf6 100%)`, 
              borderRadius: 6,
              boxShadow: '0 0 8px rgba(91, 63, 199, 0.4)',
              transition: 'width 0.6s ease' 
            }} />
          </div>
        </div>

        {/* Funnels & Campaigns details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Conversion funnel visual block */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Lead Status Conversion Funnel
              </div>
              {funnelStages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: TEXT_MUTED }}>No stage pipelines detected.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {funnelStages.map((stage, idx) => {
                    const firstCount = funnelStages[0]?.count || 1;
                    const stagePct = Math.round((stage.count / firstCount) * 100);
                    
                    let dropOffPct = 0;
                    if (idx > 0 && funnelStages[idx - 1].count > 0) {
                      const prevCount = funnelStages[idx - 1].count;
                      dropOffPct = Math.round(((prevCount - stage.count) / prevCount) * 100);
                    }

                    return (
                      <div key={stage.stage} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 130, fontSize: 12.5, fontWeight: 600, color: TEXT_MAIN, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {stage.stage}
                        </div>
                        <div style={{ flex: 1, height: 26, background: '#f8f7ff', border: '1px solid #f3f0ff', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${Math.max(3, stagePct)}%`, 
                            height: '100%', 
                            background: COLORS[idx % COLORS.length],
                            opacity: 0.85
                          }} />
                          <span style={{ position: 'absolute', left: 10, top: 4, fontSize: 11.5, fontWeight: 700, color: stagePct > 40 ? '#fff' : TEXT_MAIN }}>
                            {stage.count} Leads
                          </span>
                        </div>
                        <div style={{ width: 140, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, fontSize: 11.5, fontWeight: 700 }}>
                          <span style={{ color: TEXT_MUTED }}>{stagePct}% of Total</span>
                          {idx > 0 && dropOffPct > 0 && (
                            <span style={{ background: '#fff0f0', color: RED, padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>
                              ↓ {dropOffPct}% drop
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Campaign Performance Table */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Campaign Performance Analytics (Click Row to Drill Down)
              </div>
              {campaignStats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: TEXT_MUTED }}>No campaigns logged.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_MUTED, height: 28 }}>
                        <th style={{ textAlign: 'left', fontWeight: 600, paddingBottom: 8 }}>Campaign Name</th>
                        <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 8 }}>Leads Count</th>
                        <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 8 }}>Called %</th>
                        <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 8 }}>Won</th>
                        <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 8 }}>Lost</th>
                        <th style={{ textAlign: 'right', fontWeight: 600, paddingBottom: 8 }}>Conv. Rate %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaignStats.map(c => {
                        const callPct = c.totalLeads > 0 ? Math.round((c.called / c.totalLeads) * 100) : 0;
                        const convPct = c.totalLeads > 0 ? Math.round((c.won / c.totalLeads) * 100) : 0;
                        return (
                          <tr 
                            key={c._id || 'unassigned'} 
                            onClick={() => c._id && navigate('/campaigns/' + c._id)}
                            style={{ borderBottom: '1px solid #faf9ff', height: 38, cursor: c._id ? 'pointer' : 'default' }}
                            onMouseEnter={e => c._id && (e.currentTarget.style.background = '#faf9ff')}
                            onMouseLeave={e => c._id && (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ padding: '8px 0', fontWeight: 600, color: c._id ? PURPLE : TEXT_MAIN }}>
                              {c.name} {c._id && '➡️'}
                            </td>
                            <td style={{ textAlign: 'center', color: TEXT_MAIN }}>{c.totalLeads}</td>
                            <td style={{ textAlign: 'center', color: '#555' }}>
                              <span style={{ background: '#f3f1fb', color: PURPLE, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                                {callPct}%
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', color: GREEN, fontWeight: 700 }}>{c.won}</td>
                            <td style={{ textAlign: 'center', color: RED, fontWeight: 700 }}>{c.lost}</td>
                            <td style={{ textAlign: 'right', color: GREEN, fontWeight: 800 }}>{convPct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Global Recent Activity Feed */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Global Recent Activities Timeline
              </div>
              {adminStats?.recentActivities?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 220, overflowY: 'auto', paddingRight: 6 }}>
                  {adminStats.recentActivities.map((act, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.5 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 3 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: act.activity.callStatus === 'connected' ? GREEN : RED }} />
                        {index < adminStats.recentActivities.length - 1 && <div style={{ width: 1, height: 32, background: '#f0ecff', marginTop: 4 }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#444', lineHeight: 1.4 }}>
                          <strong style={{ color: PURPLE }}>{act.performer?.name || 'Caller'}</strong> logged a call for <strong style={{ color: TEXT_MAIN }}>{act.leadName}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: TEXT_MUTED, marginTop: 3 }}>
                          <span>Status: <strong style={{ color: act.activity.callStatus === 'connected' ? GREEN : RED }}>{act.activity.callStatus || 'no answer'}</strong></span>
                          <span>•</span>
                          <span>Duration: {fmtDuration(act.activity.callDuration)}</span>
                          <span>•</span>
                          <span>{new Date(act.activity.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {new Date(act.activity.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: TEXT_MUTED, fontSize: 13 }}>No calls logged recently.</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Leaderboard widget with switch tabs */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', marginBottom: 16 }}>
                <strong style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🏆 Productivity Leaderboard
                </strong>
                <div style={{ display: 'flex', background: '#f3f1fb', padding: 2, borderRadius: 6 }}>
                  <button 
                    onClick={() => setLeaderboardTab('callers')}
                    style={{ border: 'none', background: leaderboardTab === 'callers' ? '#fff' : 'transparent', color: leaderboardTab === 'callers' ? PURPLE : TEXT_MUTED, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    Callers
                  </button>
                  <button 
                    onClick={() => setLeaderboardTab('admins')}
                    style={{ border: 'none', background: leaderboardTab === 'admins' ? '#fff' : 'transparent', color: leaderboardTab === 'admins' ? PURPLE : TEXT_MUTED, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    Admins
                  </button>
                </div>
              </div>

              {(() => {
                const filteredCallers = adminStats?.callers?.filter(c => {
                  if (leaderboardTab === 'admins') {
                    return c.user?.role === 'admin' || c.user?.role === 'super admin';
                  }
                  return c.user?.role === 'caller';
                }) || [];

                return filteredCallers.length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_MUTED, height: 26 }}>
                        <th style={{ textAlign: 'left', fontWeight: 600, paddingBottom: 6 }}>User</th>
                        <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 6 }}>Dials</th>
                        <th style={{ textAlign: 'right', fontWeight: 600, paddingBottom: 6 }}>Wins</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCallers.map(c => (
                        <tr 
                          key={c._id} 
                          onClick={() => openAnalysisModal(c.user?._id)}
                          style={{ borderBottom: '1px solid #faf9ff', height: 42, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#faf9ff'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ display: 'flex', alignItems: 'center', gap: 6, height: 42 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: PURPLE_LIGHT, color: PURPLE, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {c.user?.name?.[0]?.toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600, color: TEXT_MAIN, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.user?.name}</span>
                          </td>
                          <td style={{ textAlign: 'center', color: TEXT_MAIN, fontWeight: 600 }}>{c.totalCalls}</td>
                          <td style={{ textAlign: 'right', color: GREEN, fontWeight: 800 }}>{c.sales || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: TEXT_MUTED, fontSize: 12.5 }}>No accounts logged yet.</div>
                );
              })()}
            </div>

            {/* Daily volume bar chart */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 600, color: TEXT_MAIN, fontSize: 13.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Daily Call Volume (Last 7 Days)
              </div>
              {adminStats?.dailyVolume?.length > 0 ? (
                <ResponsiveContainer width="100%" height={165}>
                  <BarChart data={adminStats.dailyVolume.map(v => ({ name: v._id.slice(5), calls: v.count }))}>
                    <XAxis dataKey="name" stroke={TEXT_MUTED} fontSize={10} tickLine={false} />
                    <YAxis stroke={TEXT_MUTED} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(91, 63, 199, 0.04)' }} />
                    <Bar dataKey="calls" fill={PURPLE} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 165, color: TEXT_MUTED, fontSize: 12.5 }}>No calls logged recently.</div>
              )}
            </div>

            {/* Call Outcome Pie Chart */}
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Global Call Outcomes Breakdown
              </div>
              {adminStats?.outcomes?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie 
                        data={adminStats.outcomes.map(o => ({ 
                          name: o._id ? o._id.toUpperCase() : 'NO ANSWER', 
                          value: o.count 
                        }))} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={28} 
                        outerRadius={48} 
                        paddingAngle={3} 
                        dataKey="value"
                      >
                        {adminStats.outcomes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginTop: 12, maxHeight: 60, overflowY: 'auto' }}>
                    {adminStats.outcomes.map((o, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                          <span style={{ color: '#555', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(o._id || 'No answer').toLowerCase()}
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, color: TEXT_MAIN, flexShrink: 0 }}>{o.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: TEXT_MUTED, fontSize: 13 }}>No calls logged across the team yet.</div>
              )}
            </div>
          </div>

          {/* Peak Calling Hours Heatmap Grid — REMOVED per product decision */}
          {false && <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20, gridColumn: 'span 2' }}>
            <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔥</span> Peak Calling Hours Connect Rate Heatmap (Asia/Kolkata)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: 780 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(24, 1fr)', gap: 2, marginBottom: 4 }}>
                    <div />
                    {Array(24).fill(0).map((_, h) => (
                      <div key={h} style={{ fontSize: 9, color: TEXT_MUTED, textAlign: 'center', fontWeight: 600 }}>
                        {h === 0 ? '12A' : h === 12 ? '12P' : h > 12 ? `${h-12}P` : `${h}A`}
                      </div>
                    ))}
                  </div>
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, dIdx) => {
                    const dayNumber = dIdx + 1;
                    return (
                      <div key={dayName} style={{ display: 'grid', gridTemplateColumns: '80px repeat(24, 1fr)', gap: 2, alignItems: 'center', height: 20 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: TEXT_MAIN }}>{dayName}</span>
                        {Array(24).fill(0).map((_, hourNum) => {
                          const entry = adminStats?.peakHours?.find(p => p._id?.dayOfWeek === dayNumber && p._id?.hour === hourNum);
                          const total = entry?.totalCalls || 0;
                          const conn = entry?.connectedCalls || 0;
                          const connectRate = total > 0 ? Math.round((conn / total) * 100) : 0;
                          
                          let cellBg = '#f1f0f6';
                          let cellColor = '#888';
                          if (total > 0) {
                            if (connectRate >= 60) { cellBg = '#4c1d95'; cellColor = '#fff'; }
                            else if (connectRate >= 40) { cellBg = '#6d28d9'; cellColor = '#fff'; }
                            else if (connectRate >= 20) { cellBg = '#a78bfa'; cellColor = '#fff'; }
                            else { cellBg = '#ddd6fe'; cellColor = TEXT_MAIN; }
                          }
                          
                          return (
                            <div 
                              key={hourNum} 
                              title={`${dayName} at ${hourNum}:00: ${connectRate}% connect rate (${conn}/${total} calls)`}
                              style={{ 
                                background: cellBg, 
                                color: cellColor,
                                fontSize: 8.5, 
                                fontWeight: 700, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                height: '100%', 
                                borderRadius: 2,
                                cursor: 'help'
                              }}
                            >
                              {total > 0 ? `${connectRate}%` : '-'}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: TEXT_MUTED, marginTop: 4, justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#f1f0f6', borderRadius: 2 }} /> No Calls</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#ddd6fe', borderRadius: 2 }} /> &lt;20%</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#a78bfa', borderRadius: 2 }} /> 20-40%</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#6d28d9', borderRadius: 2 }} /> 40-60%</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: '#4c1d95', borderRadius: 2 }} /> &gt;60%</div>
              </div>
            </div>
          </div>}

          {/* Leads by Location and Source Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, gridColumn: 'span 2' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📍</span> Leads by Top Locations
              </div>
              {adminStats?.locationStats?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {adminStats.locationStats.map((loc, idx) => {
                    const max = adminStats.locationStats[0]?.count || 1;
                    const pct = Math.round((loc.count / max) * 100);
                    return (
                      <div key={loc._id || 'unknown'} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 100, fontSize: 12, fontWeight: 600, color: TEXT_MAIN, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {loc._id || 'Unknown'}
                        </span>
                        <div style={{ flex: 1, height: 16, background: '#f8f7ff', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: COLORS[idx % COLORS.length], borderRadius: 4 }} />
                        </div>
                        <span style={{ width: 30, textAlign: 'right', fontSize: 12, fontWeight: 700, color: TEXT_MAIN }}>{loc.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: TEXT_MUTED, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No location data available.</div>
              )}
            </div>

            <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 20 }}>
              <div style={{ fontWeight: 700, color: TEXT_MAIN, fontSize: 14.5, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🌐</span> Leads by Top Sources
              </div>
              {adminStats?.sourceStats?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {adminStats.sourceStats.map((src, idx) => {
                    const max = adminStats.sourceStats[0]?.count || 1;
                    const pct = Math.round((src.count / max) * 100);
                    return (
                      <div key={src._id || 'unknown'} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 100, fontSize: 12, fontWeight: 600, color: TEXT_MAIN, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {src._id || 'Unknown'}
                        </span>
                        <div style={{ flex: 1, height: 16, background: '#f8f7ff', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: COLORS[(idx + 2) % COLORS.length], borderRadius: 4 }} />
                        </div>
                        <span style={{ width: 30, textAlign: 'right', fontSize: 12, fontWeight: 700, color: TEXT_MAIN }}>{src.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: TEXT_MUTED, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No source data available.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (fetchError) {
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_MAIN }}>Dashboard Load Failed</div>
        <div style={{
          background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 24px',
          color: RED, fontWeight: 600, fontSize: 13.5, fontFamily: 'monospace',
          maxWidth: 500, textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}>
          {fetchError}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={refresh}
            style={{ background: PURPLE, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(91, 63, 199, 0.2)' }}
          >
            Retry Fetching
          </button>
          <button 
            onClick={() => { localStorage.removeItem('aotms_token'); localStorage.removeItem('aotms_user'); window.location.href = '/login'; }}
            style={{ background: '#fff', color: TEXT_MAIN, border: `1.5px solid ${BORDER}`, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Logout & Re-login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f1fb', paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_MAIN, display: 'flex', alignItems: 'center', gap: 8 }}>
            {isSuperAdmin ? 'Super Admin Control Center' : isAdmin ? 'Admin Analytics Desk' : 'Caller Performance Desk'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2.5" style={{ cursor: 'pointer' }} onClick={refresh}>
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5"/>
            </svg>
          </div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 2 }}>
            Welcome back, {user?.name}! Role: <span style={{ color: PURPLE, fontWeight: 700, textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
        </div>
        
        {/* Navigation shortcuts */}
        <div style={{ display: 'flex', gap: 10 }}>
          {isSuperAdmin && (
            <button
              onClick={exportToCSV}
              style={{ background: '#e8f8f0', color: GREEN, border: `1.5px solid ${GREEN}`, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              📊 Export CSV Report
            </button>
          )}
          {(isAdmin || isSuperAdmin) && (
            <button
              onClick={() => navigate('/users')}
              style={{ background: '#f3f1fb', color: PURPLE, border: `1.5px solid ${PURPLE}`, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Manage Users
            </button>
          )}
          <button
            onClick={() => navigate('/leads/new')}
            style={{ background: PURPLE, color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            + Add New Lead
          </button>
        </div>
      </div>

      {/* Render Role specific layout */}
      {isSuperAdmin ? renderSuperAdminDashboard() : isAdmin ? renderAdminDashboard() : renderCallerDashboard()}

      {/* -------------------------------------------------------------
          DISTRACTION-FREE CALL QUEUE WORKSPACE OVERLAY
          ------------------------------------------------------------- */}
      {activeQueueIndex !== null && stats?.startMyDayQueue && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(45, 45, 107, 0.45)',
          backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 820,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Workspace Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #f3f1fb', background: '#faf9ff', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: PURPLE, background: PURPLE_LIGHT, padding: '2px 8px', borderRadius: 10 }}>START MY DAY calling WORKSPACE</span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: TEXT_MAIN, marginTop: 4 }}>
                  Lead {activeQueueIndex + 1} of {stats.startMyDayQueue.length}
                </h3>
              </div>
              <button 
                onClick={() => setActiveQueueIndex(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUTED, padding: 4 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Workspace Body */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, padding: 24 }}>
              {workspaceLoading ? (
                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                  <div style={{ width: 28, height: 28, border: `3px solid ${PURPLE}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : workspaceLead ? (
                <>
                  {/* Left Column: Lead Info and Activity Feed */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderRight: '1px solid #f0ecff', paddingRight: 20 }}>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: TEXT_MAIN }}>{workspaceLead.name}</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 12.5, color: TEXT_MUTED, marginTop: 6 }}>
                        <span>📞 Phone: <strong style={{ color: TEXT_MAIN }}>{workspaceLead.phone}</strong></span>
                        {workspaceLead.email && <span>📧 Email: <strong style={{ color: TEXT_MAIN }}>{workspaceLead.email}</strong></span>}
                      </div>
                    </div>

                    <div style={{ border: '1px solid #e5e2f5', borderRadius: 8, padding: 12, background: '#faf9ff', fontSize: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <span style={{ color: TEXT_MUTED }}>Current Status:</span>
                          <div style={{ marginTop: 2 }}><StatusBadge status={workspaceLead.status} /></div>
                        </div>
                        <div>
                          <span style={{ color: TEXT_MUTED }}>Campaign Source:</span>
                          <div style={{ fontWeight: 600, color: TEXT_MAIN, marginTop: 4 }}>{workspaceLead.campaign?.name || 'Manual Upload'}</div>
                        </div>
                        {workspaceLead.preferredCourses?.length > 0 && (
                          <div style={{ gridColumn: 'span 2' }}>
                            <span style={{ color: TEXT_MUTED }}>Preferred Courses:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                              {workspaceLead.preferredCourses.map(c => (
                                <span key={c} style={{ background: PURPLE_LIGHT, color: PURPLE, fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{c}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lead Activity history */}
                    <div>
                      <strong style={{ fontSize: 13, color: TEXT_MAIN, display: 'block', marginBottom: 8 }}>Past Interaction History</strong>
                      {workspaceLead.activities?.length === 0 ? (
                        <div style={{ fontSize: 12, color: TEXT_MUTED, textAlign: 'center', padding: '16px 0', border: '1px dashed #e5e2f5', borderRadius: 8 }}>No activity history found.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto', paddingRight: 6 }}>
                          {workspaceLead.activities.map((act, index) => (
                            <div key={index} style={{ background: '#faf9ff', border: '1px solid #f0ecff', borderRadius: 8, padding: 8, fontSize: 11.5 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: TEXT_MAIN }}>
                                <span style={{ textTransform: 'uppercase', fontSize: 10, color: PURPLE }}>{act.type}</span>
                                <span style={{ fontSize: 10, color: TEXT_MUTED }}>{new Date(act.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                              </div>
                              <p style={{ margin: '4px 0 0', color: '#444' }}>{act.description || 'No notes added.'}</p>
                              {act.type === 'call' && (
                                <div style={{ display: 'flex', gap: 10, color: TEXT_MUTED, fontSize: 10, marginTop: 4 }}>
                                  <span>Outcome: <strong style={{ color: act.callStatus === 'connected' ? GREEN : RED }}>{act.callStatus}</strong></span>
                                  <span>Duration: {fmtDuration(act.callDuration)}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Call Logger Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Dialing Workspace Timer */}
                    <div style={{ background: '#f8f7ff', border: '1px solid #e8f0fe', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                      <span style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', fontWeight: 700 }}>Talk Duration Timer</span>
                      <div style={{ fontSize: 32, fontWeight: 900, color: PURPLE, fontFamily: 'monospace', margin: '6px 0' }}>
                        {String(Math.floor(callDuration / 60)).padStart(2, '0')}:{String(callDuration % 60).padStart(2, '0')}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                        <button 
                          onClick={() => setTimerActive(!timerActive)}
                          style={{ background: timerActive ? AMBER : GREEN, color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        >
                          {timerActive ? 'Pause Call' : 'Resume Call'}
                        </button>
                        <button 
                          onClick={() => setCallDuration(0)}
                          style={{ background: '#f3f1fb', color: TEXT_MAIN, border: '1px solid #e5e2f5', padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Call logging inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: TEXT_MAIN, display: 'block', marginBottom: 4 }}>Call Status Outcome</label>
                        <select 
                          value={callStatus}
                          onChange={e => setCallStatus(e.target.value)}
                          style={{ width: '100%', border: '1px solid #e5e2f5', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, outline: 'none', color: TEXT_MAIN }}
                        >
                          <option value="connected">Connected / Talked</option>
                          <option value="no_answer">No Answer / Ringing</option>
                          <option value="busy">Busy Line</option>
                          <option value="failed">Disconnected / Failed</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: TEXT_MAIN, display: 'block', marginBottom: 4 }}>Lead Status Transition</label>
                        <select 
                          value={newStatus}
                          onChange={e => setNewStatus(e.target.value)}
                          style={{ width: '100%', border: '1px solid #e5e2f5', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, outline: 'none', color: TEXT_MAIN }}
                        >
                          <option value="Fresh">Fresh</option>
                          <option value="Connected">Connected</option>
                          <option value="Call Not Responding">Call Not Responding</option>
                          <option value="Call Back Later">Call Back Later</option>
                          <option value="Not interested">Not interested</option>
                          <option value="Demo Scheduled">Demo Scheduled</option>
                          <option value="Demo Done">Demo Done</option>
                          <option value="Won">Won</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: TEXT_MAIN, display: 'block', marginBottom: 4 }}>Call Note / Note details</label>
                        <textarea 
                          rows="3"
                          value={callNote}
                          onChange={e => setCallNote(e.target.value)}
                          placeholder="Log notes about this call..."
                          style={{ width: '100%', border: '1px solid #e5e2f5', borderRadius: 8, padding: '8px 10px', fontSize: 12.5, outline: 'none', color: TEXT_MAIN, resize: 'none' }}
                        />
                      </div>

                      {/* Setup direct callback follow-up */}
                      <div style={{ borderTop: '1px solid #f0ecff', paddingTop: 10 }}>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: PURPLE, display: 'block', marginBottom: 4 }}>📅 Schedule Next Callback (Optional)</label>
                        <input 
                          type="datetime-local"
                          value={nextFollowupDate}
                          onChange={e => setNextFollowupDate(e.target.value)}
                          style={{ width: '100%', border: '1px solid #e5e2f5', borderRadius: 8, padding: '6px 10px', fontSize: 12, outline: 'none', color: TEXT_MAIN }}
                        />
                        {nextFollowupDate && (
                          <input 
                            type="text"
                            value={nextFollowupNote}
                            onChange={e => setNextFollowupNote(e.target.value)}
                            placeholder="Follow-up instructions note..."
                            style={{ width: '100%', border: '1px solid #e5e2f5', borderRadius: 8, padding: '6px 10px', fontSize: 11.5, outline: 'none', color: TEXT_MAIN, marginTop: 6 }}
                          />
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
                      <button 
                        onClick={() => {
                          if (activeQueueIndex < stats.startMyDayQueue.length - 1) {
                            setActiveQueueIndex(prev => prev + 1);
                          } else {
                            setActiveQueueIndex(null);
                          }
                        }}
                        style={{ flex: 1, background: '#f3f1fb', color: TEXT_MAIN, border: '1px solid #e5e2f5', padding: '10px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Skip Lead
                      </button>
                      <button 
                        onClick={handleSaveCall}
                        disabled={savingCall}
                        style={{ flex: 2, background: PURPLE, color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        {savingCall ? 'Saving...' : (activeQueueIndex < stats.startMyDayQueue.length - 1 ? 'Save & Next ➡️' : 'Save & Finish 🎉')}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px 0', color: TEXT_MUTED }}>Unable to load lead workspace details.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          ADMIN USER ANALYSIS MODAL DETAIL VIEW
          ------------------------------------------------------------- */}
      {selectedUserId && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(45, 45, 107, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }} onClick={closeAnalysisModal}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 680,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            animation: 'modalFadeIn 0.2s ease-out'
          }} onClick={e => e.stopPropagation()}>
            <style>{`
              @keyframes modalFadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
            `}</style>
            
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid #f3f1fb'
            }}>
              {modalLoading ? (
                <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_MAIN }}>Loading Analysis...</div>
              ) : userAnalysisData?.user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: PURPLE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
                    {userAnalysisData.user.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_MAIN, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {userAnalysisData.user.name}
                      <span style={{ fontSize: 10, fontWeight: 600, background: PURPLE_LIGHT, color: PURPLE, padding: '2px 8px', borderRadius: 12, textTransform: 'capitalize' }}>
                        {userAnalysisData.user.role}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{userAnalysisData.user.email}</div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_MAIN }}>User Performance Details</div>
              )}
              <button onClick={closeAnalysisModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUTED, display: 'flex', padding: 4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {modalLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                  <div style={{ width: 28, height: 28, border: `3px solid ${PURPLE}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : userAnalysisData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* User Stats Overview Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                    <div style={{ background: '#f8f7ff', border: '1px solid #e8e5f8', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: TEXT_MUTED }}>Total Calls</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_MAIN, marginTop: 4 }}>{userAnalysisData.stats.totalCalls}</div>
                    </div>
                    <div style={{ background: '#f8f7ff', border: '1px solid #e8e5f8', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: TEXT_MUTED }}>Talk Duration</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_MAIN, marginTop: 4 }}>{fmtDuration(userAnalysisData.stats.totalDuration)}</div>
                    </div>
                    <div style={{ background: '#f8f7ff', border: '1px solid #e8e5f8', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: TEXT_MUTED }}>Connect Rate</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: GREEN, marginTop: 4 }}>
                        {userAnalysisData.stats.totalCalls > 0 ? Math.round((userAnalysisData.stats.connected / userAnalysisData.stats.totalCalls) * 100) : 0}%
                      </div>
                    </div>
                  </div>

                  {/* Double Chart Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                    {/* Daily Volume Trends BarChart */}
                    <div style={{ border: '1px solid #e5e2f5', borderRadius: 10, padding: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_MAIN, marginBottom: 12 }}>Daily Call Volume (Last 7 Days)</div>
                      {userAnalysisData.dailyVolume?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={140}>
                          <BarChart data={userAnalysisData.dailyVolume.map(v => ({ name: v._id.slice(5), calls: v.count }))}>
                            <XAxis dataKey="name" stroke={TEXT_MUTED} fontSize={10} tickLine={false} />
                            <YAxis stroke={TEXT_MUTED} fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ fill: 'rgba(91, 63, 199, 0.03)' }} />
                            <Bar dataKey="calls" fill={PURPLE} radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140, color: TEXT_MUTED, fontSize: 11 }}>No calls logged in the last 7 days</div>
                      )}
                    </div>

                    {/* Outcomes PieChart */}
                    <div style={{ border: '1px solid #e5e2f5', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_MAIN, marginBottom: 8 }}>Call Outcomes</div>
                      {userAnalysisData.outcomes?.length > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height={90}>
                            <PieChart>
                              <Pie data={userAnalysisData.outcomes.map(o => ({ name: o._id ? o._id.toUpperCase() : 'NO ANSWER', value: o.count }))} cx="50%" cy="50%" innerRadius={22} outerRadius={36} paddingAngle={2} dataKey="value">
                                {userAnalysisData.outcomes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', marginTop: 8, maxHeight: 40, overflowY: 'auto' }}>
                            {userAnalysisData.outcomes.map((o, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 9 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                                  <span style={{ color: '#666', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(o._id || 'No answer').toLowerCase()}</span>
                                </div>
                                <span style={{ fontWeight: 600, color: TEXT_MAIN, flexShrink: 0 }}>{o.count}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 110, color: TEXT_MUTED, fontSize: 11 }}>No calls logged yet</div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Feed */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_MAIN, marginBottom: 12 }}>Recent Logged Activities</div>
                    {userAnalysisData.recentActivities?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 180, overflowY: 'auto', paddingRight: 6 }}>
                        {userAnalysisData.recentActivities.map((act, index) => (
                          <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 3 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: act.activity.callStatus === 'connected' ? GREEN : RED }} />
                              {index < userAnalysisData.recentActivities.length - 1 && <div style={{ width: 1, height: 28, background: '#f0ecff', marginTop: 4 }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: '#555' }}>
                                Logged a call for <strong style={{ color: PURPLE }}>{act.leadName}</strong>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>
                                <span>Status: <strong style={{ color: act.activity.callStatus === 'connected' ? GREEN : RED }}>{act.activity.callStatus || 'no answer'}</strong></span>
                                <span>•</span>
                                <span>Duration: {fmtDuration(act.activity.callDuration)}</span>
                                <span>•</span>
                                <span>{new Date(act.activity.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} {new Date(act.activity.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: TEXT_MUTED, fontSize: 11 }}>No logged activities found</div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: TEXT_MUTED }}>Unable to load user analysis.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}