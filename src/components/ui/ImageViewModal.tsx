'use client';

import React, { useEffect } from 'react';
import { X, ZoomIn, Download } from 'lucide-react';

interface ImageViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  src?: string | null;
  imageUrl?: string | null;
  alt?: string;
  altText?: string;
  title?: string;
  subtitle?: string;
}

export function ImageViewModal({
  isOpen,
  onClose,
  src,
  imageUrl,
  alt = 'Foto',
  altText,
  title,
  subtitle,
}: ImageViewModalProps) {
  const activeSrc = src || imageUrl;
  const activeAlt = altText || alt;
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 sm:p-6 bg-black/92 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="w-full max-w-xl flex items-center justify-between py-2.5 px-3 mb-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 pr-3">
          {title && (
            <h2 className="text-base font-bold text-white truncate drop-shadow-sm">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xs text-slate-300 truncate drop-shadow-sm">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition-colors border border-white/20 cursor-pointer"
            title="Tutup (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        className="relative max-h-[78vh] max-w-[92vw] flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl border border-white/15 bg-black/40 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        {activeSrc ? (
          <img
            src={activeSrc}
            alt={activeAlt}
            className="max-h-[75vh] max-w-full object-contain rounded-xl select-none"
          />
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            Tidak ada gambar yang tersedia.
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="mt-3 text-center text-[11px] text-slate-400 select-none">
        Ketuk di luar gambar atau tekan <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-[10px] text-slate-200 font-mono">Esc</kbd> untuk menutup
      </div>
    </div>
  );
}
