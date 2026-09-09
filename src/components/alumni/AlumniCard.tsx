'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, UserPlus, UserCheck, MapPin, Briefcase } from 'lucide-react';
import { AlumniProfile } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toggleFollow } from '@/services/authService';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ProfileCategoryBadge } from '@/components/ui/ProfileCategoryBadge';
import { ImageViewModal } from '@/components/ui/ImageViewModal';
import { toast } from 'sonner';

interface AlumniCardProps {
  alumni: AlumniProfile;
  isFollowingInitial?: boolean;
}

export function AlumniCard({ alumni, isFollowingInitial = false }: AlumniCardProps) {
  const router = useRouter();
  const { user, profile, isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState<boolean>(
    alumni.isFollowing !== undefined ? alumni.isFollowing : isFollowingInitial
  );
  const [isUpdatingFollow, setIsUpdatingFollow] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  useEffect(() => {
    if (alumni.isFollowing !== undefined) {
      setIsFollowing(alumni.isFollowing);
    }
  }, [alumni.isFollowing]);

  const targetId = alumni.uid || alumni.userId || alumni.accountId || alumni.id || '';
  const isMe = user?.id === targetId || profile?.uid === targetId;

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Silakan masuk terlebih dahulu.');
      return;
    }
    if (!targetId) return;

    // Warning confirmation before unfollowing
    if (isFollowing) {
      const confirmed = window.confirm(
        `Apakah Anda yakin ingin berhenti mengikuti ${alumni.fullName}?`
      );
      if (!confirmed) return;
    }

    setIsUpdatingFollow(true);
    try {
      const res: any = await toggleFollow(targetId);
      if (res && typeof res.isFollowing === 'boolean') {
        setIsFollowing(res.isFollowing);
        toast.success(res.isFollowing ? `Mulai mengikuti ${alumni.fullName}` : `Berhenti mengikuti ${alumni.fullName}`);
      } else {
        setIsFollowing(!isFollowing);
      }
    } catch {
      toast.error('Gagal memperbarui status ikuti.');
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Silakan masuk terlebih dahulu untuk memulai obrolan.');
      return;
    }

    if (!isFollowing) {
      toast.error(
        `Anda harus mengikuti (follow) ${alumni.fullName} terlebih dahulu untuk memulai obrolan chat.`,
        {
          action: {
            label: '+ Ikuti Sekarang',
            onClick: () => handleFollowClick(e),
          },
          duration: 5000,
        }
      );
      return;
    }

    router.push(`/chat/${targetId}`);
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-subtle flex items-center justify-between gap-3 hover:border-slate-200 transition-all">
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (alumni.profilePhotoUrl) {
              setIsPreviewOpen(true);
            }
          }}
          className={`relative flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-primary/40 group/avatar ${
            alumni.profilePhotoUrl ? 'cursor-pointer' : 'cursor-default'
          }`}
          title={alumni.profilePhotoUrl ? `Lihat foto ${alumni.fullName} lebih besar` : undefined}
        >
          <AppAvatar
            src={alumni.profilePhotoUrl}
            name={alumni.fullName}
            size="md"
            className="group-hover/avatar:scale-105 transition-transform"
          />
        </button>

        <Link href={`/profile/${targetId}`} className="flex-1 min-w-0 group">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-bold text-sm text-slate-900 group-hover:text-brand-primary transition-colors truncate">
              {alumni.fullName}
            </h4>
            {alumni.profileCategory ? (
              <ProfileCategoryBadge category={alumni.profileCategory} size={15} />
            ) : (
              <VerifiedBadge size={14} />
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-semibold text-brand-primary bg-blue-50 px-2 py-0.5 rounded-md">
              {alumni.className || 'SMAN 59 ’99'}
            </span>
            {alumni.nickname && (
              <span className="text-xs text-slate-400 font-normal">
                "{alumni.nickname}"
              </span>
            )}
          </div>

          {(alumni.occupation || alumni.city) && (
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 truncate">
              {alumni.occupation && (
                <span className="flex items-center gap-1 truncate">
                  <Briefcase size={12} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{alumni.occupation}</span>
                </span>
              )}
              {alumni.city && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{alumni.city}</span>
                </span>
              )}
            </div>
          )}
        </Link>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!isMe && (
          <>
            <button
              onClick={handleFollowClick}
              disabled={isUpdatingFollow}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                isFollowing
                  ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200'
                  : 'bg-brand-primary text-white hover:bg-brand-primaryDark shadow-xs'
              }`}
              title={isFollowing ? 'Klik untuk berhenti mengikuti' : 'Ikuti Alumni'}
            >
              {isFollowing ? (
                <>
                  <UserCheck size={14} className="text-emerald-600" />
                  <span className="hidden sm:inline">Mengikuti</span>
                  <span className="sm:hidden">Diikuti</span>
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  <span>+ Ikuti</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleChatClick}
              className="p-2 rounded-xl bg-blue-50 text-brand-primary hover:bg-blue-100 transition-colors cursor-pointer"
              title={isFollowing ? 'Kirim Pesan Langsung' : 'Ikuti alumni terlebih dahulu untuk chat'}
            >
              <MessageSquare size={16} />
            </button>
          </>
        )}
      </div>

      {/* Lightbox Modal Foto Profil */}
      <ImageViewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        imageUrl={alumni.profilePhotoUrl}
        altText={`Foto profil ${alumni.fullName}`}
        title={alumni.fullName}
        subtitle={`${alumni.className || 'SMAN 59'} (Angkatan 1999)`}
      />
    </div>
  );
}
