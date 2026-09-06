'use client';

import React, { useState, useEffect } from 'react';
import { FlipCard } from './FlipCard';
import { RemainingTime, getRemainingTime, RELEASE_CONFIG } from '@/config/releaseConfig';

interface FlipCountdownProps {
  targetDate?: string;
  variant?: 'forsil-blue' | 'arc-cyan' | 'forsil-gold';
  onComplete?: () => void;
}

export const FlipCountdown: React.FC<FlipCountdownProps> = ({
  targetDate = RELEASE_CONFIG.targetDate,
  variant = 'forsil-blue',
  onComplete,
}) => {
  const [time, setTime] = useState<RemainingTime>(() => getRemainingTime(targetDate));
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    // Initial sync
    const initial = getRemainingTime(targetDate);
    setTime(initial);

    if (initial.isCompleted && !hasCompleted) {
      setHasCompleted(true);
      if (onComplete) onComplete();
      return;
    }

    const interval = setInterval(() => {
      const remaining = getRemainingTime(targetDate);
      setTime(remaining);

      if (remaining.isCompleted) {
        clearInterval(interval);
        if (!hasCompleted) {
          setHasCompleted(true);
          if (onComplete) onComplete();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, hasCompleted, onComplete]);

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
      {/* Header Countdown (TIME REMAINING) */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-950/70 border border-sky-500/30 text-sky-400 text-xs sm:text-sm font-rajdhani font-bold tracking-[0.25em] uppercase shadow-[0_0_15px_rgba(56,189,248,0.2)]">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span>TIME REMAINING // WAKTU TERSISA</span>
        </div>
      </div>

      {/* Grid 4 Kartu Split-Flap */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-4 md:gap-6 lg:gap-8">
        <FlipCard
          value={time.days}
          label="DAYS"
          subtitle="HARI"
          variant={variant}
        />
        <FlipCard
          value={time.hours}
          label="HOURS"
          subtitle="JAM"
          variant={variant}
        />
        <FlipCard
          value={time.minutes}
          label="MINUTES"
          subtitle="MENIT"
          variant={variant}
        />
        <FlipCard
          value={time.seconds}
          label="SECONDS"
          subtitle="DETIK"
          variant={variant}
        />
      </div>
    </div>
  );
};
