'use client';

import React, { useState, useEffect, useRef } from 'react';
import { soundFx } from '@/utils/audioFx';

interface FlipCardProps {
  value: number;
  label: string;
  subtitle?: string;
  variant?: 'forsil-blue' | 'arc-cyan' | 'forsil-gold';
}

export const FlipCard: React.FC<FlipCardProps> = ({
  value,
  label,
  subtitle,
  variant = 'forsil-blue',
}) => {
  // Format 2 digit dengan leading zero
  const formattedValue = String(value).padStart(2, '0');
  
  const [currentVal, setCurrentVal] = useState(formattedValue);
  const [previousVal, setPreviousVal] = useState(formattedValue);
  const [isFlipping, setIsFlipping] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (formattedValue !== currentVal) {
      setPreviousVal(currentVal);
      setIsFlipping(true);

      // Suara flip tick halus
      soundFx.playFlipTick();

      const timer = setTimeout(() => {
        setCurrentVal(formattedValue);
        setIsFlipping(false);
      }, 550);

      return () => clearTimeout(timer);
    }
  }, [formattedValue, currentVal]);

  // Skema warna kartu bernuansa Forsil99 & Arc Reactor
  const cardThemes = {
    'forsil-blue': {
      bgTop: 'bg-gradient-to-b from-[#254B8C] to-[#1E3E75]',
      bgBottom: 'bg-gradient-to-b from-[#193361] to-[#13274A]',
      border: 'border-[#3D6EB8]/40 shadow-[0_10px_25px_-5px_rgba(25,51,97,0.6)]',
      glow: 'after:shadow-[0_0_15px_rgba(66,103,178,0.4)]',
      notchBg: 'bg-[#090E1A]',
      textColor: 'text-white',
      accentLabel: 'text-sky-300/80',
    },
    'arc-cyan': {
      bgTop: 'bg-gradient-to-b from-[#0F766E] to-[#115E59]',
      bgBottom: 'bg-gradient-to-b from-[#134E4A] to-[#042F2E]',
      border: 'border-[#14B8A6]/40 shadow-[0_10px_25px_-5px_rgba(15,118,110,0.5)]',
      glow: 'after:shadow-[0_0_15px_rgba(20,184,166,0.4)]',
      notchBg: 'bg-[#050B14]',
      textColor: 'text-white',
      accentLabel: 'text-teal-300/80',
    },
    'forsil-gold': {
      bgTop: 'bg-gradient-to-b from-[#845E16] to-[#6A4B10]',
      bgBottom: 'bg-gradient-to-b from-[#553C0C] to-[#3B2907]',
      border: 'border-[#F59E0B]/40 shadow-[0_10px_25px_-5px_rgba(180,130,20,0.5)]',
      glow: 'after:shadow-[0_0_15px_rgba(245,158,11,0.4)]',
      notchBg: 'bg-[#0A0D15]',
      textColor: 'text-amber-50',
      accentLabel: 'text-amber-300/80',
    },
  };

  const currentTheme = cardThemes[variant] || cardThemes['forsil-blue'];

  return (
    <div className="flex flex-col items-center">
      {/* Kartu Split-Flap 3D */}
      <div
        className={`flip-card-3d w-20 h-24 sm:w-28 sm:h-36 md:w-36 md:h-44 lg:w-40 lg:h-48 rounded-2xl sm:rounded-3xl border ${currentTheme.border} select-none relative shadow-2xl`}
      >
        {/* ================= STATIC HALVES ================= */}
        {/* Top Half Static (Menampilkan nilai baru yang masuk) */}
        <div
          className={`flip-half flip-half-top rounded-t-2xl sm:rounded-t-3xl ${currentTheme.bgTop} border-b border-black/50`}
        >
          <span
            className={`flip-digit-top ${currentTheme.textColor} font-bebas text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight`}
          >
            {formattedValue}
          </span>
        </div>

        {/* Bottom Half Static (Menampilkan nilai sebelumnya saat mulai, atau nilai sekarang) */}
        <div
          className={`flip-half flip-half-bottom rounded-b-2xl sm:rounded-b-3xl ${currentTheme.bgBottom} border-t border-white/5`}
        >
          <span
            className={`flip-digit-bottom ${currentTheme.textColor} font-bebas text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight`}
          >
            {isFlipping ? previousVal : currentVal}
          </span>
        </div>

        {/* ================= FLIPPING HALVES (3D) ================= */}
        {isFlipping && (
          <>
            {/* Top Half Flipping Down (Melipat ke bawah dengan nilai lama) */}
            <div
              className={`flip-half flip-half-top rounded-t-2xl sm:rounded-t-3xl ${currentTheme.bgTop} border-b border-black/50 animate-flip-top z-20`}
            >
              <span
                className={`flip-digit-top ${currentTheme.textColor} font-bebas text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight`}
              >
                {previousVal}
              </span>
              {/* Bayangan halus saat melipat */}
              <div className="absolute inset-0 bg-black/25 pointer-events-none" />
            </div>

            {/* Bottom Half Flipping Down (Membuka ke bawah dengan nilai baru) */}
            <div
              className={`flip-half flip-half-bottom rounded-b-2xl sm:rounded-b-3xl ${currentTheme.bgBottom} border-t border-white/5 animate-flip-bottom z-30`}
            >
              <span
                className={`flip-digit-bottom ${currentTheme.textColor} font-bebas text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight`}
              >
                {formattedValue}
              </span>
            </div>
          </>
        )}

        {/* ================= CENTER SLIT & NOTCHES (Persis gambar acuan) ================= */}
        {/* Garis celah horizontal di tengah */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2.5px] bg-black/85 z-40 shadow-[0_1px_1px_rgba(255,255,255,0.08)] pointer-events-none" />

        {/* Lekukan/Notch engsel samping kiri */}
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-3.5 sm:w-2.5 sm:h-4.5 rounded-r-md ${currentTheme.notchBg} z-40 border-r border-t border-b border-black/40 shadow-inner pointer-events-none`}
        />

        {/* Lekukan/Notch engsel samping kanan */}
        <div
          className={`absolute right-0 top-1/2 -translate-y-1/2 w-2 h-3.5 sm:w-2.5 sm:h-4.5 rounded-l-md ${currentTheme.notchBg} z-40 border-l border-t border-b border-black/40 shadow-inner pointer-events-none`}
        />

        {/* Highlight kilau futuristik di bagian atas */}
        <div className="absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b from-white/10 to-transparent rounded-t-2xl sm:rounded-t-3xl pointer-events-none" />
      </div>

      {/* Label Kategori (DAYS, HOURS, MINUTES, SECONDS) */}
      <div className="mt-3 text-center">
        <span
          className={`block font-rajdhani font-bold text-xs sm:text-sm md:text-base tracking-[0.25em] sm:tracking-[0.3em] uppercase ${currentTheme.accentLabel}`}
        >
          {label}
        </span>
        {subtitle && (
          <span className="text-[10px] text-slate-400 font-medium tracking-wide">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
