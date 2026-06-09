import { useState, useEffect } from 'react';
import { blocklistAPI } from '../services/api';

const PURPLE = '#5b3fc7';
const PURPLE_LIGHT = '#f0ecff';
const GREEN = '#22a163';
const RED = '#e53e3e';
const AMBER = '#d97706';
const TEXT_MAIN = '#2d2d6b';
const TEXT_MUTED = '#888';
const BORDER = '#e5e2f5';

// FIX BUG-05: Replaced localStorage with real API calls
export default function Blocklist() {
  const [blockedList, setBlockedList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ phone: '', name: '', reason: 'Spam Lead' });
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await blocklistAPI.getAll(searchQuery ? { search: searchQuery } : {});
      setBlockedList(res.data.blocklist || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const showToast = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddBlock = async (e) => {
    e.preventDefault();
    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      alert('Please enter a valid phone number (min 10 digits)');
      return;
    }
    try {
      await blocklistAPI.add({ ...formData, phone: cleanPhone });
      setShowAddModal(false);
      setFormData({ phone: '', name: '', reason: 'Spam Lead' });
      showToast(`Number ${cleanPhone} has been blocked successfully.`);
      fetchList();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to block number');
    }
  };

  const handleUnblock = async (id, phone) => {
    if (!window.confirm(`Are you sure you want to unblock ${phone}?`)) return;
    try {
      await blocklistAPI.remove(id);
      showToast(`Number ${phone} has been unblocked.`);
      fetchList();
    } catch (err) {
      alert('Failed to unblock number');
    }
  };

  const filteredList = blockedList.filter(item =>
    item.phone.includes(searchQuery) ||
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: '#2d2d6b', color: '#fff',
          padding: '12px 24px', borderRadius: 8,
          fontSize: 13.5, fontWeight: 600,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          zIndex: 99999,
        }}>
          ✓ {notification}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f1fb', paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_MAIN, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🚫</span> Blocklist & Spam Control
          </div>
          <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 2 }}>
            Manage blocked contacts, spam callers, and Do Not Disturb (DND) registrations. Shared across all team members.
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: RED, color: '#fff', border: 'none',
            padding: '10px 20px', borderRadius: 8, fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Block New Number
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Blocked', value: blockedList.length, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>, bg: '#fff0f0', color: RED },
          { label: 'Spam Leads Filtered', value: blockedList.filter(i => i.reason?.includes('Spam')).length, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>, bg: '#fff8e6', color: AMBER },
          { label: 'DND Requests', value: blockedList.filter(i => i.reason?.includes('DND')).length, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.29 6.29l1.42-1.42a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>, bg: '#e8f8f0', color: GREEN },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: 12, color: TEXT_MUTED }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: TEXT_MAIN }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
        <div style={{ marginBottom: 16, maxWidth: 360, position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by phone, name or reason..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchList()}
            style={{ width: '100%', padding: '10px 14px 10px 36px', border: `1.5px solid ${BORDER}`, borderRadius: 8, fontSize: 13.5, outline: 'none', color: TEXT_MAIN, boxSizing: 'border-box' }}
          />
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth="2.5" style={{ position: 'absolute', left: 12, top: 12 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: TEXT_MUTED }}>Loading...</div>
        ) : filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: TEXT_MUTED, fontSize: 14 }}>No blocked numbers found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${BORDER}`, color: TEXT_MUTED, height: 32 }}>
                  <th style={{ textAlign: 'left', fontWeight: 600, paddingBottom: 10 }}>Phone Number</th>
                  <th style={{ textAlign: 'left', fontWeight: 600, paddingBottom: 10 }}>Contact Name</th>
                  <th style={{ textAlign: 'left', fontWeight: 600, paddingBottom: 10 }}>Reason</th>
                  <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 10 }}>Blocked By</th>
                  <th style={{ textAlign: 'center', fontWeight: 600, paddingBottom: 10 }}>Blocked At</th>
                  <th style={{ textAlign: 'right', fontWeight: 600, paddingBottom: 10 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(item => (
                  <tr key={item._id} style={{ borderBottom: '1px solid #faf9ff', height: 46 }}>
                    <td style={{ padding: '8px 0', fontWeight: 700, color: RED, fontFamily: 'monospace' }}>{item.phone}</td>
                    <td style={{ padding: '8px 0', fontWeight: 600, color: TEXT_MAIN }}>{item.name}</td>
                    <td style={{ padding: '8px 0' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        background: item.reason?.includes('Abuse') ? '#fff0f0' : item.reason?.includes('DND') ? '#e8f8f0' : '#fff8e6',
                        color: item.reason?.includes('Abuse') ? RED : item.reason?.includes('DND') ? GREEN : AMBER,
                        padding: '3px 8px', borderRadius: 12
                      }}>{item.reason}</span>
                    </td>
                    <td style={{ padding: '8px 0', textAlign: 'center', color: TEXT_MAIN, fontWeight: 500 }}>{item.blockedBy?.name || '—'}</td>
                    <td style={{ padding: '8px 0', textAlign: 'center', color: TEXT_MUTED }}>
                      {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>
                      <button
                        onClick={() => handleUnblock(item._id, item.phone)}
                        style={{ background: '#e8f8f0', color: GREEN, border: `1px solid ${GREEN}`, padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >Unblock</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(45,45,107,0.4)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: TEXT_MAIN, marginBottom: 18 }}>Block Phone Number</div>
            <form onSubmit={handleAddBlock} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Phone Number *', key: 'phone', type: 'text', placeholder: 'e.g. 9876543210' },
                { label: 'Contact Name', key: 'name', type: 'text', placeholder: 'e.g. John Doe' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TEXT_MAIN, marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={formData[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${BORDER}`, borderRadius: 8, fontSize: 13.5, outline: 'none', color: TEXT_MAIN, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: TEXT_MAIN, marginBottom: 6 }}>Reason</label>
                <select value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${BORDER}`, borderRadius: 8, fontSize: 13.5, outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                  <option>Spam Lead</option>
                  <option>Abusive Behavior</option>
                  <option>DND Request</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '10px 18px', border: `1.5px solid ${BORDER}`, borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#fff', color: TEXT_MAIN, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 18px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, background: RED, color: '#fff', cursor: 'pointer' }}>Confirm Block</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
