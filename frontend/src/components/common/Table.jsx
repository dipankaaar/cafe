import React from 'react';

/**
 * Premium admin Table primitive — consistent with Card / Button / Badge.
 * Accessible: real <table>, caption support, sticky header option.
 */
export default function Table({
  columns = [],
  data = [],
  keyField = 'id',
  caption,
  stickyHeader = false,
  dense = false,
  className = '',
  emptyMessage = 'No records found.'
}) {
  const cellPad = dense ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#181818] ${className}`}>
      <table className="w-full text-left text-sm border-collapse min-w-[560px]">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className={`bg-gray-50 dark:bg-[#141414] border-b border-gray-200 dark:border-gray-800 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`${cellPad} text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap ${col.headerClassName || ''}`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/70">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length || 1} className={`${cellPad} text-center text-xs text-gray-500 dark:text-gray-400 py-8`}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, ri) => (
              <tr key={row[keyField] ?? ri} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`${cellPad} text-gray-700 dark:text-gray-200 ${col.cellClassName || ''}`}>
                    {col.render ? col.render(row[col.key], row, ri) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
