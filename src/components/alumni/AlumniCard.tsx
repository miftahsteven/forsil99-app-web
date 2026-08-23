'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, UserPlus, UserCheck, MapPin, Briefcase } from 'lucide-react';
import { AlumniProfile } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toggleFollow } from '@/services/authService';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { toast } from 'sonner';

interface AlumniCardProps {
  alumni: AlumniProfile;
  isFollowingInitial?: boolean;
}

export function AlumniCard({ alumni, isFollowingInitial = false }: AlumniCardProps) {
  const { user, profile, isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState<boolean>(isFollowingInitial);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState<boolean>(false);

  const targetId = alumni.uid || alumni.userId || alumni.accountId || alumni.id || '';
  const isMe = user?.id === targetId || profile?.uid === targetId;

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Silakan masuk terlebih dahulu.');
      return;
    }
    if (!targetId) return;

    setIsUpdatingFollow(true);
    try {
      const res: any = await toggleFollow(targetId);
      if (res && typeof res.isFollowing === 'boolean') {
        setIsFollowing(res.isFollowing);
        toast.success(res.isFollowing ? `Mengikuti ${alumni.fullName}` : `Berhenti mengikuti`);
      } else {
        setIsFollowing(!isFollowing);
      }
    } catch {
      toast.error('Gagal memperbarui status ikuti.');
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100/90 shadow-subtle flex items-center justify-between gap-3 hover:border-slate-200 transition-all">
      {/* Left: Avatar + Info */}
      <Link href={`/profile/${targetId}`} className="flex items-center gap-3.5 flex-1 min-w-0 group">
        <AppAvatar
          src={alumni.profilePhotoUrl}
          name={alumni.fullName}
          size="md"
          className="group-hover:scale-105 transition-transform"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-bold text-sm text-slate-900 group-hover:text-brand-primary transition-colors truncate">
              {alumni.fullName}
            </h4>
            <VerifiedBadge size={14} />
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
        </div>
      </Link>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!isMe && (
          <>
            <button
              onClick={handleFollowClick}
              disabled={isUpdatingFollow}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 ${
                isFollowing
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-brand-primary text-white hover:bg-brand-primaryDark shadow-sm'
              }`}
              title={isFollowing ? 'Mengikuti' : 'Ikuti Alumni'}
            >
              {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
            </button>

            <Link
              href={`/chat/${targetId}`}
              className="p-2 rounded-xl bg-blue-50 text-brand-primary hover:bg-blue-100 transition-colors"
              title="Kirim Pesan Langsung"
            >
              <MessageSquare size={16} />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
