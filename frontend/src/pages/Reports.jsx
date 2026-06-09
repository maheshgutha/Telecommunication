import { useState, useEffect } from 'react';
import { Download, Phone, Clock, TrendingUp, BarChart2, RefreshCw } from 'lucide-react';
import { reportsAPI, followupsAPI, leadsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6', '#14B8A6'];

function fmtDuration(sec) {
  if (!sec) return '0m';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Inline leaderboard component for Reports > Leaderboard tab
function LeaderboardTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    setLoading(true);
    reportsAPI.leaderboard({ period })
      .then(res => {
        const raw = res.data?.leaderboard || [];
        setData(raw.map(item => ({
          _id: item.user?._id || item._id,
          name: item.user?.name || item.name || 'Unknown',
          calls: item.totalCalls || 0,
          duration: item.totalDuration || 0,
          sales: item.sales || 0,
        })));
      })
      .catch(err => { console.error(err); setData([]); })
      .finally(() => setLoading(false));
  }, [period]);

  const fmtD = (s) => { if (!s) return '0s'; const m = Math.floor(s/60), sec = s%60; return m > 0 ? `${m}m ${sec}s` : `${sec}s`; };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Leaderboard</h3>
        <div className="flex gap-2">
          {['day','week','month','year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${period === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : data.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No calls recorded for this period</div>
      ) : (
        <div className="space-y-3">
          {data.map((c, i) => (
            <div key={c._id || i} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                <p className="text-xs text-gray-400">Caller</p>
              </div>
              <div className="flex gap-6 text-center flex-shrink-0">
                <div><p className="text-lg font-bold text-gray-800">{c.calls}</p><p className="text-xs text-gray-400">Calls</p></div>
                <div><p className="text-lg font-bold text-gray-800">{fmtD(c.duration)}</p><p className="text-xs text-gray-400">Duration</p></div>
                <div><p className="text-lg font-bold text-green-600">{c.sales}</p><p className="text-xs text-gray-400">Sales</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, sub, color }) => {
  const colors = { indigo: 'bg-indigo-50 text-indigo-600', green: 'bg-green-50 text-green-600', orange: 'bg-orange-50 text-orange-600', purple: 'bg-purple-50 text-purple-600' };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const TABS = ['All', 'Tasks', 'Leaderboard', 'Bulk cancel tasks', 'List Delete', 'Bulk upload tasks', 'Call Summarization'];

export default function Reports() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super admin';

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  const [tasksData, setTasksData] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [callsList, setCallsList] = useState([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [uploadsList, setUploadsList] = useState([]);

  const handleExportLeads = async () => {
    try {
      const res = await leadsAPI.exportCSV();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export Leads Report: ' + err.message);
    }
  };

  const handleExportCalls = async () => {
    try {
      const res = await reportsAPI.callsList();
      const calls = res.data.calls || [];
      if (calls.length === 0) {
        alert('No call records found to export.');
        return;
      }
      const headers = ['Lead Name', 'Lead Phone', 'Call Date', 'Duration (seconds)', 'Status', 'Summary'];
      const rows = calls.map(c => [
        `"${String(c.leadName || '').replace(/"/g, '""')}"`,
        `"${String(c.leadPhone || '').replace(/"/g, '""')}"`,
        `"${new Date(c.date).toLocaleString('en-IN')}"`,
        c.duration || 0,
        `"${String(c.status || '').replace(/"/g, '""')}"`,
        `"${String(c.summary || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `calls_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export Call Report: ' + err.message);
    }
  };

  const handleExportCampaigns = async () => {
    if (!isAdmin) {
      alert('Campaign Reports are only available for Admin/Super Admin accounts.');
      return;
    }
    try {
      const res = await reportsAPI.adminAnalysis();
      const performance = res.data?.campaignPerformance || [];
      if (performance.length === 0) {
        alert('No campaign records found to export.');
        return;
      }
      const headers = ['Campaign Name', 'Total Leads', 'Called Leads', 'Won Leads', 'Lost Leads', 'Conversion Rate %'];
      const rows = performance.map(c => {
        const convPct = c.totalLeads > 0 ? Math.round((c.won / c.totalLeads) * 100) : 0;
        return [
          `"${String(c.name || '').replace(/"/g, '""')}"`,
          c.totalLeads || 0,
          c.called || 0,
          c.won || 0,
          c.lost || 0,
          `${convPct}%`
        ];
      });
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `campaign_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export Campaign Report: ' + err.message);
    }
  };

  const handleExportLeaderboard = async () => {
    try {
      const res = await reportsAPI.leaderboard({ period: 'all' });
      const lb = res.data?.leaderboard || [];
      if (lb.length === 0) {
        alert('No leaderboard records found to export.');
        return;
      }
      const headers = ['Rank', 'Name', 'Email', 'Role', 'Total Calls', 'Total Duration (seconds)', 'Connected Calls', 'Sales'];
      const rows = lb.map((item, idx) => [
        idx + 1,
        `"${String(item.user?.name || item.name || '').replace(/"/g, '""')}"`,
        `"${String(item.user?.email || '').replace(/"/g, '""')}"`,
        `"${String(item.user?.role || '').replace(/"/g, '""')}"`,
        item.totalCalls || 0,
        item.totalDuration || 0,
        item.connectedCalls || 0,
        item.sales || 0
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leaderboard_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to export Leaderboard Report: ' + err.message);
    }
  };

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await reportsAPI.callsSummary();
      setSummary(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    if (activeTab === 'Tasks') {
      setTasksLoading(true);
      followupsAPI.getAll()
        .then(res => {
          setTasksData(res.data.followups || []);
        })
        .catch(err => console.error(err))
        .finally(() => setTasksLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'Call Summarization') {
      setCallsLoading(true);
      reportsAPI.callsList()
        .then(res => {
          setCallsList(res.data.calls || []);
        })
        .catch(err => console.error(err))
        .finally(() => setCallsLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'Bulk upload tasks') {
      const existing = JSON.parse(localStorage.getItem('aotms_bulk_uploads') || '[]');
      setUploadsList(existing);
    }
  }, [activeTab]);

  const statusChartData = (summary?.statusBreakdown || []).map(s => ({ name: s._id, value: s.count }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Report Download</h2>
            <p className="text-xs text-gray-400">View and export reports</p>
          </div>
        </div>
        <button onClick={fetch} className="btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'All' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Phone} label="Calls Today" value={summary?.today?.count || 0} sub={fmtDuration(summary?.today?.duration)} color="indigo" />
            <StatCard icon={TrendingUp} label="Connected Today" value={summary?.today?.connected || 0} sub="Answered calls" color="green" />
            <StatCard icon={Clock} label="Duration Today" value={fmtDuration(summary?.today?.duration)} sub="Total talk time" color="orange" />
            <StatCard icon={BarChart2} label="This Week" value={summary?.week?.count || 0} sub={fmtDuration(summary?.week?.duration)} color="purple" />
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lead status breakdown */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Lead Status Distribution</h3>
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={statusChartData} margin={{ top: 0, right: 0, left: -20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]}>
                      {statusChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data available</div>
              )}
            </div>

            {/* Pie chart */}
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Status Overview</h3>
              {statusChartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={70} innerRadius={35} paddingAngle={2} dataKey="value">
                        {statusChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {statusChartData.slice(0, 6).map((s, i) => (
                      <div key={s.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-600 truncate">{s.name}</span>
                        <span className="font-medium text-gray-800 ml-auto">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-300 text-sm">No data available</div>
              )}
            </div>
          </div>

          {/* Export buttons */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Export Reports</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: 'Leads Report', onClick: handleExportLeads },
                { name: 'Call Report', onClick: handleExportCalls },
                { name: 'Campaign Report', onClick: handleExportCampaigns },
                { name: 'Leaderboard', onClick: handleExportLeaderboard }
              ].map(r => (
                <button 
                  key={r.name} 
                  onClick={r.onClick}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                >
                  <Download className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                  <span className="text-sm text-gray-600 group-hover:text-indigo-700">{r.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'All' && activeTab !== 'Leaderboard' && (
        <div className="card p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">{activeTab}</h3>
            {activeTab === 'Bulk upload tasks' && (
              <label className="btn-primary cursor-pointer flex items-center gap-2 text-sm">
                <Download className="w-4 h-4" />
                Upload Excel / CSV
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    try {
                      const formData = new FormData();
                      formData.append('file', file);
                      const res = await followupsAPI.import(formData);
                      
                      const newUpload = {
                        fileName: file.name,
                        uploadedAt: new Date().toISOString(),
                        tasksCreated: `${res.data.count} / ${res.data.total}`,
                        status: 'Completed'
                      };
                      const existing = JSON.parse(localStorage.getItem('aotms_bulk_uploads') || '[]');
                      const updated = [newUpload, ...existing];
                      localStorage.setItem('aotms_bulk_uploads', JSON.stringify(updated));
                      setUploadsList(updated);

                      alert(`✅ Bulk upload complete: ${res.data.count} of ${res.data.total} tasks created.`);
                    } catch (err) {
                      const newUpload = {
                        fileName: file.name,
                        uploadedAt: new Date().toISOString(),
                        tasksCreated: '0',
                        status: 'Failed'
                      };
                      const existing = JSON.parse(localStorage.getItem('aotms_bulk_uploads') || '[]');
                      const updated = [newUpload, ...existing];
                      localStorage.setItem('aotms_bulk_uploads', JSON.stringify(updated));
                      setUploadsList(updated);

                      alert('Failed to import tasks: ' + (err.response?.data?.message || err.message));
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            )}
            {activeTab === 'Bulk cancel tasks' && (
              <button
                className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => alert('Select tasks from the Tasks page and use bulk-cancel. This tab is a report view.')}
              >
                Cancel Selected Tasks
              </button>
            )}
            {activeTab === 'List Delete' && (
              <button
                className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => alert('Go to Leads page → select leads → bulk delete.')}
              >
                Delete Selected
              </button>
            )}
          </div>
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {activeTab === 'Tasks' && ['Task', 'Lead', 'Assignee', 'Status', 'Due Date', 'Priority'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                  {activeTab === 'Bulk cancel tasks' && ['Task', 'Lead', 'Status', 'Scheduled At', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                  {activeTab === 'List Delete' && ['Lead Name', 'Phone', 'Status', 'Campaign', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                  {activeTab === 'Bulk upload tasks' && ['File Name', 'Uploaded At', 'Tasks Created', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                  {activeTab === 'Call Summarization' && ['Lead', 'Date', 'Duration', 'Status', 'Summary'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeTab === 'Tasks' && (
                  tasksLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center"><div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" /></td>
                    </tr>
                  ) : tasksData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No tasks found.</td>
                    </tr>
                  ) : (
                    tasksData.map((task, i) => (
                      <tr key={task._id || i} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-800">{task.note || task.title || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{task.lead?.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{task.assignedTo?.name || 'Me'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            task.status === 'done' ? 'bg-green-50 text-green-700' :
                            task.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                            new Date(task.scheduledAt) < new Date() ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                          }`}>
                            {task.status || 'upcoming'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {task.scheduledAt ? new Date(task.scheduledAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{task.priority || 'medium'}</td>
                      </tr>
                    ))
                  )
                )}

                {activeTab === 'Call Summarization' && (
                  callsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center"><div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" /></td>
                    </tr>
                  ) : callsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No call summaries available.</td>
                    </tr>
                  ) : (
                    callsList.map((call, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          <div>{call.leadName}</div>
                          <div className="text-xs text-gray-400">{call.leadPhone}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {call.date ? new Date(call.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{fmtDuration(call.duration)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            call.status === 'connected' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {call.status || 'no answer'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={call.summary}>
                          {call.summary || '—'}
                        </td>
                      </tr>
                    ))
                  )
                )}

                {activeTab === 'Bulk upload tasks' && (
                  uploadsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No uploads yet. Use the Upload Excel / CSV button above to bulk-create tasks.</td>
                    </tr>
                  ) : (
                    uploadsList.map((up, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-800">{up.fileName}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {up.uploadedAt ? new Date(up.uploadedAt).toLocaleString('en-IN') : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{up.tasksCreated}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            up.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {up.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )
                )}

                {activeTab !== 'Tasks' && activeTab !== 'Call Summarization' && activeTab !== 'Bulk upload tasks' && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                      {activeTab === 'Bulk cancel tasks' ? 'No pending tasks to cancel. Go to Tasks page to select tasks for bulk cancellation.' :
                       activeTab === 'List Delete' ? 'No leads selected for deletion. Go to Leads page to select leads.' :
                       'Nothing to show'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Leaderboard' && (
        <LeaderboardTab />
      )}
    </div>
  );
}