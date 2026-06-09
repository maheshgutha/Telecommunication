import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadsAPI, usersAPI, blocklistAPI } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const PURPLE = '#5b3fc7';
const PURPLE_LIGHT = '#f0ecff';
const PURPLE_MID = '#c4b5fd';
const TEXT_MAIN = '#2d2d6b';
const TEXT_MUTED = '#888';
const BORDER = '#e5e2f5';
const WHITE = '#ffffff';

const STATUSES = ['All', 'Fresh', 'Connected', 'Call Not Responding', 'Call Back Later', 'Not interested', 'Demo Scheduled', 'Demo Done', 'Won', 'Lost', 'Blocked'];
const SOURCES = ['All', 'Manual', 'Facebook', 'WhatsApp', 'Website', 'Excel'];

const filterOptions = [
  { key: 'mine', label: 'My Leads' },
  { key: 'all', label: 'All Leads' },
  { key: 'assigned', label: 'Leads Assigned To Me' },
];

export default function Leads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super admin';
  const isAdmin = user?.role === 'admin' || user?.role === 'super admin';
  
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [source, setSource] = useState('All');
  const [filter, setFilter] = useState(isAdmin ? 'all' : 'mine');
  const [selected, setSelected] = useState([]);
  const [starred, setStarred] = useState({});
  const [callers, setCallers] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      usersAPI.getAll()
        .then(res => {
          const callersList = (res.data.users || []).filter(u => u.role === 'caller');
          setCallers(callersList);
        })
        .catch(err => console.error(err));
    }
  }, [user]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, filter };
      if (search) params.search = search;
      if (status !== 'All') params.status = status;
      if (source !== 'All') params.source = source;
      const res = await leadsAPI.getAll(params);
      setLeads(res.data.leads || []);
      setTotal(res.data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeads(); }, [page, search, status, source, filter]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this lead?')) return;
    await leadsAPI.delete(id);
    fetchLeads();
  };

  const handleBlock = async (lead, e) => {
    e.stopPropagation();
    const reason = prompt(`Enter reason for blocking ${lead.name} (optional):`, 'Spam Lead');
    if (reason === null) return; // cancelled
    
    try {
      const cleanPhone = lead.phone.replace(/[^0-9]/g, '');
      await blocklistAPI.add({
        phone: cleanPhone,
        name: lead.name,
        reason: reason || 'Spam Lead'
      });
      await leadsAPI.updateStatus(lead._id, { status: 'Blocked' });
      alert(`Lead ${lead.name} has been blocked and added to blocklist.`);
      fetchLeads();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to block lead');
    }
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  
  const activeLabel = (() => {
    const matched = filterOptions.find(f => f.key === filter);
    if (matched) return matched.label;
    const callerMatched = callers.find(c => c._id === filter);
    if (callerMatched) return `Leads - ${callerMatched.name}`;
    return 'Leads';
  })();

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: TEXT_MAIN }}>{activeLabel}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2.5" style={{ cursor: 'pointer' }} onClick={fetchLeads}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-5"/></svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2.5" style={{ cursor: 'pointer' }} onClick={() => navigate('/leads/new')}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{ border: `1.5px solid ${PURPLE}`, color: PURPLE, background: WHITE, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => navigate('/leads/new')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
            + Add Lead
          </button>
          <button style={{ border: `1px solid ${BORDER}`, color: '#555', background: WHITE, padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            More <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </div>

      {/* Search + dropdowns */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 12px', background: WHITE, flex: 1, maxWidth: 320 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search lead" style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, background: 'transparent' }} />
        </div>
        {[
          { label: 'Assignee', options: isAdmin ? ['All Assignees', ...callers.map(c => c.name)] : null },
          { label: 'Status', options: STATUSES },
          { label: 'Source', options: SOURCES },
        ].map((f, i) => (
          <select 
            key={i} 
            value={i === 0 && isAdmin ? (callers.find(c => c._id === filter)?.name || 'All Assignees') : (i === 1 ? status : source)}
            onChange={e => { 
              if (i === 0 && isAdmin) {
                const selectedCaller = callers.find(c => c.name === e.target.value);
                setFilter(selectedCaller ? selectedCaller._id : 'all');
                setPage(1);
              }
              if (i === 1) { setStatus(e.target.value); setPage(1); } 
              if (i === 2) { setSource(e.target.value); setPage(1); } 
            }} 
            style={{ padding: '6px 10px', border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12, color: '#555', background: WHITE, outline: 'none', cursor: 'pointer' }}
          >
            {f.options ? f.options.map(o => <option key={o}>{o}</option>) : <option>{f.label}</option>}
          </select>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 0 }}>
        {/* Filter panel */}
        <div style={{ width: 200, background: WHITE, border: `1px solid ${BORDER}`, borderRight: 'none', borderRadius: '10px 0 0 10px', padding: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Filters</div>
          {filterOptions.map(opt => (
            <div key={opt.key} onClick={() => { setFilter(opt.key); setPage(1); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13, background: filter === opt.key ? PURPLE_LIGHT : 'transparent', color: filter === opt.key ? PURPLE : '#555', marginBottom: 4, transition: 'all 0.15s' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                {opt.label}
              </span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={filter === opt.key ? PURPLE_MID : '#ddd'} strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
          ))}

          {isAdmin && callers.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 24, marginBottom: 12 }}>Callers</div>
              {callers.map(caller => (
                <div key={caller._id} onClick={() => { setFilter(caller._id); setPage(1); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 13, background: filter === caller._id ? PURPLE_LIGHT : 'transparent', color: filter === caller._id ? PURPLE : '#555', marginBottom: 4, transition: 'all 0.15s' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: filter === caller._id ? PURPLE : '#f0ecff', color: filter === caller._id ? '#fff' : PURPLE, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {caller.name[0].toUpperCase()}
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{caller.name}</span>
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={filter === caller._id ? PURPLE_MID : '#ddd'} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {/* Pagination row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: WHITE, border: `1px solid ${BORDER}`, borderLeft: 'none', borderBottom: 'none', borderRadius: '0 10px 0 0', padding: '8px 14px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 26, height: 26, border: `1px solid ${BORDER}`, borderRadius: 6, background: WHITE, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.4 : 1 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontSize: 13, color: '#555' }}>{Math.min((page-1)*20+1, total)}–{Math.min(page*20, total)} of {total}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} style={{ width: 26, height: 26, border: `1px solid ${BORDER}`, borderRadius: 6, background: WHITE, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page * 20 >= total ? 0.4 : 1 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderLeft: 'none', borderTop: 'none', borderRadius: '0 0 10px 0', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#faf9ff' }}>
                  <th style={{ padding: '10px 12px', width: 32 }}>
                    <input type="checkbox" onChange={e => setSelected(e.target.checked ? leads.map(l => l._id) : [])} />
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>Name</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: PURPLE, borderBottom: `1px solid ${BORDER}`, background: PURPLE_LIGHT, whiteSpace: 'nowrap' }}>Status ⇅</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>Rating ⇅</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, borderBottom: `1px solid ${BORDER}` }}>Assignee</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: TEXT_MUTED, borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>Created On ↑</th>
                  {isSuperAdmin && <th style={{ padding: '10px 12px', borderBottom: `1px solid ${BORDER}` }}></th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}><td colSpan={7} style={{ padding: '10px 12px' }}><div style={{ height: 16, background: '#f0eef8', borderRadius: 4 }} /></td></tr>
                  ))
                ) : leads.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#bbb', fontSize: 14 }}>No leads found</td></tr>
                ) : (
                  leads.map(lead => (
                    <tr key={lead._id} style={{ borderBottom: `1px solid #f5f3ff`, cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#faf8ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => navigate(`/leads/${lead._id}`)}
                    >
                      <td style={{ padding: '10px 12px' }} onClick={e => { e.stopPropagation(); toggleSelect(lead._id); }}>
                        <input type="checkbox" checked={selected.includes(lead._id)} onChange={() => {}} />
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: PURPLE }}>{lead.name}</div>
                        <div style={{ fontSize: 11, color: TEXT_MUTED, fontFamily: 'monospace' }}>{lead.phone}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}><StatusBadge status={lead.status} /></td>
                      <td style={{ padding: '10px 12px' }}>
                        <span onClick={e => { e.stopPropagation(); setStarred(s => ({ ...s, [lead._id]: !s[lead._id] })); }} style={{ cursor: 'pointer', color: starred[lead._id] ? '#f6ad55' : '#ddd', fontSize: 18 }}>★</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: PURPLE_LIGHT, color: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                            {lead.assignedTo?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span style={{ fontSize: 13 }}>{lead.assignedTo?.name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 13, color: '#666' }}>
                        {lead.createdAt ? format(new Date(lead.createdAt), 'dd MMM yyyy') : '—'}
                      </td>
                      {isSuperAdmin && (
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <button onClick={e => handleBlock(lead, e)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}
                              title="Block Lead"
                              onMouseEnter={e => { e.currentTarget.style.background = '#fff0f0'; e.currentTarget.style.color = '#e53e3e'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ccc'; }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                            </button>
                            <button onClick={e => handleDelete(lead._id, e)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}
                              title="Delete Lead"
                              onMouseEnter={e => { e.currentTarget.style.background = '#fff0f0'; e.currentTarget.style.color = '#e53e3e'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ccc'; }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}