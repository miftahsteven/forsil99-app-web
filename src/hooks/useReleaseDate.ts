'use client';

import { useState, useEffect, useCallback } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '@/services/firebaseConfig';
import { parseFlexibleDate, formatReleaseText } from '@/utils/dateParser';
import { RELEASE_CONFIG } from '@/config/releaseConfig';

export function useReleaseDate() {
  // Fallback awal dari .env atau default
  const defaultParsed = parseFlexibleDate(RELEASE_CONFIG.targetDate) || new Date('2026-09-09T19:09:00+07:00');

  const [targetDate, setTargetDate] = useState<Date>(defaultParsed);
  const [source, setSource] = useState<'rtdb' | 'env'>('env');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCountdownEnabled, setIsCountdownEnabled] = useState<boolean>(RELEASE_CONFIG.isCountdownEnabled);

  // 1. Sinkronisasi Realtime dengan Firebase Realtime Database (/releasedate)
  useEffect(() => {
    let isMounted = true;
    try {
      const releaseDateRef = ref(rtdb, 'releasedate');
      const enableCountdownRef = ref(rtdb, 'enablecountdown');

      const unsubscribeDate = onValue(
        releaseDateRef,
        (snapshot) => {
          if (!isMounted) return;
          const val = snapshot.val();
          if (val && typeof val === 'string') {
            const parsed = parseFlexibleDate(val);
            if (parsed) {
              setTargetDate(parsed);
              setSource('rtdb');
            }
          }
          setIsLoading(false);
        },
        (error) => {
          if (!isMounted) return;
          console.warn('Gagal membaca releasedate dari Firebase RTDB, menggunakan fallback:', error);
          setIsLoading(false);
        }
      );

      const unsubscribeEnable = onValue(
        enableCountdownRef,
        (snapshot) => {
          if (!isMounted) return;
          const val = snapshot.val();
          if (val !== null && val !== undefined) {
            setIsCountdownEnabled(val === true || val === 'true');
          }
        },
        () => {}
      );

      return () => {
        isMounted = false;
        unsubscribeDate();
        unsubscribeEnable();
      };
    } catch (err) {
      console.warn('Error saat menginisialisasi listener Firebase RTDB:', err);
      setIsLoading(false);
    }
  }, []);

  const isCurrentReleased = !isCountdownEnabled || (Date.now() >= targetDate.getTime());
  const formattedLabel = formatReleaseText(targetDate);

  const resetWelcomeCache = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('forsil99_welcome_seen');
      localStorage.removeItem('forsil99_welcome_seen_for');
    }
  }, []);

  return {
    targetDate,
    targetDateIso: targetDate.toISOString(),
    formattedLabel,
    isReleased: isCurrentReleased,
    isCountdownEnabled,
    isLoading,
    source,
    resetWelcomeCache,
  };
}
