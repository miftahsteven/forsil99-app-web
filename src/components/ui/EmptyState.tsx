import React from 'react';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-subtle my-4">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-brand-surfaceBlue flex items-center justify-center text-brand-primary mb-3">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <AppButton size="sm" variant="primary" onClick={onAction}>
          {actionText}
        </AppButton>
      )}
    </div>
  );
}
