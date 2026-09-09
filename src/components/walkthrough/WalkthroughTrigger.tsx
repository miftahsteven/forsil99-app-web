'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, BookOpen, Compass, X } from 'lucide-react';
import { LiveWalkthrough } from './LiveWalkthrough';
import { UserManualModal } from './UserManualModal';
import { WalkthroughConfig } from '@/types/walkthrough';

interface WalkthroughTriggerProps {
  config: WalkthroughConfig;
  position?: 'top-right' | 'bottom-right' | 'inline';
  className?: string;
  label?: string;
}

export function WalkthroughTrigger({
  config,
  position = 'top-right',
  className = '',
  label = 'Panduan',
}: WalkthroughTriggerProps) {
  // Enabled via environment variable NEXT_PUBLIC_ENABLE_GUIDE (default: true)
  const isGuideEnabled = process.env.NEXT_PUBLIC_ENABLE_GUIDE !== 'false';

  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-trigger on first visit if guide is enabled
  useEffect(() => {
    if (!isGuideEnabled || typeof window === 'undefined') return;
    const storageKey = `ruang59_tour_${config.pageKey}_seen`;
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [config.pageKey, isGuideEnabled]);

  // Click outside listener for menu popover
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  if (!isGuideEnabled) return null;

  // Fluid responsive positioning classes:
  // - top-right: mobile top-4 right-4 | desktop: docked to the auth container edge
  // - bottom-right: mobile bottom-20 right-4 | desktop: docked 1.25rem inside the 42rem app container
  const positionClasses = {
    'top-right':
      'fixed top-4 right-4 sm:top-5 sm:right-6 md:right-[max(1.25rem,calc((100vw-28rem)/2+1.25rem))] z-40',
    'bottom-right':
      'fixed bottom-20 md:bottom-24 right-4 md:right-[max(1.25rem,calc((100vw-42rem)/2+1.25rem))] z-40',
    'inline': 'relative inline-block',
  }[position];

  return (
    <>
      <div className={`${positionClasses} ${className}`} ref={menuRef}>
        {/* Dynamic Action Popover Menu */}
        {isMenuOpen && (
          <div
            className={`absolute z-50 w-72 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-slate-200/90 transition-all duration-200 animate-in fade-in zoom-in-95 ${
              position === 'bottom-right'
                ? 'bottom-full mb-3 right-0 origin-bottom-right'
                : 'top-full mt-2.5 right-0 origin-top-right'
            }`}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles size={14} className="text-amber-500" />
                <span>Pusat Panduan Forsil99</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Tutup"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-1.5">
              {/* Option 1: Live Interactive Spotlight Tour */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsTourOpen(true);
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50/80 transition-all group flex items-start gap-2.5 active:scale-[0.98]"
              >
                <div className="p-2 rounded-lg bg-blue-100/80 text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors flex-shrink-0">
                  <Compass size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-brand-primary transition-colors leading-tight">
                    Tur Interaktif Layar
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Sorotan langsung tombol & fungsi fitur di layar secara visual.
                  </p>
                </div>
              </button>

              {/* Option 2: Full User Manual Modal */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsManualOpen(true);
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-amber-50/80 transition-all group flex items-start gap-2.5 active:scale-[0.98]"
              >
                <div className="p-2 rounded-lg bg-amber-100/80 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors flex-shrink-0">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-amber-700 transition-colors leading-tight">
                    Buku Manual & FAQ
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Dokumentasi lengkap alur registrasi, fitur, dan privasi.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Fluid Trigger Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="group flex items-center gap-2 pl-3 pr-3.5 py-2 bg-white/95 hover:bg-white text-slate-800 hover:text-brand-primary rounded-full shadow-md hover:shadow-xl border border-slate-200/90 backdrop-blur-md transition-all duration-300 active:scale-95 ring-1 ring-slate-900/5 hover:ring-brand-primary/20"
          title="Buka panduan halaman dan buku manual"
        >
          {/* Animated Glowing Pulse Dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>

          <Sparkles
            size={14}
            className="text-amber-500 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 flex-shrink-0"
          />

          <span className="text-xs font-bold tracking-tight text-slate-700 group-hover:text-brand-primary transition-colors">
            {label}
          </span>
        </button>
      </div>

      {/* 1. Live Interactive Spotlight Walkthrough */}
      <LiveWalkthrough
        config={config}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onOpenManual={() => setIsManualOpen(true)}
      />

      {/* 2. Comprehensive User Manual Modal */}
      <UserManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        onStartTour={() => {
          setIsManualOpen(false);
          setIsTourOpen(true);
        }}
        currentPageKey={config.pageKey as 'register' | 'login' | 'home'}
      />
    </>
  );
}
