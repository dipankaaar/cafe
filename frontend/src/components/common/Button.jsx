import React from 'react';

export default function Button({
  children,
  variant = 'primary', // primary, secondary, outline, danger, ghost, success
  size = 'md', // sm, md, lg
  className = '',
  disabled = false,
  icon: Icon,
  onClick,
  type = 'button',
  fullWidth = false,
  title
}) {
  const variantStyles = {
    primary: 'bg-[#DD5903] hover:bg-[#b84700] text-white shadow-sm hover:shadow-md hover:shadow-orange-950/20 active:translate-y-0.5',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700',
    outline: 'bg-transparent border border-gray-300 dark:border-gray-700 hover:border-[#DD5903] text-gray-700 dark:text-gray-200 hover:text-[#DD5903]',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-rose-900/20',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-md gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-lg gap-2',
    lg: 'text-base px-6 py-3 rounded-lg gap-2.5'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
      {children}
    </button>
  );
}
