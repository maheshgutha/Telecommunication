import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", background: '#f3f1fb', minHeight: '100vh' }}>
      <Topbar />
      <Sidebar />
      <main style={{ marginLeft: 52, marginTop: 48, minHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}>
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}