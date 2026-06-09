import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    initials: user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '',
    email: user?.email || '',
    state: 'Working',
    role: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Caller',
    permissionTemplate: 'Default Caller Permissions',
    reportingTo: '',
    phone: user?.phone || '918143172233',
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (updateUser) updateUser({ ...user, name: form.name, email: form.email, phone: form.phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f1fb', padding: '32px 0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5b3fc7" strokeWidth="2" strokeLinecap="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#2d2d6b' }}>User</span>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e2f5', padding: '32px 36px' }}>
          {/* Name + Initials row */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 22 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Name <span style={{ color: '#e53e3e' }}>*</span></label>
              <input
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                style={inputStyle}
                placeholder="Full name"
              />
            </div>
            <div style={{ width: 180 }}>
              <label style={labelStyle}>Initials <span style={{ color: '#e53e3e' }}>*</span></label>
              <input
                value={form.initials}
                onChange={e => handleChange('initials', e.target.value)}
                style={inputStyle}
                placeholder="e.g. PT"
                maxLength={3}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>Email <span style={{ color: '#e53e3e' }}>*</span></label>
            <input
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              style={inputStyle}
              type="email"
              placeholder="email@example.com"
            />
          </div>

          {/* State */}
          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>State</label>
            <div style={{ position: 'relative' }}>
              <select
                value={form.state}
                onChange={e => handleChange('state', e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                <option>Working</option>
                <option>On Leave</option>
                <option>Inactive</option>
              </select>
              <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          {/* Roles */}
          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>Roles</label>
            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 8, background: '#f9f9fb' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
              </svg>
              <span style={{ color: '#444', fontSize: 13 }}>{form.role}</span>
            </div>
          </div>

          {/* Permission template */}
          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>Permission template</label>
            <input
              value={form.permissionTemplate}
              readOnly
              style={{ ...inputStyle, background: '#f9f9fb', color: '#666', cursor: 'default' }}
            />
          </div>

          {/* Reporting to */}
          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>Reporting to</label>
            <input
              value={form.reportingTo}
              onChange={e => handleChange('reportingTo', e.target.value)}
              style={inputStyle}
              placeholder="Select superior"
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>Phone</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid #ddd', borderRadius: 8, background: '#f9f9fb', overflow: 'hidden' }}>
              <div style={{ padding: '10px 12px', borderRight: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: 6, background: '#fff' }}>
                <span style={{ fontSize: 16 }}>🇮🇳</span>
              </div>
              <input
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 12px', fontSize: 13, background: 'transparent', color: '#333' }}
                placeholder="Phone number"
              />
            </div>
          </div>

          {/* Save button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSave}
              style={{
                background: saved ? '#22a163' : '#5b3fc7',
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '10px 28px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'background 0.2s'
              }}
            >
              {saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#666', marginBottom: 6
};
const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #ddd', borderRadius: 8,
  fontSize: 13, color: '#333', outline: 'none',
  background: '#fff', boxSizing: 'border-box'
};