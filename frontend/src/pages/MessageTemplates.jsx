import { useState, useEffect } from 'react';
import { messageTemplatesAPI } from '../services/api';

const TABS = ['WHATSAPP', 'SMS', 'EMAIL'];
const TAB_TYPE_MAP = { WHATSAPP: 'whatsapp', SMS: 'sms', EMAIL: 'email' };

// FIX BUG-06: Templates now saved to/loaded from database
export default function MessageTemplates() {
  const [activeTab, setActiveTab] = useState('WHATSAPP');
  const [selected, setSelected] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ shortcut: '', message: '', isShared: false });
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // All | Mine | Shared

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await messageTemplatesAPI.getAll({ type: TAB_TYPE_MAP[activeTab] });
      const all = res.data.templates || [];
      setTemplates(all);
      setSelected(all[0] || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilter('All');
    setSelected(null);
  };

  const handleAdd = async () => {
    if (!newTemplate.shortcut || !newTemplate.message) return;
    try {
      await messageTemplatesAPI.create({
        type: TAB_TYPE_MAP[activeTab],
        shortcut: newTemplate.shortcut,
        message: newTemplate.message,
        isShared: newTemplate.isShared,
      });
      setNewTemplate({ shortcut: '', message: '', isShared: false });
      setShowNewModal(false);
      fetchTemplates();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create template');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await messageTemplatesAPI.delete(id);
      fetchTemplates();
    } catch (err) {
      alert('Failed to delete template');
    }
  };

  const filteredTemplates = templates.filter(t => {
    if (filter === 'Mine') return !t.isShared;
    if (filter === 'Shared') return t.isShared;
    return true;
  });

  const tabIcon = (tab) => {
    if (tab === 'WHATSAPP') return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    );
    if (tab === 'SMS') return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
      </svg>
    );
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#2d2d6b' }}>Message Templates</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Manage reusable message templates for WhatsApp, SMS, and Email. Shared templates are visible to all team members.</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1.5px solid #e5e2f5', paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => handleTabChange(tab)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', border: 'none', background: 'none',
            borderBottom: activeTab === tab ? '2.5px solid #5b3fc7' : '2.5px solid transparent',
            color: activeTab === tab ? '#5b3fc7' : '#888',
            fontWeight: activeTab === tab ? 700 : 500,
            fontSize: 13, cursor: 'pointer', transition: 'all 0.15s'
          }}>
            {tabIcon(tab)} {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, minHeight: 500 }}>
        {/* Left Sidebar */}
        <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Filter + New button */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0ecff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <select value={filter} onChange={e => setFilter(e.target.value)}
              style={{ flex: 1, padding: '6px 8px', border: '1.5px solid #e5e2f5', borderRadius: 7, fontSize: 12, color: '#444', background: '#fff', outline: 'none' }}>
              <option>All</option>
              <option>Mine</option>
              <option>Shared</option>
            </select>
            <button onClick={() => setShowNewModal(true)} style={{
              padding: '6px 12px', background: '#5b3fc7', color: '#fff', border: 'none',
              borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap'
            }}>+ New</button>
          </div>

          {/* Template List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#888', fontSize: 13 }}>Loading...</div>
            ) : filteredTemplates.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#aaa', fontSize: 13 }}>
                No templates yet.<br />
                <span style={{ color: '#5b3fc7', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowNewModal(true)}>Create one →</span>
              </div>
            ) : filteredTemplates.map(t => (
              <div key={t._id}
                onClick={() => setSelected(t)}
                style={{
                  padding: '12px 14px', cursor: 'pointer',
                  borderBottom: '1px solid #faf9ff',
                  background: selected?._id === t._id ? '#f0ecff' : 'transparent',
                  borderLeft: selected?._id === t._id ? '3px solid #5b3fc7' : '3px solid transparent',
                  transition: 'all 0.12s'
                }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#2d2d6b', marginBottom: 3 }}>/{t.shortcut}</div>
                <div style={{ fontSize: 11.5, color: '#888', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{t.message}</div>
                {t.isShared && <div style={{ fontSize: 10, color: '#5b3fc7', marginTop: 3, fontWeight: 600 }}>Shared</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Preview */}
        <div style={{ background: '#fff', border: '1px solid #e5e2f5', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 14 }}>
              Select a template to preview
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#2d2d6b' }}>/{selected.shortcut}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    Created by {selected.createdBy?.name || 'You'} · {selected.isShared ? 'Shared with team' : 'Private'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { navigator.clipboard.writeText(selected.message); }}
                    style={{ padding: '7px 14px', background: '#f0ecff', color: '#5b3fc7', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >Copy</button>
                  <button
                    onClick={() => handleDelete(selected._id)}
                    style={{ padding: '7px 14px', background: '#fff0f0', color: '#e53e3e', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >Delete</button>
                </div>
              </div>

              <div style={{
                flex: 1, background: '#f7f5ff', borderRadius: 10,
                padding: 18, fontSize: 13.5, color: '#333',
                lineHeight: 1.7, whiteSpace: 'pre-wrap',
                border: '1.5px solid #e5e2f5'
              }}>
                {selected.message}
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Template Modal */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(45,45,107,0.4)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#2d2d6b', marginBottom: 20 }}>New {activeTab} Template</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d2d6b', marginBottom: 6 }}>Shortcut (no spaces)</label>
                <input
                  type="text" placeholder="e.g. intro"
                  value={newTemplate.shortcut}
                  onChange={e => setNewTemplate({ ...newTemplate, shortcut: e.target.value.replace(/\s/g, '') })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e2f5', borderRadius: 8, fontSize: 13.5, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#2d2d6b', marginBottom: 6 }}>Message</label>
                <textarea
                  rows={6} placeholder="Hi {{NAME}}, this is {{MY NAME}} from..."
                  value={newTemplate.message}
                  onChange={e => setNewTemplate({ ...newTemplate, message: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e5e2f5', borderRadius: 8, fontSize: 13.5, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={newTemplate.isShared} onChange={e => setNewTemplate({ ...newTemplate, isShared: e.target.checked })} />
                Share with all team members
              </label>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowNewModal(false)} style={{ padding: '10px 18px', border: '1.5px solid #e5e2f5', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#fff', color: '#2d2d6b', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleAdd} style={{ padding: '10px 18px', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#5b3fc7', color: '#fff', cursor: 'pointer' }}>Save Template</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
