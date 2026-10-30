import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-sm font-medium',
  };

  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    primary: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
    blue: 'bg-sky-50 text-sky-700 border border-sky-200',
  };

  // Helper map for status/priority strings
  const getVariantForValue = (val) => {
    if (!val || typeof val !== 'string') return variant;
    const lower = val.toLowerCase();
    if (['completed', 'approved', 'active', 'success'].includes(lower)) return 'success';
    if (['in_progress', 'under_review', 'medium'].includes(lower)) return 'blue';
    if (['on_hold', 'info_requested', 'high', 'warning'].includes(lower)) return 'warning';
    if (['rejected', 'critical', 'failed', 'blocked', 'cancelled'].includes(lower)) return 'danger';
    if (['draft', 'to_do', 'low', 'pending'].includes(lower)) return 'default';
    return variant;
  };

  const finalVariant = variantClasses[getVariantForValue(children)] || variantClasses[variant] || variantClasses.default;

  return (
    <span
      className={`inline-flex items-center rounded-full capitalize ${sizeClasses[size] || sizeClasses.sm} ${finalVariant} ${className}`}
    >
      {typeof children === 'string' ? children.replace(/_/g, ' ') : children}
    </span>
  );
};

export default Badge;

