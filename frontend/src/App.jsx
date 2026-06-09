import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyCalls from './pages/MyCalls';
import Leads from './pages/Leads';
import AddLead from './pages/AddLead';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import Leaderboard from './pages/Leaderboard';
import Reports from './pages/Reports';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import MessageTemplates from './pages/MessageTemplates';
import Blocklist from './pages/Blocklist';
import MyPreferences from './pages/MyPreferences';
import WhatsApp from './pages/WhatsApp';
import Users from './pages/Users';

import StaleLeads from './pages/StaleLeads';
import TeamOperations from './pages/TeamOperations';
import LeadProfile from './pages/LeadProfile';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading AOTMS...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="my-calls" element={<MyCalls />} />
            <Route path="leads" element={<Leads />} />
            <Route path="leads/new" element={<AddLead />} />
            <Route path="leads/:id" element={<LeadProfile />} />
            <Route path="leads/:id/edit" element={<AddLead />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="campaigns/:id" element={<CampaignDetail />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="reports" element={<Reports />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="profile" element={<Profile />} />
            <Route path="message-templates" element={<MessageTemplates />} />
            <Route path="blocklist" element={<Blocklist />} />
            <Route path="my-preferences" element={<MyPreferences />} />
            <Route path="whatsapp" element={<WhatsApp />} />
            <Route path="users" element={<Users />} />
            <Route path="stale-leads" element={<StaleLeads />} />
            <Route path="team-operations" element={<TeamOperations />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}