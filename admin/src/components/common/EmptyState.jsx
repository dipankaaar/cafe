import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title = 'No records found',
  description = 'Try adjusting your search filters or add a new record.',
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800/80 text-gray-400 dark:text-gray-500 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
        {title}
      </h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
