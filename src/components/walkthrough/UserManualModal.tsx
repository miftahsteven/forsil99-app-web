'use client';

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  User,
  LogIn,
  Sparkles,
  Shield,
  HelpCircle,
  PlayCircle,
  CheckCircle2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { MANUAL_SECTIONS } from '@/config/walkthroughData';
import { ManualSection } from '@/types/walkthrough';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour?: () => void;
  currentPageKey?: 'register' | 'login' | 'home';
}

export function UserManualModal({
  isOpen,
  onClose,
  onStartTour,
  currentPageKey = 'home',
}: UserManualModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(
    currentPageKey === 'register'
      ? 'manual-register'
      : currentPageKey === 'login'
      ? 'manual-login'
      : 'manual-features'
  );

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Semua Panduan', icon: BookOpen },
    { id: 'register', label: 'Pendaftaran', icon: User },
    { id: 'login', label: 'Login', icon: LogIn },
    { id: 'features', label: 'Fitur & Menu', icon: Sparkles },
    { id: 'faq', label: 'Keamanan & FAQ', icon: Shield },
  ];

  const filteredSections =
    selectedCategory === 'all'
      ? MANUAL_SECTIONS
      : MANUAL_SECTIONS.filter((s) => s.category === selectedCategory);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'user':
        return <User className="text-brand-primary" size={20} />;
      case 'logIn':
        return <LogIn className="text-emerald-600" size={20} />;
      case 'sparkles':
        return <Sparkles className="text-amber-600" size={20} />;
      case 'shield':
        return <Shield className="text-sky-600" size={20} />;
      default:
        return <Info className="text-slate-500" size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-blue-50/70 via-white to-amber-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary flex-shrink-0">
              <BookOpen size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Buku Manual & Panduan Alumni
              </h2>
              <p className="text-xs text-slate-500">
                Dokumentasi fitur dan panduan pemakaian Forsil99 SMAN 59 Jakarta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Tutup Panduan"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Banner: Mulai Tur Interaktif */}
        {onStartTour && (
          <div className="px-4 py-2.5 bg-brand-primary/5 border-b border-brand-primary/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-brand-primaryDark font-medium">
              <Sparkles size={16} className="text-brand-gold flex-shrink-0" />
              <span>Ingin tur langsung ditunjukkan di halaman ini?</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartTour();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-semibold rounded-lg shadow-xs transition-all active:scale-95 flex-shrink-0"
            >
              <PlayCircle size={15} />
              <span>Mulai Tur Interaktif</span>
            </button>
          </div>
        )}

        {/* Category Tabs Filter */}
        <div className="flex items-center gap-1 px-4 py-2.5 bg-slate-50 border-b border-slate-100 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-brand-primary shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon size={14} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {filteredSections.map((sec) => {
            const isExpanded = expandedId === sec.id;
            return (
              <div
                key={sec.id}
                className={`rounded-xl border transition-all ${
                  isExpanded
                    ? 'border-brand-primary/30 bg-blue-50/20 shadow-xs'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
                }`}
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : sec.id)}
                  className="w-full text-left p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {getIcon(sec.iconName)}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                        {sec.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {sec.summary}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-slate-400 transition-transform ${
                      isExpanded ? 'rotate-90 text-brand-primary' : ''
                    }`}
                  />
                </button>

                {/* Accordion Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100/80 space-y-3 text-xs text-slate-700 animate-fade-in">
                    <p className="text-slate-600 font-medium leading-relaxed">
                      {sec.summary}
                    </p>

                    <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-100 shadow-2xs">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Poin Petunjuk:
                      </p>
                      <ul className="space-y-2">
                        {sec.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start gap-2 leading-relaxed">
                            <CheckCircle2
                              size={15}
                              className="text-emerald-600 flex-shrink-0 mt-0.5"
                            />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {sec.tips && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 flex items-start gap-2 text-amber-900">
                        <Info size={15} className="text-amber-700 flex-shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-relaxed">
                          <strong>Tips Tambahan:</strong> {sec.tips}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Forsil99 • Silaturahmi Digital SMAN 59 Jakarta
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-all shadow-xs"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}
