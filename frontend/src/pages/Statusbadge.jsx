const statusConfig = {
  'Fresh': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Connected': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'Call Not Responding': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  'Call Back Later': { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'Not interested': { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  'Demo Scheduled': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'Demo Done': { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
  'Won': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Lost': { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  'Blocked': { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium ${config.bg} ${config.text} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {status}
    </span>
  );
}

export { statusConfig };