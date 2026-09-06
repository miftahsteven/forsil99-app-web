'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  type: 'confetti' | 'ribbon' | 'spark';
  rotation: number;
  rotationSpeed: number;
  tilt: number;
  tiltAngle: number;
  tiltAngleSpeed: number;
  opacity: number;
  decay: number;
}

interface FireworkBurst {
  x: number;
  y: number;
  color: string;
  particles: Particle[];
}

export const CelebrationFx: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showTrumpets, setShowTrumpets] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Palet warna perayaan Forsil99: Emas, Biru Elektrik, Cyan, Ruby, Emerald, Putih
    const colors = [
      '#F59E0B', '#FCD34D', '#3B82F6', '#60A5FA',
      '#06B6D4', '#38BDF8', '#10B981', '#EC4899', '#FFFFFF'
    ];

    const particles: Particle[] = [];
    const fireworks: FireworkBurst[] = [];

    // 1. Tembakkan kembang api di awal (3 titik: kiri atas, tengah, kanan atas)
    const createFirework = (cx: number, cy: number, color: string) => {
      const burstParticles: Particle[] = [];
      const count = 45;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.2;
        const speed = Math.random() * 5 + 3;
        burstParticles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: Math.random() * 3.5 + 1.5,
          type: 'spark',
          rotation: 0,
          rotationSpeed: 0,
          tilt: 0,
          tiltAngle: 0,
          tiltAngleSpeed: 0,
          opacity: 1,
          decay: Math.random() * 0.015 + 0.012,
        });
      }
      fireworks.push({ x: cx, y: cy, color, particles: burstParticles });
    };

    // Trigger ledakan kembang api
    setTimeout(() => createFirework(width * 0.25, height * 0.28, '#F59E0B'), 100);
    setTimeout(() => createFirework(width * 0.75, height * 0.25, '#38BDF8'), 350);
    setTimeout(() => createFirework(width * 0.5, height * 0.18, '#EC4899'), 650);
    setTimeout(() => createFirework(width * 0.35, height * 0.22, '#10B981'), 1000);
    setTimeout(() => createFirework(width * 0.65, height * 0.20, '#FCD34D'), 1300);

    // 2. Tembakkan pita & confetti dari meriam kiri dan kanan bawah
    const spawnConfettiBurst = (originX: number, angleOffset: number) => {
      const amount = 85;
      for (let i = 0; i < amount; i++) {
        const angle = angleOffset + (Math.random() - 0.5) * 0.8;
        const speed = Math.random() * 14 + 10;
        const isRibbon = Math.random() > 0.65;
        particles.push({
          x: originX,
          y: height * 0.85,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: isRibbon ? Math.random() * 18 + 12 : Math.random() * 8 + 6,
          type: isRibbon ? 'ribbon' : 'confetti',
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 8,
          tilt: Math.random() * 10,
          tiltAngle: Math.random() * Math.PI,
          tiltAngleSpeed: Math.random() * 0.07 + 0.03,
          opacity: 1,
          decay: 0.003 + Math.random() * 0.003,
        });
      }
    };

    // Meriam confetti kiri (-Math.PI / 3) dan kanan (-Math.PI * 2 / 3)
    spawnConfettiBurst(width * 0.08, -Math.PI / 3.2);
    spawnConfettiBurst(width * 0.92, (-Math.PI * 2.2) / 3.2);

    setTimeout(() => {
      spawnConfettiBurst(width * 0.15, -Math.PI / 3.5);
      spawnConfettiBurst(width * 0.85, (-Math.PI * 2.1) / 3.5);
    }, 800);

    let startTime = Date.now();
    const duration = 6500; // Berhenti otomatis setelah 6.5 detik

    const render = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, width, height);

      // Render & Update Kembang Api
      fireworks.forEach((fw) => {
        fw.particles.forEach((p) => {
          if (p.opacity <= 0) return;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.06; // Gravitasi
          p.vx *= 0.97; // Drag
          p.opacity -= p.decay;

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.restore();
        });
      });

      // Render & Update Confetti & Pita
      particles.forEach((p) => {
        if (p.opacity <= 0) return;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // Gravitasi lembut
        p.vx *= 0.98; // Hambatan udara
        p.rotation += p.rotationSpeed;
        p.tiltAngle += p.tiltAngleSpeed;
        p.tilt = Math.sin(p.tiltAngle) * 12;

        if (elapsed > 4000) {
          p.opacity -= p.decay * 3;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);

        if (p.type === 'ribbon') {
          // Bentuk pita berputar memanjang
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.25, p.tilt * 0.1, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Bentuk kertas confetti persegi melambai
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * Math.cos(p.tiltAngle));
        }

        ctx.restore();
      });

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        // Selesai animasi: bersihkan canvas dan hentikan loop
        ctx.clearRect(0, 0, width, height);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    // Hilangkan terompet perlahan setelah 5 detik
    const trumpetTimer = setTimeout(() => {
      setShowTrumpets(false);
    }, 5500);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      clearTimeout(trumpetTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      {/* 1. Canvas Kembang Api, Confetti & Pita Berterbangan */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 2. Animasi Terompet / Party Horn di Sisi Kiri & Kanan (Muncul sekali lalu memudar) */}
      {showTrumpets && (
        <div className="absolute inset-x-0 top-12 sm:top-16 px-4 sm:px-12 flex justify-between items-center pointer-events-none animate-fade-in transition-opacity duration-1000">
          {/* Terompet Kiri (Meniup ke arah tengah) */}
          <div className="flex flex-col items-center animate-bounce-slow transform -rotate-12 scale-90 sm:scale-110">
            <div className="text-4xl sm:text-6xl drop-shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse">
              🎺
            </div>
            <span className="text-[11px] font-rajdhani font-bold text-amber-300 tracking-wider uppercase mt-1">
              ✨ SELAMAT!
            </span>
          </div>

          {/* Terompet & Party Popper Kanan (Meniup ke arah tengah) */}
          <div className="flex flex-col items-center animate-bounce-slow transform rotate-12 scale-90 sm:scale-110">
            <div className="text-4xl sm:text-6xl drop-shadow-[0_0_15px_rgba(56,189,248,0.6)] animate-pulse">
              🎉
            </div>
            <span className="text-[11px] font-rajdhani font-bold text-sky-300 tracking-wider uppercase mt-1">
              RESMI DIBUKA! ✨
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
