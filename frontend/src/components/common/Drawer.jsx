import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md', // sm, md, lg, xl
  footer
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
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen ${sizeClasses[size] || sizeClasses.md} bg-white dark:bg-[#181818] border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col justify-between`}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
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
          <div className="p-6 overflow-y-auto flex-1">{children}</div>

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
