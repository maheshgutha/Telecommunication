import { useState } from 'react';

const Toggle = ({ checked, onChange }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
      background: checked ? '#3d2f8f' : '#ddd',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0
    }}
  >
    <div style={{
      width: 18, height: 18, borderRadius: '50%', background: '#fff',
      position: 'absolute', top: 3,
      left: checked ? 23 : 3,
      transition: 'left 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
    }} />
  </div>
);

const RadioOption = ({ label, checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#444' }}>
    <input
      type="radio" checked={checked} onChange={onChange}
      style={{ accentColor: '#5b3fc7', width: 15, height: 15, cursor: 'pointer' }}
    />
    {label}
  </label>
);

export default function MyPreferences() {
  const [emailPref, setEmailPref] = useState('Send to Mobile');
  const [whatsappPref, setWhatsappPref] = useState('Send to Mobile');
  const [notifs, setNotifs] = useState({
    paymentPending: true,
    paymentCompleted: true,
    paymentFailed: true,
    newLeadInCampaign: true,
    callReminder: true,
  });

  const toggleNotif = (key) => setNotifs(prev => ({ ...prev, [key]: !prev[key] }));

  const notifItems = [
    { key: 'paymentPending', label: 'Payment Pending' },
    { key: 'paymentCompleted', label: 'Payment Completed' },
    { key: 'paymentFailed', label: 'Payment Failed' },
    { key: 'newLeadInCampaign', label: 'New Lead in Campaign' },
    { key: 'callReminder', label: 'Call Reminder' },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 48px)', background: '#f3f1fb', padding: '32px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: 15, color: '#666', marginBottom: 24, fontWeight: 500 }}>My Preferences</div>

        {/* Desktop Preferences */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e2f5', marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #f0ecff' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2d2d6b', margin: 0 }}>Desktop Preferences</h2>
          </div>

          {/* Email */}
          <div style={{ padding: '16px 28px', borderBottom: '1px solid #f9f8ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>1. How to handle one-click email</span>
            <div style={{ display: 'flex', gap: 24 }}>
              <RadioOption label="Web" checked={emailPref === 'Web'} onChange={() => setEmailPref('Web')} />
              <RadioOption label="Send to Mobile" checked={emailPref === 'Send to Mobile'} onChange={() => setEmailPref('Send to Mobile')} />
            </div>
          </div>

          {/* WhatsApp */}
          <div style={{ padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>2. How to handle one-click whatsapp</span>
            <div style={{ display: 'flex', gap: 24 }}>
              <RadioOption label="Web" checked={whatsappPref === 'Web'} onChange={() => setWhatsappPref('Web')} />
              <RadioOption label="Send to Mobile" checked={whatsappPref === 'Send to Mobile'} onChange={() => setWhatsappPref('Send to Mobile')} />
            </div>
          </div>
        </div>

        {/* Notification Categories */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e2f5', overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #f0ecff' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2d2d6b', margin: 0 }}>Notification Categories</h2>
          </div>

          {notifItems.map((item, idx) => (
            <div
              key={item.key}
              style={{
                padding: '16px 28px',
                borderBottom: idx < notifItems.length - 1 ? '1px solid #f9f8ff' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                {idx + 1}. {item.label}
              </span>
              <Toggle checked={notifs[item.key]} onChange={() => toggleNotif(item.key)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}