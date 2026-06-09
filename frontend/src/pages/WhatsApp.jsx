import { useNavigate } from 'react-router-dom';

export default function WhatsApp() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: 'calc(100vh - 48px)', background: '#f3f1fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#aaa' }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom: 16 }}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#2d2d6b', marginBottom: 8 }}>WhatsApp CRM</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Connect your WhatsApp Business account to start messaging leads.</div>
        <button
          onClick={() => navigate('/message-templates')}
          style={{ padding: '10px 24px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          View Message Templates
        </button>
      </div>
    </div>
  );
}