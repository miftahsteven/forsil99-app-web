'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchProfileById, toggleFollow, fetchFollowStatus } from '@/services/authService';
import { fetchPosts } from '@/services/postService';
import { AlumniProfile, Post } from '@/types';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { VerifiedBadge, GoldBadge } from '@/components/ui/VerifiedBadge';
import { PostCard } from '@/components/feed/PostCard';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  MapPin,
  Briefcase,
  Building,
  GraduationCap,
  MessageSquare,
  UserPlus,
  UserCheck,
  Edit3,
  LogOut,
  Instagram,
  Linkedin,
  Share2,
  Calendar,
  Grid,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;

  const { user, profile: myProfile, logout, isAuthenticated } = useAuth();
  const targetId = rawId === 'me' ? user?.id || myProfile?.uid || '' : rawId;

  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isMe = user?.id === targetId || myProfile?.uid === targetId;

  useEffect(() => {
    if (targetId) {
      loadProfileData();
    }
  }, [targetId]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const [prof, posts, followStatus] = await Promise.all([
        fetchProfileById(targetId),
        fetchPosts(),
        fetchFollowStatus(targetId),
      ]);

      if (prof) setProfile(prof);
      // Filter social posts by this author (exclude shop_share products)
      const filtered = posts.filter(
        (p) => (p.authorId || p.author?.id) === targetId && p.type !== 'shop_share'
      );
      setUserPosts(filtered);

      if (followStatus) {
        setIsFollowing(followStatus.isFollowing);
        setFollowersCount(followStatus.followersCount);
        setFollowingCount(followStatus.followingCount);
      }
    } catch {
      toast.error('Gagal memuat profil alumni.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('Silakan masuk terlebih dahulu.');
      return;
    }
    try {
      const res: any = await toggleFollow(targetId);
      if (res) {
        setIsFollowing(res.isFollowing);
        setFollowersCount(res.followersCount);
        setFollowingCount(res.followingCount);
      }
    } catch {
      toast.error('Gagal memperbarui status follow.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="w-full h-40 bg-slate-200 rounded-2xl" />
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-slate-300 -mt-10" />
          <div className="space-y-1.5 flex-1">
            <div className="w-40 h-5 bg-slate-200 rounded" />
            <div className="w-24 h-3 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-slate-500 mb-4">Profil alumni tidak ditemukan.</p>
        <Link href="/alumni" className="text-xs text-brand-primary font-bold">
          ← Kembali ke Direktori Alumni
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full pb-8">
      {/* 1. Cover Photo & Profile Avatar Header */}
      <div className="relative">
        <div className="w-full h-40 bg-gradient-to-r from-brand-primary to-brand-primaryDeep relative overflow-hidden">
          {profile.coverPhotoUrl ? (
            <img
              src={profile.coverPhotoUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20 text-white font-black text-4xl">
              SMAN 59 JAKARTA ’99
            </div>
          )}
        </div>

        {/* Avatar & Floating Actions */}
        <div className="px-4 flex items-end justify-between -mt-12 relative z-10">
          <div className="p-1 bg-white rounded-full shadow-md">
            <AppAvatar
              src={profile.profilePhotoUrl}
              name={profile.fullName}
              size="xl"
            />
          </div>

          <div className="flex items-center gap-2 mb-2">
            {isMe ? (
              <>
                <Link
                  href="/profile/edit"
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 size={14} />
                  <span>Edit Profil</span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                  title="Keluar Akun"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleToggleFollow}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                    isFollowing
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-brand-primary text-white hover:bg-brand-primaryDark shadow-sm'
                  }`}
                >
                  {isFollowing ? <UserCheck size={15} /> : <UserPlus size={15} />}
                  <span>{isFollowing ? 'Mengikuti' : 'Ikuti'}</span>
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
      </div>

      {/* 2. User Bio & Details */}
      <div className="px-4 pt-3 pb-4 bg-white border-b border-slate-100">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            {profile.fullName}
          </h1>
          <VerifiedBadge size={16} />
        </div>

        {profile.nickname && (
          <p className="text-xs text-slate-500 font-normal">
            Panggilan: <span className="font-semibold text-slate-700">"{profile.nickname}"</span>
          </p>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs font-bold text-brand-primary bg-blue-50 px-2.5 py-0.5 rounded-md flex items-center gap-1">
            <GraduationCap size={13} />
            <span>Kelas {profile.className || 'SMAN 59'} (1999)</span>
          </span>
          {profile.nia && (
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              NIA: {profile.nia}
            </span>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-xs text-slate-700 mt-2.5 leading-relaxed whitespace-pre-line">
            {profile.bio}
          </p>
        )}

        {/* Occupation, Company, City Info */}
        <div className="mt-3 pt-3 border-t border-slate-50 grid grid-cols-2 gap-2 text-xs text-slate-600">
          {profile.occupation && (
            <div className="flex items-center gap-1.5 truncate">
              <Briefcase size={14} className="text-brand-primary flex-shrink-0" />
              <span className="truncate">{profile.occupation}</span>
            </div>
          )}
          {profile.company && (
            <div className="flex items-center gap-1.5 truncate">
              <Building size={14} className="text-brand-primary flex-shrink-0" />
              <span className="truncate">{profile.company}</span>
            </div>
          )}
          {profile.city && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin size={14} className="text-emerald-600 flex-shrink-0" />
              <span className="truncate">{profile.city}</span>
            </div>
          )}
        </div>

        {/* Followers / Following Stats */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-6 text-xs">
          <div>
            <span className="font-extrabold text-slate-900">{followersCount}</span>{' '}
            <span className="text-slate-500">Pengikut</span>
          </div>
          <div>
            <span className="font-extrabold text-slate-900">{followingCount}</span>{' '}
            <span className="text-slate-500">Mengikuti</span>
          </div>
          <div>
            <span className="font-extrabold text-slate-900">{userPosts.length}</span>{' '}
            <span className="text-slate-500">Postingan</span>
          </div>
        </div>
      </div>

      {/* 3. Tab Bar: Postingan / Detail */}
      <div className="flex items-center border-b border-slate-200 bg-white sticky top-14 z-20">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${
            activeTab === 'posts'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Postingan ({userPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${
            activeTab === 'about'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Tentang Alumni
        </button>
      </div>

      {/* 4. Tab Content */}
      <div className="p-3">
        {activeTab === 'posts' ? (
          userPosts.length === 0 ? (
            <EmptyState
              icon={<Grid size={28} />}
              title="Belum ada postingan"
              description={`${profile.fullName} belum membagikan cerita atau foto.`}
            />
          ) : (
            <div className="space-y-3">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-subtle space-y-4 text-xs text-slate-700">
            <div>
              <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                Keahlian & Minat
              </h4>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((s, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-medium"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">Belum ditambahkan</span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-1">
                Media Sosial
              </h4>
              <div className="flex items-center gap-3 mt-2">
                {profile.socialLinks?.instagram && (
                  <a
                    href={`https://instagram.com/${profile.socialLinks.instagram}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-pink-600 font-semibold hover:underline"
                  >
                    <Instagram size={16} />
                    <span>@{profile.socialLinks.instagram}</span>
                  </a>
                )}
                {profile.socialLinks?.linkedin && (
                  <a
                    href={profile.socialLinks.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-blue-700 font-semibold hover:underline"
                  >
                    <Linkedin size={16} />
                    <span>LinkedIn</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
