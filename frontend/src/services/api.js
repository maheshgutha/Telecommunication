import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || '/api';
if (baseURL.startsWith('http') && !baseURL.endsWith('/api') && !baseURL.endsWith('/api/')) {
  baseURL = baseURL.replace(/\/$/, '') + '/api';
}
const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aotms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('aotms_token');
      localStorage.removeItem('aotms_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const leadsAPI = {
  getAll: (params) => api.get('/leads', { params }),
  getMyCalls: () => api.get('/leads/my-calls'),
  getStats: () => api.get('/leads/stats'),
  getOne: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  logCall: (id, data) => api.post(`/leads/${id}/call`, data),
  addNote: (id, data) => api.post(`/leads/${id}/note`, data),
  updateStatus: (id, data) => api.put(`/leads/${id}/status`, data),
  exportCSV: (params) => api.get('/leads/export', { params, responseType: 'blob' }),
  // Send push notification to caller's mobile app
  initiateCall: (leadId, callerId) => api.post(`/leads/${leadId}/initiate-call`, { callerId }),
};

export const followupsAPI = {
  getAll: (params) => api.get('/followups', { params }),
  create: (data) => api.post('/followups', data),
  update: (id, data) => api.put(`/followups/${id}`, data),
  delete: (id) => api.delete(`/followups/${id}`),
  import: (formData) => api.post('/followups/import', formData),
};

export const campaignsAPI = {
  getAll: () => api.get('/campaigns'),
  getOne: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
};

export const reportsAPI = {
  leaderboard: (params) => api.get('/reports/leaderboard', { params }),
  getLeaderboard: (params) => api.get('/reports/leaderboard', { params }),
  callsSummary: () => api.get('/reports/calls-summary'),
  callsList: () => api.get('/reports/calls-list'),
  adminAnalysis: () => api.get('/reports/admin-analysis'),
  getAdminAnalysis: () => api.get('/reports/admin-analysis'),
  userAnalysis: (userId) => api.get(`/reports/user-analysis/${userId}`),
  getUserAnalysis: (userId) => api.get(`/reports/user-analysis/${userId}`),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getLeaderboard: (params) => api.get('/reports/leaderboard', { params }),
  saveFcmToken: (token) => api.post('/users/fcm-token', { fcmToken: token }),
};

export const coursesAPI = {
  getAll: () => api.get('/courses'),
  getOne: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

export const blocklistAPI = {
  getAll: (params) => api.get('/blocklist', { params }),
  add: (data) => api.post('/blocklist', data),
  remove: (id) => api.delete(`/blocklist/${id}`),
  check: (phone) => api.get(`/blocklist/check/${phone}`),
};

export const messageTemplatesAPI = {
  getAll: (params) => api.get('/message-templates', { params }),
  create: (data) => api.post('/message-templates', data),
  update: (id, data) => api.put(`/message-templates/${id}`, data),
  delete: (id) => api.delete(`/message-templates/${id}`),
};

export default api;