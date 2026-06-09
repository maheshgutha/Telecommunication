import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, RefreshCw, ChevronRight } from 'lucide-react';
import { campaignsAPI, leadsAPI } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#4F46E5', '#EF4444', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6'];

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, lRes] = await Promise.all([
        campaignsAPI.getOne(id),
        leadsAPI.getAll({ campaign: id, limit: 50 }),
      ]);
      setCampaign(cRes.data.campaign);
      setLeads(lRes.data.leads || []);
      if (lRes.data.leads?.length > 0) setSelectedLead(lRes.data.leads[0]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  if (loading) return <div className="flex justify-center items-center h-48"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!campaign) return <div className="text-center py-12 text-gray-400">Campaign not found</div>;

  const statusData = campaign.statusBreakdown || [];
  const lostData = campaign.lostReasons || [];
  const totalLeads = statusData.reduce((a, b) => a + b.count, 0);
  const activeLeads = statusData.find(s => s._id === 'Fresh')?.count || 0;
  const newLeads = totalLeads;

  return (
    <div className="flex gap-0" style={{ height: 'calc(100vh - 48px)' }}>
      {/* Left panel */}
      <div className="w-72 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <button onClick={() => navigate('/campaigns')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Campaigns
          </button>
          {/* Campaign stats card */}
          <div className="bg-indigo-50 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-indigo-700">@{campaign.name}</span>
              <button onClick={fetchData} className="text-indigo-400 hover:text-indigo-600"><RefreshCw className="w-3.5 h-3.5" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-lg p-2">
                <p className="text-xs text-gray-400">Active</p>
                <p className="text-sm font-bold text-gray-800">{activeLeads}</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-sm font-bold text-indigo-700">{newLeads}</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-xs text-gray-400">Callers</p>
                <p className="text-sm font-bold text-gray-800">{campaign.assignedCallers?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leads list */}
        <div className="flex-1 overflow-y-auto">
          {leads.map(lead => (
            <div key={lead._id} onClick={() => setSelectedLead(lead)}
              className={`p-3.5 border-b border-gray-50 cursor-pointer hover:bg-indigo-50/40 transition-colors ${selectedLead?._id === lead._id ? 'bg-indigo-50 border-l-2 border-l-indigo-600' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{lead.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{lead.phone}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
              </div>
              <div className="mt-1.5"><StatusBadge status={lead.status} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle: Charts */}
      <div className="w-64 flex-shrink-0 border-r border-gray-100 bg-gray-50 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Lost reasons */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-800">Leads Lost Reason</p>
              <button className="text-gray-400"><RefreshCw className="w-3.5 h-3.5" /></button>
            </div>
            {lostData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie data={lostData} cx="50%" cy="50%" outerRadius={45} dataKey="count">
                      {lostData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {lostData.map((d, i) => (
                    <div key={d._id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-600 truncate max-w-[120px]">{d._id}</span>
                      </div>
                      <span className="text-gray-500">({Math.round(d.count / totalLeads * 100) || 0}%)</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-gray-400">No lost leads yet</p>
              </div>
            )}
          </div>

          {/* Call status */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-sm font-semibold text-gray-800 mb-3">Calls Status Report</p>
            {statusData.length > 0 ? (
              <div className="space-y-2">
                {statusData.map((s, i) => (
                  <div key={s._id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 truncate">{s._id}</span>
                      <span className="font-medium text-gray-800">{s.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(s.count / totalLeads * 100)}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* Right: Lead detail */}
      {selectedLead ? (
        <div className="flex-1 overflow-y-auto bg-white p-6">
          <div className="max-w-lg mx-auto space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedLead.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selectedLead.status} size="md" />
                  <span className="text-xs text-gray-400">{selectedLead.assignedTo?.name}</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
                {selectedLead.assignedTo?.name?.[0] || 'U'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Phone', value: selectedLead.phone },
                { label: 'Email', value: selectedLead.email || 'Empty' },
                { label: 'Lead Source', value: selectedLead.leadSource || 'Empty' },
                { label: 'Location', value: selectedLead.location || 'Empty' },
                { label: 'Preferred Courses', value: selectedLead.preferredCourses?.join(', ') || 'Empty' },
                { label: 'Budget', value: selectedLead.budget ? `₹${selectedLead.budget.toLocaleString()}` : 'Empty' },
                { label: 'Last Qualification', value: selectedLead.lastQualification || 'Empty' },
                { label: 'Total Calls', value: selectedLead.totalCalls || 0 },
              ].map(({ label, value }) => (
                <div key={label} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className={`text-sm font-medium ${value === 'Empty' ? 'text-gray-300' : 'text-gray-800'}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-5 gap-2 border border-gray-100 rounded-xl p-3">
              {[
                { icon: Phone, label: 'CALL', color: 'text-green-600' },
                { icon: RefreshCw, label: 'CALL LATER', color: 'text-orange-600' },
                { icon: Phone, label: 'WHATSAPP', color: 'text-green-500' },
                { icon: Phone, label: 'SMS', color: 'text-blue-600' },
                { icon: Phone, label: 'ADD NOTE', color: 'text-indigo-600' },
              ].map(({ icon: Icon, label, color }) => (
                <button key={label} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center ${color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>

            {/* Activity history */}
            <div className="border border-gray-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-800 mb-3">Activity History</p>
              {selectedLead.activities?.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No activities</p>
              ) : (
                <div className="space-y-2.5">
                  {selectedLead.activities?.slice(0, 8).map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${a.type === 'call' ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        <Phone className="w-3 h-3" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-700">{a.description || `${a.type} — ${a.callStatus || ''}`}</p>
                        {a.callDuration > 0 && <p className="text-xs text-gray-400">{Math.floor(a.callDuration / 60)}m {a.callDuration % 60}s</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p>Select a lead</p>
        </div>
      )}
    </div>
  );
}