import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

const PURPLE = '#5b3fc7';
const PURPLE_LIGHT = '#f0ecff';
const TEXT_MAIN = '#2d2d6b';
const TEXT_MUTED = '#888';
const BORDER = '#e5e2f5';
const WHITE = '#ffffff';
const GREEN = '#22a163';
const RED = '#e53e3e';

export default function Users() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super admin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;

  // Route protection
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'caller',
    isActive: true
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'caller',
      isActive: true
    });
    setError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (u) => {
    setCurrentUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      password: '',
      role: u.role,
      isActive: u.isActive
    });
    setError('');
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await usersAPI.create(formData);
      setShowAddModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        isActive: formData.isActive
      };
      if (formData.password) payload.password = formData.password;
      if (isSuperAdmin) payload.role = formData.role;
      
      await usersAPI.update(currentUser._id, payload);
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;
    try {
      await usersAPI.delete(id);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Styles
  const modalOverlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(45, 45, 107, 0.4)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease'
  };

  const modalContentStyle = {
    background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16,
    width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 12px 40px rgba(91, 63, 199, 0.15)',
    display: 'flex', flexDirection: 'column', gap: 16, position: 'relative'
  };

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#555',
    textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: `1px solid ${BORDER}`,
    borderRadius: 8, fontSize: 13, outline: 'none', background: '#faf9ff',
    color: TEXT_MAIN, boxSizing: 'border-box'
  };

  const btnPrimary = {
    background: PURPLE, color: WHITE, border: 'none', padding: '10px 16px',
    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    transition: 'background 0.15s'
  };

  const btnCancel = {
    background: '#f3f4f6', color: '#555', border: 'none', padding: '10px 16px',
    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
  };

  const getRoleBadgeStyle = (role) => {
    let bg = '#eff6ff', color = '#1e40af';
    if (role === 'super admin') { bg = '#fef2f2'; color = '#991b1b'; }
    if (role === 'admin') { bg = '#f5f3ff'; color = '#5b3fc7'; }
    return {
      display: 'inline-block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: 20, background: bg, color
    };
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT_MAIN, margin: 0 }}>User Management</h2>
          <p style={{ fontSize: 12, color: TEXT_MUTED, margin: '4px 0 0 0' }}>Add, update, or manage caller accounts and permissions</p>
        </div>
        <button onClick={handleOpenAdd} style={btnPrimary}>
          + Add User
        </button>
      </div>

      {/* Users table */}
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#faf9ff', borderBottom: `1px solid ${BORDER}` }}>
              <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase' }}>Name</th>
              <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase' }}>Email</th>
              <th style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase' }}>Phone</th>
              <th style={{ padding: '12px 18px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '12px 18px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '12px 18px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <tr key={i} style={{ borderBottom: `1px solid #f9f8ff` }}>
                  <td colSpan={6} style={{ padding: '16px' }}><div style={{ height: 20, background: '#f0ecff', borderRadius: 4, animation: 'pulse 1.5s infinite' }} /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: TEXT_MUTED, fontSize: 13 }}>No users registered.</td>
              </tr>
            ) : (
              users.map(u => {
                const initials = u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <tr key={u._id} style={{ borderBottom: `1px solid #faf9ff` }}
                    onMouseEnter={e => e.currentTarget.style.background = '#faf8ff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: PURPLE_LIGHT, color: PURPLE, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {initials}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_MAIN }}>{u.name}</span>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 13, color: '#444' }}>{u.email}</td>
                    <td style={{ padding: '12px 18px', fontSize: 13, color: '#666', fontFamily: 'monospace' }}>{u.phone || '—'}</td>
                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <span style={getRoleBadgeStyle(u.role)}>{u.role}</span>
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', fontSize: 11, fontWeight: 600,
                        padding: '2px 8px', borderRadius: 20,
                        background: u.isActive ? '#e8f8f0' : '#f3f4f6',
                        color: u.isActive ? GREEN : TEXT_MUTED
                      }}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        {/* Edit Button (Allowed for Admin on Callers, Super Admin on all except Super Admin self-role modification restriction) */}
                        {(!isAdmin || (user.role === 'admin' && u.role === 'caller') || isSuperAdmin) && (
                          <button onClick={() => handleOpenEdit(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', padding: 4, borderRadius: 4 }}
                            onMouseEnter={e => e.currentTarget.style.color = PURPLE}
                            onMouseLeave={e => e.currentTarget.style.color = '#888'}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>
                          </button>
                        )}
                        {/* Delete Button (Only Super Admin can delete, cannot delete super admins) */}
                        {isSuperAdmin && u.role !== 'super admin' && (
                          <button onClick={() => handleDelete(u._id, u.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', padding: 4, borderRadius: 4 }}
                            onMouseEnter={e => e.currentTarget.style.color = RED}
                            onMouseLeave={e => e.currentTarget.style.color = '#888'}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT_MAIN, margin: 0 }}>Add New User</h3>
            {error && <div style={{ fontSize: 12, color: RED, background: '#fff0f0', border: `1px solid ${RED}`, borderRadius: 6, padding: 8 }}>{error}</div>}
            
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input required type="text" style={inputStyle} placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input required type="email" style={inputStyle} placeholder="john@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input type="text" style={inputStyle} placeholder="919000000000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input required minLength={6} type="password" style={inputStyle} placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <select style={inputStyle} disabled={!isSuperAdmin} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <option value="caller">Caller</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={btnCancel}>Cancel</button>
                <button type="submit" style={btnPrimary}>Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT_MAIN, margin: 0 }}>Edit User Details</h3>
            {error && <div style={{ fontSize: 12, color: RED, background: '#fff0f0', border: `1px solid ${RED}`, borderRadius: 6, padding: 8 }}>{error}</div>}
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input required type="text" style={inputStyle} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Email Address (Cannot Change)</label>
                <input type="email" style={{ ...inputStyle, background: '#f3f4f6', cursor: 'not-allowed' }} disabled value={formData.email} />
              </div>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input type="text" style={inputStyle} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>New Password (Leave blank to keep current)</label>
                <input type="password" style={inputStyle} placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <select style={inputStyle} disabled={!isSuperAdmin || currentUser?.role === 'super admin'} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <option value="caller">Caller</option>
                  <option value="admin">Admin</option>
                  {currentUser?.role === 'super admin' && <option value="super admin">Super Admin</option>}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                <label htmlFor="isActive" style={{ fontSize: 13, color: TEXT_MAIN, fontWeight: 500, cursor: 'pointer' }}>Account is Active</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={btnCancel}>Cancel</button>
                <button type="submit" style={btnPrimary}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
