import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const [now, setNow] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'followup', title: 'Follow-up Reminder', message: 'You have 3 pending follow-ups today', time: '2m ago', read: false },
    { id: 2, type: 'lead', title: 'New Lead Assigned', message: 'A new lead has been assigned to you', time: '15m ago', read: false },
    { id: 3, type: 'campaign', title: 'Campaign Update', message: '@engg-clgs campaign has new leads', time: '1h ago', read: true },
    { id: 4, type: 'system', title: 'System Update', message: 'AOTMS updated to v189.1', time: '3h ago', read: true },
  ]);
  const bellRef = useRef(null);
  const dropRef = useRef(null);
  const profileRef = useRef(null);
  const profileDropRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target) &&
          bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileDropRef.current && !profileDropRef.current.contains(e.target) &&
          profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const notifIcon = (type) => {
    if (type === 'followup') return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5b3fc7" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    );
    if (type === 'lead') return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22a163" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
    );
    if (type === 'campaign') return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
    );
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    );
  };

  const notifBg = (type) => {
    if (type === 'followup') return '#f0ecff';
    if (type === 'lead') return '#e8f8f0';
    if (type === 'campaign') return '#fff8e6';
    return '#f3f4f6';
  };

  // Role label — try to use user.role, fallback to "Caller"
  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Caller';

  const profileMenuItems = [
    {
      label: 'Profile',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      onClick: () => { setShowProfile(false); navigate('/profile'); }
    },
    {
      label: 'Message Templates',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      onClick: () => { setShowProfile(false); navigate('/message-templates'); }
    },
    {
      label: 'Blocklist',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      ),
      onClick: () => { setShowProfile(false); navigate('/blocklist'); }
    },
    {
      label: 'My Preferences',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      onClick: () => { setShowProfile(false); navigate('/my-preferences'); }
    },
    {
      label: 'Logout',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      ),
      onClick: () => { setShowProfile(false); logout(); },
      danger: true
    },
  ];

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 48,
      background: '#ffffff', borderBottom: '1px solid #e5e2f5',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px 0 10px', zIndex: 100
    }}>
      {/* Left: logo + org name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, background: '#5b3fc7', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5b3fc7" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#2d2d6b' }}>Academy Of Tech Masters</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* Right: time + clock + bell + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ textAlign: 'right', marginRight: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#2d2d6b' }}>{timeStr}</div>
          <div style={{ fontSize: 10, color: '#888' }}>{dateStr}</div>
        </div>

        {/* Clock icon */}
        <div style={{
          width: 30, height: 30, border: '1px solid #e5e2f5', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>

        {/* Bell - WORKING */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <div
            onClick={() => { setShowNotifications(prev => !prev); setShowProfile(false); }}
            style={{
              width: 30, height: 30, border: `1px solid ${showNotifications ? '#5b3fc7' : '#e5e2f5'}`,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
              background: showNotifications ? '#f0ecff' : 'transparent',
              transition: 'all 0.15s'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={showNotifications ? '#5b3fc7' : '#888'} strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <div style={{
                width: unreadCount > 9 ? 14 : 8,
                height: 8,
                background: '#e53e3e',
                borderRadius: '50%',
                position: 'absolute', top: 3, right: 3,
                border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, color: '#fff', fontWeight: 700,
                lineHeight: 1
              }}>
                {unreadCount > 9 ? '9+' : ''}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              ref={dropRef}
              style={{
                position: 'absolute', top: 36, right: -8,
                width: 320, background: '#fff',
                border: '1px solid #e5e2f5', borderRadius: 12,
                boxShadow: '0 8px 32px rgba(91,63,199,0.12)',
                zIndex: 200, overflow: 'hidden',
                animation: 'fadeSlideDown 0.15s ease'
              }}
            >
              <style>{`
                @keyframes fadeSlideDown {
                  from { opacity: 0; transform: translateY(-6px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderBottom: '1px solid #f0ecff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#2d2d6b' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#fff',
                      background: '#5b3fc7', borderRadius: 10,
                      padding: '1px 6px'
                    }}>{unreadCount}</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      fontSize: 11, color: '#5b3fc7', background: 'none',
                      border: 'none', cursor: 'pointer', fontWeight: 600
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: '#888', fontSize: 13 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                    No notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      style={{
                        display: 'flex', gap: 12, padding: '12px 16px',
                        borderBottom: '1px solid #f9f8ff',
                        background: n.read ? '#fff' : '#faf9ff',
                        cursor: 'pointer',
                        transition: 'background 0.1s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
                      onMouseLeave={e => e.currentTarget.style.background = n.read ? '#fff' : '#faf9ff'}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: notifBg(n.type),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {notifIcon(n.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: n.read ? 500 : 700, color: '#2d2d6b' }}>{n.title}</span>
                          <span style={{ fontSize: 10, color: '#aaa', flexShrink: 0, marginLeft: 8 }}>{n.time}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.4 }}>{n.message}</div>
                      </div>
                      {!n.read && (
                        <div style={{ width: 7, height: 7, background: '#5b3fc7', borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div style={{ padding: '10px 16px', borderTop: '1px solid #f0ecff', textAlign: 'center' }}>
                <button style={{ fontSize: 12, color: '#5b3fc7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar with Dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <div
            onClick={() => { setShowProfile(prev => !prev); setShowNotifications(false); }}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: showProfile ? '#4a2fb5' : '#5b3fc7',
              color: '#fff', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: showProfile ? '0 0 0 3px #e0d9ff' : 'none',
              transition: 'all 0.15s'
            }}
          >
            {initials}
          </div>

          {/* Profile Dropdown */}
          {showProfile && (
            <div
              ref={profileDropRef}
              style={{
                position: 'absolute', top: 38, right: 0,
                width: 240, background: '#fff',
                border: '1px solid #e5e2f5', borderRadius: 14,
                boxShadow: '0 8px 32px rgba(91,63,199,0.14)',
                zIndex: 200, overflow: 'hidden',
                animation: 'fadeSlideDown 0.15s ease'
              }}
            >
              {/* User info header */}
              <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #f0ecff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#2d2d6b' }}>
                    {user?.name || 'User'}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: '#5b3fc7',
                    background: '#f0ecff', borderRadius: 20, padding: '2px 8px'
                  }}>
                    Pro
                  </span>
                </div>
                <div style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 500,
                  color: '#666', background: '#f3f4f6',
                  borderRadius: 20, padding: '2px 10px', marginBottom: 6
                }}>
                  {roleLabel}
                </div>
                <div style={{ fontSize: 11, color: '#5b3fc7', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#5b3fc7" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  {user?.email || 'user@example.com'}
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '6px 0' }}>
                {profileMenuItems.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={item.onClick}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 16px', cursor: 'pointer',
                      color: item.danger ? '#e53e3e' : '#2d2d6b',
                      fontSize: 13, fontWeight: 500,
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = item.danger ? '#fff5f5' : '#f5f3ff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ color: item.danger ? '#e53e3e' : '#888', display: 'flex' }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}