import React from 'react';
import Image from 'next/image';

interface AppAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  hasStory?: boolean;
  isOnline?: boolean;
}

export function AppAvatar({
  src,
  name = 'Alumni',
  size = 'md',
  className = '',
  hasStory = false,
  isOnline = false,
}: AppAvatarProps) {
  const initials = (name || 'A')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl font-bold',
  };

  const imageDimensions = {
    xs: 28,
    sm: 36,
    md: 44,
    lg: 64,
    xl: 96,
  };

  const ringClass = hasStory
    ? 'p-0.5 bg-gradient-to-tr from-brand-gold to-brand-primary rounded-full'
    : '';

  return (
    <div className={`relative inline-block flex-shrink-0 ${ringClass} ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-brand-primaryLight to-brand-primary text-white font-semibold shadow-inner border border-white/80`}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // fallback to initials on broken image
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {isOnline && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
      )}
    </div>
  );
}
