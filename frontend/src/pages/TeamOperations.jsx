import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI, usersAPI, leadsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';

const PURPLE = '#5b3fc7';
const PURPLE_LIGHT = '#f0ecff';
const TEXT_MAIN = '#2d2d6b';
const TEXT_MUTED = '#888';
const GREEN = '#22a163';
const RED = '#e53e3e';
const AMBER = '#d97706';
const BORDER = '#e5e2f5';

export default function TeamOperations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [callers, setCallers] = useState([]);
  const [unassignedLeads, setUnassignedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [assigningId, setAssigningId] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super admin';

  const fetchData = async () => {
    try {
      const [analysisRes, usersRes, leadsRes] = await Promise.all([
        reportsAPI.adminAnalysis(),
        usersAPI.getAll(),
        leadsAPI.getAll({ limit: 100 })
      ]);
      setData(analysisRes.data);
      setCallers(usersRes.data.users?.filter(u => u.role === 'caller') || []);
      setUnassignedLeads(leadsRes.data.leads?.filter(l => !l.assignedTo) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin && !isSuperAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, []);

  const handleReassignLead = async (leadId, callerId) => {
    if (!callerId) return;
    setUpdatingId(leadId);
    try {
      await leadsAPI.update(leadId, { assignedTo: callerId });
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to reassign lead: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignUnassigned = async (leadId, callerId) => {
    if (!callerId) return;
    setAssigningId(leadId);
    try {
      await leadsAPI.update(leadId, { assignedTo: callerId });
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to assign lead: ' + err.message);
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
      <div style={{ width: 32, height: 32, border: `4px solid ${PURPLE}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const liveCallers = data?.teamStatus || [];
  const workload = data?.followupsLoad || [];
  const detailedOverdueFollowups = data?.detailedOverdueFollowups || [];
  const upcomingDemos = data?.upcomingDemos || [];
  const notifications = data?.notifications || [];

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f1fb', paddingBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT_MAIN }}>Team Operations Console</h2>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 2 }}>
            Manage daily caller activities, workload distributions, unassigned queues, and in-flight demos.
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          style={{ background: PURPLE, color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Refresh Data
        </button>
      </div>

      {/* Operations Quick Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e8f8f0', display: 'flex', alignItems: 'center', justify: 'center', color: GREEN, fontSize: 20 }}>🟢</div>
          <div>
            <div style={{ fontSize: 12, color: TEXT_MUTED }}>Active Callers Now</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_MAIN, marginTop: 2 }}>
              {liveCallers.filter(c => c.isActive).length} / {liveCallers.length}
            </div>
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justify: 'center', color: AMBER, fontSize: 20 }}>❓</div>
          <div>
            <div style={{ fontSize: 12, color: TEXT_MUTED }}>Unassigned Leads</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_MAIN, marginTop: 2 }}>{data?.unassignedCount || 0}</div>
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff0f0', display: 'flex', alignItems: 'center', justify: 'center', color: RED, fontSize: 20 }}>⚠️</div>
          <div>
            <div style={{ fontSize: 12, color: TEXT_MUTED }}>Overdue Follow-ups</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_MAIN, marginTop: 2 }}>{data?.overdueFollowupsCount || 0}</div>
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f0ecff', display: 'flex', alignItems: 'center', justify: 'center', color: PURPLE, fontSize: 20 }}>🎓</div>
          <div>
            <div style={{ fontSize: 12, color: TEXT_MUTED }}>Weekly Demos Scheduled</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_MAIN, marginTop: 2 }}>{upcomingDemos.length}</div>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        {/* Left Hand: Active Callers & Targets, Unassigned lead manager */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Active Callers & Targets */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT_MAIN, marginBottom: 16 }}>
              Caller Quotas & Dial Performance Today
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {liveCallers.map(caller => {
                const callsToday = caller.callsToday || 0;
                const quotaPct = Math.min(100, Math.round((callsToday / 30) * 100));
                const barColor = callsToday >= 25 ? GREEN : callsToday >= 10 ? AMBER : RED;
                return (
                  <div key={caller.user?._id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: caller.isActive ? GREEN : '#cbd5e1' }} />
                        <strong style={{ color: TEXT_MAIN, fontSize: 13 }}>{caller.user?.name}</strong>
                        <span style={{ fontSize: 11, color: TEXT_MUTED }}>Last active: {caller.lastCallTime ? new Date(caller.lastCallTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: barColor }}>{callsToday} / 30 Calls ({quotaPct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: '#f1f0f6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${quotaPct}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unassigned Leads Management Drawer */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT_MAIN, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📥</span> Unassigned Lead Queue ({unassignedLeads.length} leads)
            </h3>
            {unassignedLeads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: TEXT_MUTED }}>🎉 All leads have been assigned to callers!</div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #f0ecff', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ background: '#faf9ff', position: 'sticky', top: 0 }}>
                    <tr style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_MUTED, height: 32 }}>
                      <th style={{ textAlign: 'left', fontWeight: 600, paddingLeft: 12 }}>Name</th>
                      <th style={{ textAlign: 'center', fontWeight: 600 }}>Source</th>
                      <th style={{ textAlign: 'right', fontWeight: 600, paddingRight: 12 }}>Assign Caller</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unassignedLeads.slice(0, 15).map(lead => (
                      <tr key={lead._id} style={{ borderBottom: '1px solid #faf9ff', height: 42 }}>
                        <td style={{ paddingLeft: 12 }}>
                          <strong style={{ color: TEXT_MAIN }}>{lead.name}</strong>
                          <div style={{ fontSize: 11, color: TEXT_MUTED }}>{lead.phone}</div>
                        </td>
                        <td style={{ textAlign: 'center', color: '#555' }}>
                          {lead.leadSource || 'Manual'}
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: 12 }}>
                          <select
                            disabled={assigningId === lead._id}
                            value=""
                            onChange={(e) => handleAssignUnassigned(lead._id, e.target.value)}
                            style={{ border: '1px solid #e5e2f5', borderRadius: 6, padding: '4px 8px', fontSize: 12, outline: 'none', color: TEXT_MAIN }}
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

          {/* Overdue Follow-ups team listing */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT_MAIN, marginBottom: 16 }}>
              Overdue Callbacks & Reassignments
            </h3>
            {detailedOverdueFollowups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: TEXT_MUTED }}>🎉 No overdue followups across the team!</div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_MUTED, height: 32 }}>
                      <th style={{ textAlign: 'left', fontWeight: 600 }}>Lead Name</th>
                      <th style={{ textAlign: 'center', fontWeight: 600 }}>Scheduled Date</th>
                      <th style={{ textAlign: 'center', fontWeight: 600 }}>Assigned Caller</th>
                      <th style={{ textAlign: 'right', fontWeight: 600 }}>Reassign</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedOverdueFollowups.slice(0, 15).map(fu => (
                      <tr key={fu._id} style={{ borderBottom: '1px solid #faf9ff', height: 42 }}>
                        <td>
                          <strong style={{ color: TEXT_MAIN }}>{fu.lead?.name || 'Lead'}</strong>
                          <div style={{ fontSize: 11, color: TEXT_MUTED }}>{fu.lead?.phone}</div>
                        </td>
                        <td style={{ textAlign: 'center', color: RED, fontWeight: 600 }}>
                          {new Date(fu.scheduledAt).toLocaleDateString()} {new Date(fu.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ textAlign: 'center', color: TEXT_MAIN }}>
                          {fu.assignedTo?.name || 'Unassigned'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <select
                            disabled={updatingId === fu.lead?._id}
                            value={fu.assignedTo?._id || ''}
                            onChange={(e) => handleReassignLead(fu.lead?._id, e.target.value)}
                            style={{ border: '1px solid #e5e2f5', borderRadius: 6, padding: '4px 8px', fontSize: 12, outline: 'none', color: TEXT_MAIN }}
                          >
                            <option value="">Choose Caller...</option>
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
        </div>

        {/* Right Hand: Dynamic Alerts/Notifications, DemosScheduled, Followup workload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Notifications / Live Alert Feed */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT_MAIN, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔔</span> Real-Time Operational Alerts
            </h3>
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: TEXT_MUTED, fontSize: 12.5 }}>No operational alerts generated today.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 320, overflowY: 'auto', paddingRight: 6 }}>
                {notifications.slice(0, 20).map(note => {
                  let badgeBg = '#f0ecff', badgeColor = PURPLE;
                  if (note.type === 'overdue') { badgeBg = '#fff0f0'; badgeColor = RED; }
                  else if (note.type === 'demo') { badgeBg = '#e8f8f0'; badgeColor = GREEN; }
                  else if (note.type === 'idle') { badgeBg = '#fff8e6'; badgeColor = AMBER; }
                  return (
                    <div key={note.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, background: '#faf9ff', border: '1px solid #f0ecff', borderRadius: 8, padding: 10, fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ background: badgeBg, color: badgeColor, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase' }}>
                          {note.title}
                        </span>
                        <span style={{ fontSize: 10, color: TEXT_MUTED }}>
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

          {/* Demos Scheduled This Week */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT_MAIN, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🎓</span> Demos Scheduled (This Week)
            </h3>
            {upcomingDemos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: TEXT_MUTED, fontSize: 12.5 }}>No demos booked this calendar week.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                {upcomingDemos.map(demo => (
                  <div key={demo._id} style={{ border: '1px solid #e8f8f0', borderRadius: 8, padding: 12, background: '#fafdbf' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ color: TEXT_MAIN, fontSize: 12.5 }}>{demo.name}</strong>
                      <span style={{ fontSize: 9.5, background: '#e8f8f0', color: GREEN, padding: '2px 6px', borderRadius: 8, fontWeight: 700 }}>Demo Slot</span>
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>Assigned: {demo.assignedTo?.name || 'Unassigned'}</div>
                    <div style={{ fontSize: 11.5, color: GREEN, fontWeight: 700, marginTop: 6 }}>
                      📅 {new Date(demo.demoScheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workload allocations */}
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT_MAIN, marginBottom: 14 }}>
              Today's Callbacks Workload load
            </h3>
            {workload.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: TEXT_MUTED, fontSize: 12.5 }}>No workloads scheduled.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {workload.map(item => (
                  <div key={item.user?._id} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '6px 12px', border: '1px solid #faf9ff', borderRadius: 6, background: '#fcfbfe', fontSize: 13 }}>
                    <strong style={{ color: TEXT_MAIN }}>{item.user?.name}</strong>
                    <span style={{ color: PURPLE, fontWeight: 700 }}>{item.count} callbacks</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
