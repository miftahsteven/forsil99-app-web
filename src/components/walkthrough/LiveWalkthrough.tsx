'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  User,
  Mail,
  Users,
  Camera,
  Sparkles,
  LogIn,
  Plus,
  ShoppingBag,
  Radio,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import { WalkthroughConfig, WalkthroughStep } from '@/types/walkthrough';

interface LiveWalkthroughProps {
  config: WalkthroughConfig;
  isOpen?: boolean;
  onClose?: () => void;
  onComplete?: () => void;
  onOpenManual?: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function LiveWalkthrough({
  config,
  isOpen: controlledIsOpen,
  onClose,
  onComplete,
  onOpenManual,
}: LiveWalkthroughProps) {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledIsOpen !== undefined;
  const isTourOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const storageKey = `ruang59_tour_${config.pageKey}_seen`;

  // Auto-start for first-time visitors if uncontrolled
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isControlled) return;

    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      const timer = setTimeout(() => {
        setInternalIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [storageKey, isControlled]);

  const currentStep: WalkthroughStep | undefined = config.steps[currentStepIndex];

  // Update bounding rect of target element
  const updateTargetRect = useCallback(() => {
    if (!isTourOpen || !currentStep?.targetId) {
      setTargetRect(null);
      return;
    }

    const element = document.getElementById(currentStep.targetId);
    if (element) {
      // Avoid scrolling fixed elements like BottomNavigation
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.position !== 'fixed') {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      const updatedRect = element.getBoundingClientRect();
      const padding = 6;
      setTargetRect({
        top: Math.max(0, updatedRect.top - padding),
        left: Math.max(0, updatedRect.left - padding),
        width: updatedRect.width + padding * 2,
        height: updatedRect.height + padding * 2,
      });
    } else {
      setTargetRect(null);
    }
  }, [isTourOpen, currentStep]);

  useEffect(() => {
    updateTargetRect();
    const handleResize = () => updateTargetRect();
    const handleScroll = () => updateTargetRect();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [updateTargetRect, currentStepIndex]);

  // Handle ESC and Arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTourOpen) return;
      if (e.key === 'Escape') {
        handleDismiss();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourOpen, currentStepIndex]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
    if (!isControlled) {
      setInternalIsOpen(false);
    }
    onClose?.();
  };

  const handleComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
    if (!isControlled) {
      setInternalIsOpen(false);
    }
    onComplete?.();
    onClose?.();
  };

  const handleNext = () => {
    if (currentStepIndex < config.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (!isTourOpen || !currentStep) return null;

  const totalSteps = config.steps.length;

  const renderIcon = (name?: string) => {
    switch (name) {
      case 'user':
        return <User size={16} className="text-brand-primary" />;
      case 'mail':
        return <Mail size={16} className="text-brand-primary" />;
      case 'users':
        return <Users size={16} className="text-emerald-600" />;
      case 'camera':
        return <Camera size={16} className="text-amber-600" />;
      case 'sparkles':
        return <Sparkles size={16} className="text-brand-gold" />;
      case 'logIn':
        return <LogIn size={16} className="text-emerald-600" />;
      case 'plus':
        return <Plus size={16} className="text-brand-primary" />;
      case 'store':
        return <ShoppingBag size={16} className="text-indigo-600" />;
      case 'radio':
        return <Radio size={16} className="text-rose-600" />;
      default:
        return <Lightbulb size={16} className="text-amber-500" />;
    }
  };

  // Mobile-first positioning rule:
  // If target element is in lower half of viewport (like bottom navigation tabs),
  // place the card at the TOP of the screen so it never covers the target.
  // Otherwise, place it at the BOTTOM of the screen.
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const isTargetNearBottom = targetRect ? targetRect.top > vh * 0.52 : false;

  return (
    <>
      {/* 1. Crystal-Clear SVG Spotlight Cutout (Zero blur, 100% sharp inside target) */}
      {targetRect ? (
        <svg
          className="fixed inset-0 w-full h-full z-50 pointer-events-auto"
          onClick={handleDismiss}
          style={{ width: '100vw', height: '100vh' }}
        >
          <defs>
            <mask id="walkthrough-spotlight-mask">
              {/* White fills the whole screen (shows dark overlay) */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black cuts out the target rectangle (100% transparent hole) */}
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="16"
                ry="16"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(15, 23, 42, 0.65)"
            mask="url(#walkthrough-spotlight-mask)"
          />
        </svg>
      ) : (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 transition-opacity duration-200"
          onClick={handleDismiss}
          aria-hidden="true"
        />
      )}

      {/* 2. Sharp Glowing Yellow Border around Target */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`,
            zIndex: 52,
            pointerEvents: 'none',
          }}
          className="rounded-2xl ring-4 ring-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.5)] transition-all duration-300"
        />
      )}

      {/* 3. Mobile-First Standard Docked Card (Strict viewport bounds: Never overflows horizontally or vertically!) */}
      <div
        className={`fixed z-[60] left-3 right-3 sm:left-auto sm:right-auto sm:w-full sm:max-w-sm pointer-events-none transition-all duration-300 ease-out ${
          isTargetNearBottom
            ? 'top-3 sm:top-5 sm:left-1/2 sm:-translate-x-1/2'
            : 'bottom-3 sm:bottom-5 sm:left-1/2 sm:-translate-x-1/2'
        }`}
      >
        <div
          ref={cardRef}
          className="pointer-events-auto w-full bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 flex flex-col gap-2.5 max-h-[46vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                {renderIcon(currentStep.iconName)}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wide block truncate">
                  {currentStep.badge || `Langkah ${currentStepIndex + 1} dari ${totalSteps}`}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
                  {currentStep.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onOpenManual && (
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss();
                    onOpenManual();
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-lg transition-colors"
                  title="Buka Buku Manual & FAQ Lengkap"
                >
                  <BookOpen size={12} />
                  <span>Manual</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Tutup (Esc)"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-600 leading-relaxed py-0.5">
            {currentStep.description}
          </p>

          {/* Footer: Progress & Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            {totalSteps > 1 ? (
              <div className="flex items-center gap-1">
                {config.steps.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentStepIndex
                        ? 'w-4 bg-brand-primary'
                        : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                    }`}
                    title={`Langkah ${idx + 1}`}
                  />
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">Forsil99</span>
            )}

            <div className="flex items-center gap-1.5">
              {totalSteps > 1 && (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-600 px-2 py-1 transition-colors"
                >
                  Lewati
                </button>
              )}

              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors active:scale-95"
                >
                  Kembali
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primaryDark rounded-lg shadow-xs transition-all active:scale-95"
              >
                {currentStepIndex === totalSteps - 1 ? 'Mengerti' : 'Lanjut'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
