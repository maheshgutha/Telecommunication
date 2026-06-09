import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PURPLE = '#5b3fc7';
const PURPLE_DARK = '#4a2eb8';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f1fb', display: 'flex', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Left panel */}
      <div style={{ display: 'none', width: '50%', background: `linear-gradient(135deg, ${PURPLE}, #8b5cf6)`, flexDirection: 'column', justifyContent: 'space-between', padding: 48, position: 'relative', overflow: 'hidden' }}
        className="hidden lg:flex">
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
          <div style={{ position: 'absolute', top: 80, left: 80, width: 256, height: 256, borderRadius: '50%', background: '#fff', filter: 'blur(48px)' }} />
          <div style={{ position: 'absolute', bottom: 80, right: 80, width: 384, height: 384, borderRadius: '50%', background: '#fff', filter: 'blur(64px)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>AOTMS</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Academy Of Tech Masters</div>
            </div>
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>Supercharge Your<br />Sales Calls</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.6 }}>Manage leads, track calls, and close more deals with the most powerful caller dashboard built for teams.</p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[['10K+', 'Leads Managed'], ['97%', 'Call Success Rate'], ['3x', 'Faster Closings']].map(([num, label]) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{num}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Logo for mobile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{ width: 40, height: 40, background: PURPLE, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#2d2d6b' }}>AOTMS</div>
              <div style={{ fontSize: 11, color: '#888' }}>Caller Portal</div>
            </div>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#2d2d6b', marginBottom: 4 }}>Welcome back</h1>
          <p style={{ color: '#888', marginBottom: 28, fontSize: 14 }}>Sign in to your caller dashboard</p>

          {error && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: 8, color: '#c53030', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, background: '#e53e3e', borderRadius: '50%', flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input type="email" placeholder="you@company.com" className="input-field" style={{ paddingLeft: 36 }} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="off" required />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Password</label>
                <a href="#" style={{ fontSize: 12, color: PURPLE, textDecoration: 'none' }}>Forgot password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••" className="input-field" style={{ paddingLeft: 36, paddingRight: 40 }} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} autoComplete="new-password" required />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex' }}>
                  {showPass
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#a78bfa' : PURPLE_DARK, color: '#fff', border: 'none', padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s' }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = PURPLE)}
              onMouseLeave={e => !loading && (e.currentTarget.style.background = PURPLE_DARK)}>
              {loading ? (
                <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} className="animate-spin" /> Signing in...</>
              ) : 'Sign in →'}
            </button>
          </form>

          <div style={{ marginTop: 28, padding: 16, background: '#fff', borderRadius: 10, border: '1px solid #e5e2f5' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Demo Credentials</div>
            <div style={{ fontSize: 12, color: '#555', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div><strong>Admin:</strong> admin@aotms.com / admin123</div>
              <div><strong>Caller:</strong> poojitha@aotms.com / caller123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}