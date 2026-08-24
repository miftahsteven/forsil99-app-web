'use client';

import React, { useState, useEffect } from 'react';
import { DeceasedAlumni, MemorialPrayer } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  fetchMemorialPrayers,
  submitMemorialPrayer,
  deleteMemorialPrayer,
} from '@/services/memorialService';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  X,
  Send,
  Loader2,
  Sparkles,
  Heart,
  User,
  Flame,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface MemorialPrayerModalProps {
  deceased: DeceasedAlumni;
  isOpen: boolean;
  onClose: () => void;
  onPrayerAdded?: (newCount: number) => void;
}

export function MemorialPrayerModal({
  deceased,
  isOpen,
  onClose,
  onPrayerAdded,
}: MemorialPrayerModalProps) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const [prayers, setPrayers] = useState<MemorialPrayer[]>(deceased.recentPrayers || []);
  const [prayerText, setPrayerText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingPrayerId, setDeletingPrayerId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && deceased.id) {
      loadPrayers();
    }
  }, [isOpen, deceased.id]);

  const loadPrayers = async () => {
    setIsLoading(true);
    try {
      const list = await fetchMemorialPrayers(deceased.id);
      setPrayers(list);
    } catch {
      toast.error('Gagal memuat untaian doa.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Silakan masuk ke akun Anda terlebih dahulu untuk mengirimkan doa.');
      return;
    }

    if (!prayerText.trim()) {
      toast.error('Tuliskan doa atau untaian kenangan tulus Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitMemorialPrayer(deceased.id, prayerText.trim());
      if (res.success && res.data) {
        setPrayers((prev) => [res.data!, ...prev]);
        setPrayerText('');
        toast.success('Doa tulus Anda telah terkirim untuk almarhum/almarhumah.');
        if (onPrayerAdded && res.prayerCount !== undefined) {
          onPrayerAdded(res.prayerCount);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirimkan doa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePrayer = async (prayerId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus doa ini?')) {
      return;
    }

    setDeletingPrayerId(prayerId);
    try {
      const res = await deleteMemorialPrayer(prayerId);
      if (res.success) {
        setPrayers((prev) => prev.filter((p) => p.id !== prayerId));
        toast.success('Doa berhasil dihapus.');
        if (onPrayerAdded && res.prayerCount !== undefined) {
          onPrayerAdded(res.prayerCount);
        }
      } else {
        toast.error(res.message || 'Gagal menghapus doa.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus doa.');
    } finally {
      setDeletingPrayerId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-700/60 animate-scaleUp flex flex-col max-h-[90vh]">
        {/* 1. Header with Candle & Deceased Profile Info */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-md bg-slate-800 flex items-center justify-center">
                {deceased.photoUrl ? (
                  <img
                    src={deceased.photoUrl}
                    alt={deceased.fullName}
                    className="w-full h-full object-cover grayscale brightness-95"
                  />
                ) : (
                  <User size={26} className="text-slate-400" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 text-xs bg-amber-500/20 border border-amber-400/40 rounded-full p-0.5">
                🕯️
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-amber-200">
                  Alm. {deceased.fullName}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                {deceased.className && (
                  <span className="text-amber-400/90 font-semibold">{deceased.className}</span>
                )}
                <span>•</span>
                <span>Wafat Tahun {deceased.passedAwayYear}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Wall of Prayers List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Flame size={14} className="text-amber-400 animate-pulse" />
              <span>Untaian Doa & Kenangan Sahabat ({prayers.length})</span>
            </div>
            <span className="text-[11px] text-slate-400">Semoga Husnul Khotimah</span>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <Loader2 size={24} className="animate-spin text-amber-400" />
              <span>Memuat doa sahabat...</span>
            </div>
          ) : prayers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <span className="text-3xl">🕊️</span>
              <p className="text-xs">
                Belum ada untaian doa yang ditulis. Jadilah yang pertama mendoakan almarhum/almarhumah.
              </p>
            </div>
          ) : (
            prayers.map((prayer) => {
              const canDeletePrayer =
                isAdmin || (user?.id && prayer.authorId === user.id);

              return (
                <div
                  key={prayer.id}
                  className="bg-slate-800/70 border border-slate-700/50 rounded-2xl p-3.5 space-y-1.5 transition-all hover:bg-slate-800/90 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AppAvatar
                        src={prayer.authorPhotoUrl}
                        name={prayer.authorName}
                        size="sm"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-200">
                          {prayer.authorNickname || prayer.authorName}
                        </span>
                        {prayer.authorClass && (
                          <span className="text-[10px] text-amber-400/80 ml-1 font-medium">
                            ({prayer.authorClass})
                          </span>
                        )}
                        {user?.id && prayer.authorId === user.id && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded-md ml-1.5 border border-amber-500/30">
                            Anda
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">
                        {formatDistanceToNow(new Date(prayer.createdAt), {
                          addSuffix: true,
                          locale: localeId,
                        })}
                      </span>

                      {canDeletePrayer && (
                        <button
                          type="button"
                          onClick={() => handleDeletePrayer(prayer.id)}
                          disabled={deletingPrayerId === prayer.id}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Hapus doa ini"
                        >
                          {deletingPrayerId === prayer.id ? (
                            <Loader2 size={12} className="animate-spin text-rose-400" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-8 whitespace-pre-line">
                    {prayer.text}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* 3. Send Prayer Input Form */}
        <form onSubmit={handleSubmitPrayer} className="p-3.5 bg-slate-800/90 border-t border-slate-700/80">
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl p-2.5 focus-within:border-amber-400/60 transition-colors">
              <textarea
                value={prayerText}
                onChange={(e) => setPrayerText(e.target.value)}
                placeholder="Tuliskan doa tulus atau kenangan indah bersama almarhum..."
                rows={2}
                maxLength={400}
                className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span>Doa akan terlihat oleh seluruh rekan alumni</span>
                <span>{prayerText.length}/400</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !prayerText.trim()}
              className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold transition-all disabled:opacity-40 active:scale-95 flex items-center justify-center shrink-0 cursor-pointer shadow-md"
              title="Kirim Doa"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
