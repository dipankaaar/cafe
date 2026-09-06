import React from 'react';

/**
 * Premium Tabs primitive — pill style, keyboard accessible (arrow keys),
 * consistent with Button / Badge tokens.
 */
export default function Tabs({
  tabs = [],
  activeKey,
  onChange,
  variant = 'pill', // pill | underline
  className = '',
  ariaLabel = 'Tabs'
}) {
  const handleKeyDown = (e, index) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = (index + dir + tabs.length) % tabs.length;
    onChange?.(tabs[next].key);
    document.getElementById(`tab-${tabs[next].key}`)?.focus();
  };

  if (variant === 'underline') {
    return (
      <div role="tablist" aria-label={ariaLabel} className={`flex items-center gap-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar ${className}`}>
        {tabs.map((t) => {
          const active = t.key === activeKey;
          return (
            <button
              key={t.key}
              id={`tab-${t.key}`}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange?.(t.key)}
              onKeyDown={(e) => handleKeyDown(e, tabs.indexOf(t))}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer ${
                active
                  ? 'border-[#DD5903] text-[#DD5903]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.badge != null ? (
                <span className="inline-flex items-center gap-1.5">
                  {t.label}
                  <span className="px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px]">{t.badge}</span>
                </span>
              ) : (
                t.label
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="tablist" aria-label={ariaLabel} className={`flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar ${className}`}>
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <button
            key={t.key}
            id={`tab-${t.key}`}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange?.(t.key)}
            onKeyDown={(e) => handleKeyDown(e, tabs.indexOf(t))}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              active
                ? 'bg-[#DD5903] text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {t.badge != null ? `${t.label} (${t.badge})` : t.label}
          </button>
        );
      })}
    </div>
  );
}
