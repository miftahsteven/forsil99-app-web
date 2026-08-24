'use client';

import React, { useState } from 'react';
import { DeceasedAlumni } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { giveMemorialFlower, deleteDeceasedAlumni } from '@/services/memorialService';
import { MemorialPrayerModal } from './MemorialPrayerModal';
import { MemorialReportModal } from './MemorialReportModal';
import {
  Heart,
  MessageSquare,
  Sparkles,
  Flame,
  User,
  Check,
  Send,
  Calendar,
  MoreHorizontal,
  Flag,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface MemorialCardProps {
  deceased: DeceasedAlumni;
  onFlowerGiven?: (deceasedId: string, newCount: number) => void;
  onDeleted?: (deceasedId: string) => void;
}

export function MemorialCard({ deceased, onFlowerGiven, onDeleted }: MemorialCardProps) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [flowerCount, setFlowerCount] = useState<number>(deceased.flowerCount || 0);
  const [hasGivenFlower, setHasGivenFlower] = useState<boolean>(Boolean(deceased.hasGivenFlower));
  const [prayerCount, setPrayerCount] = useState<number>(deceased.prayerCount || 0);
  const [isGivingFlower, setIsGivingFlower] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showPrayerModal, setShowPrayerModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState<boolean>(false);
  const [flowerAnimation, setFlowerAnimation] = useState<boolean>(false);

  const canDelete = isAdmin || (user?.id && deceased.createdById === user.id);

  const handleGiveFlower = async () => {
    if (!isAuthenticated) {
      toast.error('Silakan masuk ke akun Anda terlebih dahulu untuk menabur bunga.');
      return;
    }

    if (hasGivenFlower) {
      toast.info('Bunga harum Anda masih mekar untuk almarhum/almarhumah (berlaku selama 30 hari).');
      return;
    }

    setIsGivingFlower(true);
    try {
      const res = await giveMemorialFlower(deceased.id);
      if (res.success) {
        setHasGivenFlower(true);
        const newCount = res.flowerCount !== undefined ? res.flowerCount : flowerCount + 1;
        setFlowerCount(newCount);
        setFlowerAnimation(true);
        setTimeout(() => setFlowerAnimation(false), 2000);
        toast.success(res.message || 'Bunga harum dan doa Anda telah berhasil ditaburkan.');
        if (onFlowerGiven) {
          onFlowerGiven(deceased.id, newCount);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menabur bunga.');
    } finally {
      setIsGivingFlower(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus data memorial Alm. ${deceased.fullName}? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteDeceasedAlumni(deceased.id);
      if (res.success) {
        toast.success('Data memorial berhasil dihapus.');
        if (onDeleted) {
          onDeleted(deceased.id);
        }
      } else {
        toast.error(res.message || 'Gagal menghapus data.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data memorial.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-xl overflow-hidden text-slate-100 transition-all hover:border-amber-500/30 group">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

        {/* Flower Animation Particles */}
        {flowerAnimation && (
          <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-fadeOut">
            <span className="text-4xl animate-bounce">🌹 🌸 ✨</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: Portrait & Profile Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Portrait Frame */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-lg bg-slate-800 flex items-center justify-center group-hover:border-amber-400/70 transition-colors">
                {deceased.photoUrl ? (
                  <img
                    src={deceased.photoUrl}
                    alt={deceased.fullName}
                    className="w-full h-full object-cover grayscale brightness-95 group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <User size={30} className="text-slate-400" />
                )}
              </div>

              {/* Candle badge */}
              <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-amber-500/50 rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md">
                🕯️
              </div>
            </div>

            {/* Name & Class Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-amber-200 truncate leading-snug">
                  Alm. {deceased.fullName}
                </h3>
                {deceased.nickname && (
                  <span className="text-xs text-slate-400 font-medium">({deceased.nickname})</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                {deceased.className && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-bold border border-amber-500/20 text-[11px]">
                    {deceased.className}
                  </span>
                )}
                <span>•</span>
                <span className="flex items-center gap-1 text-[11px] text-slate-300">
                  <Calendar size={12} className="text-amber-400" />
                  <span>Wafat Tahun {deceased.passedAwayYear}</span>
                </span>
                {deceased.passedAwayDate && (
                  <span className="text-[11px] text-slate-400">({deceased.passedAwayDate})</span>
                )}
              </div>

              {/* Memory bio text */}
              {deceased.bio && (
                <p className="text-xs text-slate-300/90 mt-2 line-clamp-2 italic leading-relaxed">
                  "{deceased.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Top Menu/Admin + Bottom Action Buttons */}
          <div className="flex flex-col items-stretch sm:items-end justify-between gap-3 w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
            {/* Top Row: Admin Delete Button & 3-Dots Menu */}
            <div className="flex items-center justify-end gap-1.5 self-end">
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                  title="Hapus data memorial ini (Admin/Pembuat)"
                >
                  {isDeleting ? (
                    <Loader2 size={13} className="animate-spin text-rose-400" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  <span>Hapus</span>
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-xs"
                  title="Pilihan lainnya"
                >
                  <MoreHorizontal size={16} />
                </button>

                {showMenuDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowMenuDropdown(false)}
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-52 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 py-1.5 z-40 animate-fadeIn">
                      <button
                        onClick={() => {
                          setShowMenuDropdown(false);
                          setShowReportModal(true);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold text-amber-300 hover:bg-amber-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Flag size={13} className="text-amber-400" />
                        <span>Laporkan Data Tidak Sesuai</span>
                      </button>

                      {canDelete && (
                        <button
                          onClick={() => {
                            setShowMenuDropdown(false);
                            handleDelete();
                          }}
                          disabled={isDeleting}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer border-t border-slate-800"
                        >
                          <Trash2 size={13} className="text-rose-400" />
                          <span>Hapus Data Memorial</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Row: Tabur Bunga & Kirim Doa */}
            <div className="flex sm:flex-col items-center gap-2 w-full sm:w-44">
              {/* Button 1: Tabur Bunga */}
              <button
                onClick={handleGiveFlower}
                disabled={isGivingFlower}
                className={`w-full px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95 ${
                  hasGivenFlower
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-600/40 hover:bg-rose-900/90'
                    : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-900/30'
                }`}
              >
                <span className="text-sm">🌹</span>
                <span>
                  {hasGivenFlower
                    ? `Bunga Tertabur (${flowerCount})`
                    : `Tabur Bunga (${flowerCount})`}
                </span>
                {hasGivenFlower && <Check size={13} className="text-rose-300" />}
              </button>

              {/* Button 2: Doakan */}
              <button
                onClick={() => setShowPrayerModal(true)}
                className="w-full px-3.5 py-2 rounded-2xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 hover:border-amber-400/50 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95"
              >
                <span className="text-sm">🤲</span>
                <span>Kirim Doa ({prayerCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Prayer Snippet */}
        {deceased.recentPrayers && deceased.recentPrayers.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 truncate max-w-[85%]">
              <span className="text-amber-400">💬</span>
              <span className="font-semibold text-slate-300">
                {deceased.recentPrayers[0].authorName}:
              </span>
              <span className="italic truncate text-slate-400">
                "{deceased.recentPrayers[0].text}"
              </span>
            </div>

            <button
              onClick={() => setShowPrayerModal(true)}
              className="text-amber-400 hover:text-amber-300 font-semibold shrink-0 cursor-pointer"
            >
              Lihat Doa →
            </button>
          </div>
        )}
      </div>

      {/* Prayer Wall Modal */}
      {showPrayerModal && (
        <MemorialPrayerModal
          deceased={deceased}
          isOpen={showPrayerModal}
          onClose={() => setShowPrayerModal(false)}
          onPrayerAdded={(newCount) => setPrayerCount(newCount)}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <MemorialReportModal
          deceased={deceased}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </>
  );
}
