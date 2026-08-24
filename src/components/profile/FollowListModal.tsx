'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Search, UserCheck, UserPlus, Users, Loader2 } from 'lucide-react';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { fetchFollowers, fetchFollowing, toggleFollow } from '@/services/authService';
import { AlumniProfile } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName?: string;
  initialTab?: 'followers' | 'following';
  onCountChange?: () => void;
}

export function FollowListModal({
  isOpen,
  onClose,
  targetUserId,
  targetUserName = 'Alumni',
  initialTab = 'followers',
  onCountChange,
}: FollowListModalProps) {
  const { user, profile: myProfile, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [followers, setFollowers] = useState<AlumniProfile[]>([]);
  const [following, setFollowing] = useState<AlumniProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      loadData();
    }
  }, [isOpen, targetUserId, initialTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [follData, followingData] = await Promise.all([
        fetchFollowers(targetUserId),
        fetchFollowing(targetUserId),
      ]);
      setFollowers(follData);
      setFollowing(followingData);
    } catch {
      toast.error('Gagal memuat daftar pengikut/mengikuti.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentList = activeTab === 'followers' ? followers : following;
  const filteredList = currentList.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.fullName?.toLowerCase().includes(q) ||
      p.nickname?.toLowerCase().includes(q) ||
      p.className?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q)
    );
  });

  const handleToggleFollow = async (targetAlumni: AlumniProfile) => {
    if (!isAuthenticated) {
      toast.error('Silakan masuk terlebih dahulu.');
      return;
    }

    const tId = targetAlumni.uid || targetAlumni.userId || targetAlumni.accountId || targetAlumni.id || '';
    if (!tId) return;

    const isCurrentlyFollowing = targetAlumni.isFollowing;

    // Show warning before unfollow
    if (isCurrentlyFollowing) {
      const confirmed = window.confirm(
        `Apakah Anda yakin ingin berhenti mengikuti ${targetAlumni.fullName}?`
      );
      if (!confirmed) return;
    }

    setUpdatingId(tId);
    try {
      const res: any = await toggleFollow(tId);
      const newStatus = res && typeof res.isFollowing === 'boolean' ? res.isFollowing : !isCurrentlyFollowing;

      // Update state in both followers and following lists
      setFollowers((prev) =>
        prev.map((item) => {
          const itemId = item.uid || item.userId || item.accountId || item.id;
          return itemId === tId ? { ...item, isFollowing: newStatus } : item;
        })
      );

      setFollowing((prev) =>
        prev.map((item) => {
          const itemId = item.uid || item.userId || item.accountId || item.id;
          return itemId === tId ? { ...item, isFollowing: newStatus } : item;
        })
      );

      toast.success(
        newStatus ? `Mulai mengikuti ${targetAlumni.fullName}` : `Berhenti mengikuti ${targetAlumni.fullName}`
      );

      if (onCountChange) {
        onCountChange();
      }
    } catch {
      toast.error('Gagal memperbarui status ikuti.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden border border-slate-100 animate-scaleUp">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 leading-tight">
              Jejaring Alumni
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[240px]">
              {targetUserName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1 m-3 rounded-2xl">
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'followers'
                ? 'bg-white text-brand-primary shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pengikut ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'following'
                ? 'bg-white text-brand-primary shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Mengikuti ({following.length})
          </button>
        </div>

        {/* Search input within modal */}
        <div className="px-3.5 pb-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Cari dalam ${activeTab === 'followers' ? 'pengikut' : 'mengikuti'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-primary focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto px-3.5 py-2 divide-y divide-slate-100 no-scrollbar">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 size={24} className="animate-spin text-brand-primary" />
              <span className="text-xs">Memuat data alumni...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <Users size={22} />
              </div>
              <p className="text-xs font-medium text-slate-600">
                {searchQuery
                  ? 'Tidak ada alumni yang sesuai'
                  : activeTab === 'followers'
                  ? 'Belum ada pengikut'
                  : 'Belum mengikuti alumni lain'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {searchQuery
                  ? 'Coba gunakan kata kunci pencarian yang lain.'
                  : activeTab === 'followers'
                  ? 'Alumni yang mengikuti profil ini akan muncul di sini.'
                  : 'Jelajahi menu direktori untuk menemukan teman seangkatan.'}
              </p>
            </div>
          ) : (
            filteredList.map((alumni) => {
              const aId = alumni.uid || alumni.userId || alumni.accountId || alumni.id || '';
              const isMe = user?.id === aId || myProfile?.uid === aId;
              const isUpdating = updatingId === aId;

              return (
                <div
                  key={aId}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 rounded-xl px-1.5 transition-colors"
                >
                  <Link
                    href={`/profile/${aId}`}
                    onClick={onClose}
                    className="flex items-center gap-3 min-w-0 flex-1 group"
                  >
                    <AppAvatar
                      src={alumni.profilePhotoUrl}
                      name={alumni.fullName}
                      size="sm"
                      className="group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-brand-primary truncate transition-colors">
                          {alumni.fullName}
                        </span>
                        <VerifiedBadge size={12} />
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span className="text-brand-primary font-medium">
                          {alumni.className || 'SMAN 59 ’99'}
                        </span>
                        {alumni.nickname && <span>• "{alumni.nickname}"</span>}
                      </div>
                    </div>
                  </Link>

                  {/* Action Button */}
                  {!isMe && (
                    <button
                      onClick={() => handleToggleFollow(alumni)}
                      disabled={isUpdating}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 flex-shrink-0 cursor-pointer ${
                        alumni.isFollowing
                          ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200'
                          : 'bg-brand-primary text-white hover:bg-brand-primaryDark shadow-xs'
                      }`}
                    >
                      {isUpdating ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : alumni.isFollowing ? (
                        <>
                          <UserCheck size={13} className="text-emerald-600" />
                          <span>Mengikuti</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={13} />
                          <span>+ Ikuti</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
