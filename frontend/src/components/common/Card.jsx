import React from 'react';

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerClassName = '',
  bodyClassName = '',
  footer,
  footerClassName = '',
  onClick
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#181818] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xs transition-all duration-200 ${className}`}
    >
      {(title || action) && (
        <div
          className={`px-5 py-4 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between gap-4 ${headerClassName}`}
        >
          <div>
            {title && (
              <h3 className="text-base font-semibold text-gray-900 dark:text-white font-['Plus_Jakarta_Sans',sans-serif]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div
          className={`px-5 py-3 bg-gray-50 dark:bg-[#141414] border-t border-gray-100 dark:border-gray-800/80 rounded-b-xl ${footerClassName}`}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
