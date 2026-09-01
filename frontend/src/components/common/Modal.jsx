import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md', // sm, md, lg, xl, full
  footer,
  className = ''
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="min-h-full p-4 flex items-center justify-center relative z-10">
        <div
          className={`w-full ${sizeClasses[size] || sizeClasses.md} bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 animate-fadeIn ${className}`}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto max-h-[75vh]">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-[#141414] border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
