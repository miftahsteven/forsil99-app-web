'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crop,
  Sparkles,
  Loader2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Move,
  Maximize2,
} from 'lucide-react';

interface CoverCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  aspectRatio?: number; // width / height, default 2.5 (rasio cover profil)
  title?: string;
}

export function CoverCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 2.5, // 2.5 : 1 sesuai rasio cover profil
  title = 'Sesuaikan Area Potong Cover Profil',
}: CoverCropModalProps) {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [boxDimensions, setBoxDimensions] = useState<{ width: number; height: number }>({ width: 480, height: 192 });
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Synchronized refs to avoid closure lag during dragging
  const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const zoomRef = useRef<number>(1);
  const naturalSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const boxDimensionsRef = useRef<{ width: number; height: number }>({ width: 480, height: 192 });

  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    posX: number;
    posY: number;
    zoomVal: number;
  }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
    zoomVal: 1,
  });

  // Keep refs in sync with state
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    naturalSizeRef.current = naturalSize;
  }, [naturalSize]);

  useEffect(() => {
    boxDimensionsRef.current = boxDimensions;
  }, [boxDimensions]);

  // Calculate base display size of the image to cover the crop box
  const getMetrics = useCallback(
    (customZoom?: number) => {
      const nat = naturalSizeRef.current;
      const boxW = boxDimensionsRef.current.width || 480;
      const boxH = Math.round(boxW / aspectRatio);
      const currentZoom = customZoom ?? zoomRef.current;

      if (!nat.width || !nat.height) {
        return {
          boxW,
          boxH,
          baseImgW: boxW,
          baseImgH: boxH,
          displayW: boxW * currentZoom,
          displayH: boxH * currentZoom,
          isWider: true,
          canMoveX: false,
          canMoveY: false,
        };
      }

      const imgAspect = nat.width / nat.height;
      const isWider = imgAspect > aspectRatio;
      let baseImgW = boxW;
      let baseImgH = boxH;

      if (isWider) {
        // Image is wider than crop box -> fit height, width spills over
        baseImgH = boxH;
        baseImgW = Math.round(boxH * imgAspect);
      } else {
        // Image is taller than crop box (portrait/square/etc) -> fit width, height spills over
        baseImgW = boxW;
        baseImgH = Math.round(boxW / imgAspect);
      }

      const displayW = Math.round(baseImgW * currentZoom);
      const displayH = Math.round(baseImgH * currentZoom);

      const canMoveX = displayW > boxW;
      const canMoveY = displayH > boxH;

      return { boxW, boxH, baseImgW, baseImgH, displayW, displayH, isWider, canMoveX, canMoveY };
    },
    [aspectRatio]
  );

  // Clamp pan position so the image ALWAYS completely covers the crop box (no empty gaps)
  const clampPosition = useCallback(
    (newX: number, newY: number, customZoom?: number) => {
      const { boxW, boxH, displayW, displayH } = getMetrics(customZoom);

      // Clamping bounds for X: minimum is (boxW - displayW), maximum is 0
      const minX = Math.min(0, boxW - displayW);
      const maxX = 0;
      const clampedX = Math.min(maxX, Math.max(minX, Math.round(newX)));

      // Clamping bounds for Y: minimum is (boxH - displayH), maximum is 0
      const minY = Math.min(0, boxH - displayH);
      const maxY = 0;
      const clampedY = Math.min(maxY, Math.max(minY, Math.round(newY)));

      return { x: clampedX, y: clampedY };
    },
    [getMetrics]
  );

  // Compute centered position
  const getCenteredPosition = useCallback(
    (customZoom = 1) => {
      const { boxW, boxH, displayW, displayH } = getMetrics(customZoom);
      const centerX = Math.round((boxW - displayW) / 2);
      const centerY = Math.round((boxH - displayH) / 2);
      return clampPosition(centerX, centerY, customZoom);
    },
    [getMetrics, clampPosition]
  );

  // Direct helper to set position and instantly update DOM for zero-latency response
  const applyPosition = useCallback(
    (newPos: { x: number; y: number }) => {
      positionRef.current = newPos;
      setPosition(newPos);
      if (imageRef.current) {
        imageRef.current.style.transform = `translate3d(${newPos.x}px, ${newPos.y}px, 0)`;
      }
    },
    []
  );

  // Track container size with ResizeObserver
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const el = containerRef.current;
    const updateSize = () => {
      if (el) {
        const w = el.clientWidth;
        const h = Math.round(w / aspectRatio);
        if (w > 50 && h > 20) {
          boxDimensionsRef.current = { width: w, height: h };
          setBoxDimensions({ width: w, height: h });
        }
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);

    return () => observer.disconnect();
  }, [isOpen, aspectRatio]);

  // Load natural image dimensions and center the image initially
  useEffect(() => {
    if (!imageSrc || !isOpen) return;

    setIsLoading(true);
    setImageError(false);
    setZoom(1);
    zoomRef.current = 1;

    const img = new Image();
    img.onload = () => {
      const nat = { width: img.naturalWidth, height: img.naturalHeight };
      naturalSizeRef.current = nat;
      setNaturalSize(nat);

      // Measure current container if available
      if (containerRef.current && containerRef.current.clientWidth > 50) {
        const w = containerRef.current.clientWidth;
        const h = Math.round(w / aspectRatio);
        boxDimensionsRef.current = { width: w, height: h };
        setBoxDimensions({ width: w, height: h });
      }

      // Immediately center the image so the main subject is visible
      const initialPos = getCenteredPosition(1);
      applyPosition(initialPos);
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
      setImageError(true);
    };

    img.src = imageSrc;
  }, [imageSrc, isOpen, aspectRatio, getCenteredPosition, applyPosition]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Keyboard navigation: Arrow keys nudge position, Escape closes
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
        return;
      }

      // Nudge with arrow keys
      const step = e.shiftKey ? 40 : 15;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = clampPosition(positionRef.current.x, positionRef.current.y + step);
        applyPosition(next);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = clampPosition(positionRef.current.x, positionRef.current.y - step);
        applyPosition(next);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = clampPosition(positionRef.current.x + step, positionRef.current.y);
        applyPosition(next);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = clampPosition(positionRef.current.x - step, positionRef.current.y);
        applyPosition(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose, clampPosition, applyPosition]);

  // Pointer Down (Mouse or Touch) on Container - Captures pointer for instant response
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLoading || imageError) return;
    e.preventDefault();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: positionRef.current.x,
      posY: positionRef.current.y,
      zoomVal: zoomRef.current,
    };
  };

  // Pointer Move (Mouse or Touch) - Updates position with 0 latency
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    const targetX = dragStartRef.current.posX + deltaX;
    const targetY = dragStartRef.current.posY + deltaY;

    const clamped = clampPosition(targetX, targetY, dragStartRef.current.zoomVal);
    positionRef.current = clamped;

    // Instant direct DOM transform update
    if (imageRef.current) {
      imageRef.current.style.transform = `translate3d(${clamped.x}px, ${clamped.y}px, 0)`;
    }
  };

  // Pointer Up (Mouse or Touch)
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    setIsDragging(false);
    setPosition(positionRef.current);
  };

  // Handle Zoom change with center-anchoring
  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.min(3.0, Math.max(1.0, parseFloat(newZoom.toFixed(2))));
    const oldMetrics = getMetrics(zoomRef.current);
    const nextMetrics = getMetrics(clampedZoom);

    // Maintain focus on the center of the viewport
    const centerImgX = (oldMetrics.boxW / 2 - positionRef.current.x) / (oldMetrics.displayW || 1);
    const centerImgY = (oldMetrics.boxH / 2 - positionRef.current.y) / (oldMetrics.displayH || 1);

    const targetX = oldMetrics.boxW / 2 - centerImgX * nextMetrics.displayW;
    const targetY = oldMetrics.boxH / 2 - centerImgY * nextMetrics.displayH;

    zoomRef.current = clampedZoom;
    setZoom(clampedZoom);

    const nextPos = clampPosition(targetX, targetY, clampedZoom);
    applyPosition(nextPos);
  };

  // Wheel zoom support
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    handleZoomChange(zoomRef.current + zoomDelta);
  };

  // Reset position and zoom to center
  const handleReset = () => {
    zoomRef.current = 1;
    setZoom(1);
    const center = getCenteredPosition(1);
    applyPosition(center);
  };

  // Nudge movement in pixels (for buttons & keyboard)
  const handleNudge = (deltaX: number, deltaY: number) => {
    const nextPos = clampPosition(
      positionRef.current.x + deltaX,
      positionRef.current.y + deltaY,
      zoomRef.current
    );
    applyPosition(nextPos);
  };

  // Quick alignment presets
  const handleAlign = (type: 'top' | 'center' | 'bottom' | 'left' | 'right') => {
    const { boxW, boxH, displayW, displayH } = getMetrics();

    let targetX = positionRef.current.x;
    let targetY = positionRef.current.y;

    if (type === 'center') {
      targetX = Math.round((boxW - displayW) / 2);
      targetY = Math.round((boxH - displayH) / 2);
    } else if (type === 'top') {
      targetY = 0;
    } else if (type === 'bottom') {
      targetY = boxH - displayH;
    } else if (type === 'left') {
      targetX = 0;
    } else if (type === 'right') {
      targetX = boxW - displayW;
    }

    const nextPos = clampPosition(targetX, targetY, zoomRef.current);
    applyPosition(nextPos);
  };

  // Compute live output resolution
  const calculateOutputResolution = () => {
    if (!naturalSize.width || !naturalSize.height) return { w: 0, h: 0 };
    const { boxW, boxH, displayW, displayH } = getMetrics();

    const scaleX = naturalSize.width / (displayW || 1);
    const scaleY = naturalSize.height / (displayH || 1);

    const outputW = Math.round(boxW * scaleX);
    const outputH = Math.round(boxH * scaleY);
    return { w: outputW, h: outputH };
  };

  // Execute full-resolution canvas cropping (0 downscaling)
  const handleConfirmCrop = async () => {
    if (!imageSrc || !naturalSize.width || !naturalSize.height) return;

    setIsProcessing(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Gagal memuat gambar untuk dipotong'));
        img.src = imageSrc;
      });

      const { boxW, boxH, displayW, displayH } = getMetrics();

      // Pixel scale from viewport to native resolution
      const scaleX = naturalSize.width / displayW;
      const scaleY = naturalSize.height / displayH;

      const currentPos = positionRef.current;
      const sourceX = Math.max(0, -currentPos.x * scaleX);
      const sourceY = Math.max(0, -currentPos.y * scaleY);
      const sourceWidth = Math.min(naturalSize.width - sourceX, boxW * scaleX);
      const sourceHeight = Math.min(naturalSize.height - sourceY, boxH * scaleY);

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sourceWidth);
      canvas.height = Math.round(sourceHeight);

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Gagal menginisialisasi canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw exact cropped slice at 1:1 original resolution
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Export as high-quality JPEG (quality 0.95 retains full detail)
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      onCropComplete(croppedDataUrl);
      onClose();
    } catch (err) {
      console.error('Error cropping cover:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  const outputRes = calculateOutputResolution();
  const metrics = getMetrics();

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        if (!isProcessing) onClose();
      }}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Crop size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-slate-400">
                Geser & sesuaikan area fokus cover (Resolusi Asli Dipertahankan)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Batal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Crop Viewport Container */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col items-center justify-center bg-slate-950/70 overflow-hidden select-none">
          {/* Output Resolution Pill */}
          <div className="mb-2.5 flex items-center gap-2 px-3 py-1 bg-slate-800/90 border border-slate-700 rounded-full text-[11px] text-slate-300 shadow-sm">
            <Sparkles size={13} className="text-amber-400" />
            <span>
              Resolusi Hasil:{' '}
              <strong className="text-white font-semibold">
                {outputRes.w > 0 ? `${outputRes.w} × ${outputRes.h} px` : 'Menghitung...'}
              </strong>{' '}
              • Kualitas Tajam 100%
            </span>
          </div>

          {/* Interactive Crop Box Viewport */}
          <div
            ref={containerRef}
            style={{
              aspectRatio: `${aspectRatio} / 1`,
            }}
            className={`w-full max-w-lg relative overflow-hidden rounded-2xl border-2 border-dashed shadow-2xl bg-black touch-none select-none ${
              isDragging
                ? 'border-sky-300 cursor-grabbing ring-4 ring-sky-400/20'
                : 'border-sky-400 cursor-grab hover:border-sky-300'
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* Loading Indicator */}
            {isLoading && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 text-white gap-2">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                <span className="text-xs font-medium text-slate-300">Memuat gambar...</span>
              </div>
            )}

            {/* Error Indicator */}
            {imageError && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 text-rose-400 gap-2 p-4 text-center">
                <AlertCircle className="w-8 h-8" />
                <span className="text-xs font-medium">Gagal memuat gambar. Format file mungkin tidak didukung.</span>
              </div>
            )}

            {/* Draggable & Scalable Image */}
            {imageSrc && !imageError && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop Source"
                draggable={false}
                style={{
                  width: `${metrics.displayW}px`,
                  height: `${metrics.displayH}px`,
                  transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                }}
                className="absolute top-0 left-0 pointer-events-none select-none will-change-transform"
              />
            )}

            {/* Rule-of-Thirds Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="" />
            </div>

            {/* Visual Guide Corner Badge */}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-semibold text-white/90 border border-white/10 pointer-events-none z-10 flex items-center gap-1">
              <Move size={10} className="text-sky-400" />
              <span>Area Cover Profil (2.5 : 1)</span>
            </div>
          </div>

          {/* Interactive Navigation Toolbar: Directional Nudges & Quick Presets */}
          <div className="w-full max-w-lg mt-3 p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-sm">
            {/* Directional Nudge Buttons */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 text-[11px] font-medium mr-1">Geser:</span>
              <button
                type="button"
                onClick={() => handleNudge(0, 30)}
                disabled={!metrics.canMoveY}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white disabled:opacity-35 transition-colors cursor-pointer"
                title="Geser ke Atas (Menampilkan bagian atas foto)"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleNudge(0, -30)}
                disabled={!metrics.canMoveY}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white disabled:opacity-35 transition-colors cursor-pointer"
                title="Geser ke Bawah (Menampilkan bagian bawah foto)"
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleNudge(30, 0)}
                disabled={!metrics.canMoveX}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white disabled:opacity-35 transition-colors cursor-pointer"
                title="Geser ke Kiri (Menampilkan sisi kiri foto)"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleNudge(-30, 0)}
                disabled={!metrics.canMoveX}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white disabled:opacity-35 transition-colors cursor-pointer"
                title="Geser ke Kanan (Menampilkan sisi kanan foto)"
              >
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Quick Position Preset Buttons */}
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-500 text-[10px] hidden sm:inline">Pintas:</span>
              {!metrics.isWider ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleAlign('top')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer font-medium"
                    title="Fokus ke bagian atas"
                  >
                    Atas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAlign('center')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer font-medium"
                    title="Fokus ke tengah"
                  >
                    Tengah
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAlign('bottom')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer font-medium"
                    title="Fokus ke bagian bawah"
                  >
                    Bawah
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleAlign('left')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer font-medium"
                    title="Fokus ke sisi kiri"
                  >
                    Kiri
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAlign('center')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer font-medium"
                    title="Fokus ke tengah"
                  >
                    Tengah
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAlign('right')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer font-medium"
                    title="Fokus ke sisi kanan"
                  >
                    Kanan
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            💡 <strong>Tahan & geser</strong> gambar langsung di kotak, atau gunakan tombol panah / keyboard untuk mengatur fokus.
          </p>

          {/* Interactive Zoom Slider & Controls */}
          <div className="w-full max-w-md mt-2.5 p-3 bg-slate-900/95 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-lg">
            <button
              type="button"
              onClick={() => handleZoomChange(zoom - 0.15)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Perkecil Zoom"
            >
              <ZoomOut size={16} />
            </button>

            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="flex-1 accent-sky-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />

            <button
              type="button"
              onClick={() => handleZoomChange(zoom + 0.15)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Perbesar Zoom"
            >
              <ZoomIn size={16} />
            </button>

            <span className="text-xs text-slate-300 font-mono w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-l border-slate-800 pl-2 cursor-pointer flex items-center gap-1"
              title="Reset Zoom & Posisi ke Tengah"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-800 bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmCrop}
            disabled={isProcessing || isLoading || imageError}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-primary to-sky-500 hover:from-brand-primaryDark hover:to-sky-600 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Memproses Crop...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Gunakan Foto Cover</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
