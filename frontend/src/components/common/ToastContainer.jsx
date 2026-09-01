import React from 'react';
import { useCafe } from '../../context/CafeContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { notifications, markNotificationAsRead } = useCafe();

  // Show only recent unread notifications as floating toasts
  const activeToasts = notifications.filter((n) => !n.isRead).slice(0, 3);

  if (activeToasts.length === 0) return null;

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    order: <CheckCircle2 className="w-5 h-5 text-[#DD5903] flex-shrink-0" />,
    reservation: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {activeToasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl p-4 flex items-start gap-3 animate-slideUp transition-all"
        >
          {iconMap[toast.type] || iconMap.info}
          <div className="flex-1 min-w-0">
            <h5 className="text-sm font-bold text-gray-900 dark:text-white">
              {toast.title}
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => markNotificationAsRead(toast.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
