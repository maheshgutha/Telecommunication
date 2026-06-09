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

export default function StaleLeads() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [callers, setCallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super admin';

  const fetchData = async () => {
    try {
      const [analysisRes, usersRes] = await Promise.all([
        reportsAPI.adminAnalysis(),
        usersAPI.getAll()
      ]);
      setData(analysisRes.data);
      setCallers(usersRes.data.users?.filter(u => u.role === 'caller') || []);
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

  const handleReassign = async (leadId, callerId) => {
    if (!callerId) return;
    setUpdatingId(leadId);
    try {
      await leadsAPI.update(leadId, { assignedTo: callerId });
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to reassign: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
      <div style={{ width: 32, height: 32, border: `4px solid ${PURPLE}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const staleLeads = data?.staleLeadsList || [];
  const overdueFollowups = data?.detailedOverdueFollowups?.filter(f => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return new Date(f.scheduledAt) < twentyFourHoursAgo;
  }) || [];

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f1fb', paddingBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: TEXT_MAIN }}>Stale Leads Alert Console</h2>
          <p style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 2 }}>
            Monitor and recover leads falling through the cracks (idle 3+ days or overdue by 24h+).
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          style={{ background: PURPLE, color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Refresh Console
        </button>
      </div>

      {/* Overview stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: RED, fontSize: 20 }}>🛑</div>
          <div>
            <div style={{ fontSize: 13, color: TEXT_MUTED }}>Leads Stale (Idle 3+ Days)</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: TEXT_MAIN, marginTop: 2 }}>{data?.staleLeadsCount || 0}</div>
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff8e6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: AMBER, fontSize: 20 }}>⏰</div>
          <div>
            <div style={{ fontSize: 13, color: TEXT_MUTED }}>Follow-ups Overdue by 24h+</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: TEXT_MAIN, marginTop: 2 }}>{overdueFollowups.length}</div>
          </div>
        </div>
      </div>

      {/* Main content tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* Table 1: Stale Leads */}
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT_MAIN, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: RED }}>•</span> Leads with No Contact in 3+ Days ({staleLeads.length} visible)
          </h3>
          {staleLeads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: TEXT_MUTED }}>🎉 Outstanding! No stale leads found in the system.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_MUTED, height: 32 }}>
                    <th style={{ textAlign: 'left', fontWeight: 600, paddingBottom: 8 }}>Student Details</th>
                    <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 8 }}>Current Status</th>
                    <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 8 }}>Last Contacted</th>
                    <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 8 }}>Assigned Caller</th>
                    <th style={{ textAlign: 'right', fontWeight: 600, paddingBottom: 8 }}>Quick Reassign</th>
                  </tr>
                </thead>
                <tbody>
                  {staleLeads.map(lead => {
                    const idleTime = lead.lastCalledAt
                      ? Math.round((Date.now() - new Date(lead.lastCalledAt).getTime()) / (24 * 60 * 60 * 1000))
                      : Math.round((Date.now() - new Date(lead.createdAt).getTime()) / (24 * 60 * 60 * 1000));
                    return (
                      <tr key={lead._id} style={{ borderBottom: '1px solid #faf9ff', height: 50 }}>
                        <td style={{ padding: '8px 0' }}>
                          <strong style={{ color: TEXT_MAIN }}>{lead.name}</strong>
                          <div style={{ fontSize: 11, color: TEXT_MUTED }}>{lead.phone} • {lead.email || 'No email'}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <StatusBadge status={lead.status} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ color: RED, fontWeight: 700 }}>{idleTime} days idle</span>
                          <div style={{ fontSize: 10, color: TEXT_MUTED }}>
                            {lead.lastCalledAt ? `Last call: ${new Date(lead.lastCalledAt).toLocaleDateString()}` : `Created: ${new Date(lead.createdAt).toLocaleDateString()}`}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', color: TEXT_MAIN }}>
                          {lead.assignedTo?.name || <span style={{ color: AMBER, fontWeight: 600 }}>Unassigned</span>}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px 0' }}>
                          <select
                            disabled={updatingId === lead._id}
                            value={lead.assignedTo?._id || ''}
                            onChange={(e) => handleReassign(lead._id, e.target.value)}
                            style={{ border: '1px solid #e5e2f5', borderRadius: 6, padding: '4px 8px', fontSize: 12, outline: 'none', color: TEXT_MAIN, background: '#fff' }}
                          >
                            <option value="">Choose Caller...</option>
                            {callers.map(c => (
                              <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Table 2: Overdue Follow-ups */}
        <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: TEXT_MAIN, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: AMBER }}>•</span> Overdue Follow-ups by 24h+ ({overdueFollowups.length} total)
          </h3>
          {overdueFollowups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: TEXT_MUTED }}>🎉 Awesome! No followups are overdue by 24 hours.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}`, color: TEXT_MUTED, height: 32 }}>
                    <th style={{ textAlign: 'left', fontWeight: 600, paddingBottom: 8 }}>Lead Target</th>
                    <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 8 }}>Scheduled Call Time</th>
                    <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 8 }}>Follow-up Note</th>
                    <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 8 }}>Current Caller</th>
                    <th style={{ textAlign: 'right', fontWeight: 600, paddingBottom: 8 }}>Quick Reassign</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueFollowups.map(fu => {
                    const hoursLate = Math.round((Date.now() - new Date(fu.scheduledAt).getTime()) / (60 * 60 * 1000));
                    return (
                      <tr key={fu._id} style={{ borderBottom: '1px solid #faf9ff', height: 50 }}>
                        <td style={{ padding: '8px 0' }}>
                          <strong style={{ color: TEXT_MAIN }}>{fu.lead?.name || 'Unknown Lead'}</strong>
                          <div style={{ fontSize: 11, color: TEXT_MUTED }}>Status: {fu.lead?.status}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ color: AMBER, fontWeight: 700 }}>{hoursLate}h overdue</span>
                          <div style={{ fontSize: 10, color: TEXT_MUTED }}>
                            Scheduled: {new Date(fu.scheduledAt).toLocaleDateString()} {new Date(fu.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', color: '#555', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fu.note}>
                          {fu.note || 'No notes left.'}
                        </td>
                        <td style={{ textAlign: 'center', color: TEXT_MAIN }}>
                          {fu.assignedTo?.name || 'Unassigned'}
                        </td>
                        <td style={{ textAlign: 'right', padding: '8px 0' }}>
                          <select
                            disabled={updatingId === fu.lead?._id}
                            value={fu.assignedTo?._id || ''}
                            onChange={(e) => handleReassign(fu.lead?._id, e.target.value)}
                            style={{ border: '1px solid #e5e2f5', borderRadius: 6, padding: '4px 8px', fontSize: 12, outline: 'none', color: TEXT_MAIN, background: '#fff' }}
                          >
                            <option value="">Choose Caller...</option>
                            {callers.map(c => (
                              <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
