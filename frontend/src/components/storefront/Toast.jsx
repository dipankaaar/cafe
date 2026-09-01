import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#181818] text-white px-5 py-3.5 rounded-full shadow-2xl border border-[#DD5903]/40 animate-bounce">
      <CheckCircle2 className="w-5 h-5 text-[#DD5903] flex-shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="p-1 text-gray-400 hover:text-white rounded-full transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
