import React from 'react';
import { Loader2 } from 'lucide-react';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'gold' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function AppButton({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: AppButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none disabled:opacity-50 disabled:pointer-events-none select-none';

  const variantStyles = {
    primary:
      'bg-brand-primary hover:bg-brand-primaryDark text-white shadow-sm hover:shadow-glow',
    gold:
      'bg-gradient-to-r from-brand-gold to-brand-goldLight text-white font-semibold shadow-sm hover:shadow-goldGlow',
    secondary:
      'bg-brand-surfaceBlue text-brand-primary hover:bg-blue-100 font-medium',
    outline:
      'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
    ghost:
      'text-slate-600 hover:bg-slate-100/70',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
}
