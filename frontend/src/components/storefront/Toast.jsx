import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const TYPE_STYLES = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-[#DD5903]',
    borderClass: 'border-[#DD5903]/40'
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-rose-400',
    borderClass: 'border-rose-500/40'
  },
  info: {
    icon: Info,
    iconClass: 'text-sky-400',
    borderClass: 'border-sky-500/40'
  }
};

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const style = TYPE_STYLES[type] || TYPE_STYLES.success;
  const Icon = style.icon;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 bg-[#181818] text-white px-5 py-3.5 rounded-full shadow-2xl border ${style.borderClass} animate-bounce max-w-[90vw]`}
    >
      <Icon className={`w-5 h-5 ${style.iconClass} flex-shrink-0`} />
      <span className="text-sm font-medium truncate">{message}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="p-1 text-gray-400 hover:text-white rounded-full transition-colors cursor-pointer flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
