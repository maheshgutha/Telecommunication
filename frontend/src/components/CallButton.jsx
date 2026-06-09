// frontend/src/components/CallButton.jsx
// Add this component to LeadProfile.jsx and any lead detail page
// It sends a push notification to the assigned caller's mobile phone

import React, { useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aotms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function CallButton({ lead, callers = [], onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedCaller, setSelectedCaller] = useState(lead?.assignedTo?._id || '');

  const handleInitiateCall = async () => {
    if (!lead?._id) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post(`/leads/${lead._id}/initiate-call`, {
        callerId: selectedCaller || undefined,
      });
      setResult({ success: true, message: res.data.message });
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send call notification';
      setResult({ success: false, message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Initiate Call Button */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
        title="Send call notification to caller's mobile app"
      >
        <span>📲</span>
        <span>Initiate Call</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">📲 Initiate Call</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Send notification to caller's mobile app
                  </p>
                </div>
                <button
                  onClick={() => { setShowModal(false); setResult(null); }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Lead Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">Lead</p>
                <p className="font-bold text-gray-800 text-lg">{lead?.name}</p>
                <p className="text-gray-600 font-mono">{lead?.phone}</p>
              </div>

              {/* Caller Selection */}
              {callers.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign to Caller
                  </label>
                  <select
                    value={selectedCaller}
                    onChange={(e) => setSelectedCaller(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    <option value="">-- Assigned Caller ({lead?.assignedTo?.name || 'None'}) --</option>
                    {callers.filter(c => c.role === 'caller').map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-blue-700 text-sm">
                  💡 This will send a push notification to the caller's mobile app.
                  They will see the lead's name and phone number and can tap to call.
                </p>
              </div>

              {/* Result */}
              {result && (
                <div className={`rounded-xl p-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => { setShowModal(false); setResult(null); }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleInitiateCall}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                ) : (
                  <><span>📲</span> Send Notification</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}