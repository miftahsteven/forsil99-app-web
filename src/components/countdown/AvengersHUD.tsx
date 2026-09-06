'use client';

import React from 'react';

export const AvengersHUD: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* 1. Deep Space Radial Vignette & Cyber Grid */}
      <div className="absolute inset-0 bg-[#050814]" />
      <div className="absolute inset-0 bg-radial-vignette opacity-90" />
      <div className="absolute inset-0 bg-cyber-grid opacity-30" />

      {/* 2. Arc Reactor Hologram Rings (Tengah) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[580px] sm:h-[580px] md:w-[720px] md:h-[720px] rounded-full pointer-events-none opacity-25 sm:opacity-35">
        {/* Ring Luar */}
        <div className="absolute inset-0 rounded-full border border-sky-400/30 animate-rotate-cw" />
        
        {/* Ring Bergaris Putus-putus (Dashed) */}
        <div className="absolute inset-4 sm:inset-8 rounded-full border-2 border-dashed border-sky-400/40 animate-rotate-ccw" />
        
        {/* Ring Segmen Stark Tech */}
        <div className="absolute inset-12 sm:inset-20 rounded-full border border-teal-300/30 animate-rotate-cw" />
        
        {/* Glowing Center Core */}
        <div className="absolute inset-24 sm:inset-36 rounded-full bg-gradient-to-br from-sky-500/10 via-cyan-400/5 to-transparent blur-xl animate-hud-pulse" />
        
        {/* Crosshair S.H.I.E.L.D. / Avengers HUD */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-sky-400/20 to-transparent -translate-x-1/2" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/20 to-transparent -translate-y-1/2" />
      </div>

      {/* 3. High-Tech Corner Reticles [ ] (Avengers / Iron Man HUD) */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-l-2 border-sky-400/60" />
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-8 h-8 sm:w-12 sm:h-12 border-t-2 border-r-2 border-sky-400/60" />
      <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-l-2 border-sky-400/60" />
      <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 w-8 h-8 sm:w-12 sm:h-12 border-b-2 border-r-2 border-sky-400/60" />

      {/* 4. Scanning Lines / Scanline bergerak perlahan */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-400/10 via-sky-400/5 to-transparent opacity-40 animate-scanline" />

      {/* 5. Watermark Avengers / Forsil HUD Data */}
      <div className="hidden md:flex absolute top-10 left-16 flex-col gap-1 text-[11px] font-rajdhani text-sky-400/50 uppercase tracking-widest">
        <span>SYS.LOC // JAKARTA, ID 59</span>
        <span>SECURITY LEVEL: OMEGA</span>
        <span>PROTOCOL: ASSEMBLE_1999</span>
      </div>

      <div className="hidden md:flex absolute top-10 right-16 flex-col items-end gap-1 text-[11px] font-rajdhani text-sky-400/50 uppercase tracking-widest">
        <span>ENCRYPTION: QUANTUM_256</span>
        <span>PORTAL STATUS: STANDBY</span>
        <span>T-MINUS: ENGAGED</span>
      </div>

      {/* 6. Subtle Gold/Cyan Nebula Glow Corners */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
    </div>
  );
};
