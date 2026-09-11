'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchProfileById, toggleFollow, fetchFollowStatus, updateProfile } from '@/services/authService';
import { compressImage } from '@/utils/imageCompressor';
import { fetchPosts } from '@/services/postService';
import { fetchProducts, fetchShops } from '@/services/shopService';
import { AlumniProfile, Post, Product, Shop } from '@/types';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { VerifiedBadge, GoldBadge } from '@/components/ui/VerifiedBadge';
import { ProfileCategoryBadge } from '@/components/ui/ProfileCategoryBadge';
import { IncompleteProfileReminderBanner } from '@/components/profile/IncompleteProfileReminderBanner';
import { PostCard } from '@/components/feed/PostCard';
import { ProductCard } from '@/components/shop/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { FollowListModal } from '@/components/profile/FollowListModal';
import { SellerRegistrationModal } from '@/components/shop/SellerRegistrationModal';
import { ImageViewModal } from '@/components/ui/ImageViewModal';
import { CoverCropModal } from '@/components/ui/CoverCropModal';
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
  KeyRound,
  Phone,
  Heart,
  Lock,
  Clock,
  Sparkles,
  Shield,
  Cake,
  EyeOff,
  Home,
  User,
  ExternalLink,
  Database,
  Award,
  Info,
  CheckCircle2,
  Mail,
  FileText,
  BadgeCheck,
  Store,
  ShoppingBag,
  Camera,
  Loader2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

const formatBirthDate = (isoStr?: string) => {
  if (!isoStr) return null;
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return isoStr;
  }
};

const calculateAge = (birthDateStr?: string) => {
  if (!birthDateStr) return null;
  try {
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `(${age} thn)` : null;
  } catch {
    return null;
  }
};

const formatLocation = (city?: string | null, province?: string | null) => {
  const cleanCity = city?.trim();
  let cleanProvince = province?.trim();

  if (!cleanCity && !cleanProvince) {
    return 'Belum diisi';
  }

  // Auto-correct obvious mismatch from seed residue
  if (cleanCity && cleanProvince === 'DKI Jakarta') {
    const lower = cleanCity.toLowerCase();
    if (
      lower.includes('bogor') ||
      lower.includes('depok') ||
      lower.includes('bekasi') ||
      lower.includes('cibinong') ||
      lower.includes('cikarang') ||
      lower.includes('bandung') ||
      lower.includes('karawang')
    ) {
      cleanProvince = 'Jawa Barat';
    } else if (
      lower.includes('tangerang') ||
      lower.includes('tangsel') ||
      lower.includes('serang') ||
      lower.includes('cilegon') ||
      lower.includes('bsd') ||
      lower.includes('bintaro')
    ) {
      cleanProvince = 'Banten';
    }
  }

  if (cleanCity && cleanProvince) {
    if (cleanCity.toLowerCase().includes(cleanProvince.toLowerCase())) {
      return cleanCity;
    }
    return `${cleanCity} • ${cleanProvince}`;
  }

  return cleanCity || cleanProvince || 'Belum diisi';
};

const getWhatsAppUrl = (phone?: string) => {
  if (!phone) return '#';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  return `https://wa.me/${clean}`;
};

export default function ProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;

  const { user, profile: myProfile, logout, isAuthenticated, updateCurrentProfileState } = useAuth();
  const targetId = rawId === 'me' ? user?.id || myProfile?.uid || '' : rawId;

  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [sellerPosts, setSellerPosts] = useState<Post[]>([]);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [userShop, setUserShop] = useState<Shop | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const searchParams = useSearchParams();
  const requestedTab = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState<'about' | 'posts' | 'seller'>(
    requestedTab === 'posts' ? 'posts' : requestedTab === 'seller' ? 'seller' : 'about'
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState<boolean>(false);
  const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>('followers');
  const [isSellerModalOpen, setIsSellerModalOpen] = useState<boolean>(false);
  const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; subtitle?: string } | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isMe =
    Boolean(user?.id && (user.id === targetId || user.id === profile?.userId || user.id === profile?.id)) ||
    Boolean(myProfile?.uid && (myProfile.uid === targetId || myProfile.uid === profile?.userId || myProfile.uid === profile?.id)) ||
    Boolean(myProfile?.userId && (myProfile.userId === targetId || myProfile.userId === profile?.userId || myProfile.userId === profile?.id)) ||
    Boolean(profile && (profile.userId === user?.id || profile.id === myProfile?.id));

  const handleChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Silakan masuk terlebih dahulu untuk menggunakan fitur obrolan.');
      return;
    }

    if (!isFollowing) {
      toast.error(
        `Anda harus mengikuti (follow) ${profile?.fullName || 'rekan alumni'} terlebih dahulu untuk memulai obrolan chat.`,
        {
          action: {
            label: '+ Ikuti Sekarang',
            onClick: () => handleToggleFollow(),
          },
          duration: 5000,
        }
      );
      return;
    }

    router.push(`/chat/${targetId}`);
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Pastikan file gambar
    if (!file.type || !file.type.startsWith('image/')) {
      toast.error('File yang dipilih bukan gambar. Harap pilih file gambar (JPG, PNG, WebP).');
      if (coverInputRef.current) coverInputRef.current.value = '';
      return;
    }

    // 2. Batas ukuran 25MB
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Ukuran file foto terlalu besar. Maksimal 25MB.');
      if (coverInputRef.current) coverInputRef.current.value = '';
      return;
    }

    // 3. Baca gambar untuk dipotong langsung oleh user tanpa mengubah resolusi asli
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setIsCropModalOpen(true);
      if (coverInputRef.current) coverInputRef.current.value = '';
    };
    reader.onerror = () => {
      toast.error('Gagal membaca file foto.');
      if (coverInputRef.current) coverInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedDataUrl: string) => {
    setIsUploadingCover(true);
    const loadingToastId = toast.loading('Menyimpan foto cover (resolusi penuh tajam)...');

    try {
      // Simpan langsung hasil crop beresolusi penuh tanpa downscaling
      const updated = await updateProfile({
        coverPhotoUrl: croppedDataUrl,
      });

      if (updated) {
        setProfile((prev) =>
          prev ? { ...prev, coverPhotoUrl: updated.coverPhotoUrl || croppedDataUrl } : null
        );
        updateCurrentProfileState({ coverPhotoUrl: updated.coverPhotoUrl || croppedDataUrl });
        toast.success('Foto cover profil berhasil dipotong dan diperbarui!', { id: loadingToastId });
      } else {
        throw new Error('Gagal menyimpan cover baru di server.');
      }
    } catch (err: any) {
      console.error('Error uploading cover photo:', err);
      toast.error(err?.message || 'Gagal mengubah foto cover. Silakan coba lagi.', {
        id: loadingToastId,
      });
    } finally {
      setIsUploadingCover(false);
      setCropImageSrc(null);
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (requestedTab === 'posts') {
      setActiveTab('posts');
    } else if (requestedTab === 'seller') {
      setActiveTab('seller');
    } else if (requestedTab === 'about') {
      setActiveTab('about');
    }
  }, [requestedTab]);

  useEffect(() => {
    if (targetId) {
      loadProfileData();
    }
  }, [targetId]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch main profile immediately so UI can render in ~200ms
      const prof = await fetchProfileById(targetId);
      if (prof) {
        setProfile(prof);
        setIsLoading(false);

        if (typeof prof.isFollowing === 'boolean') {
          setIsFollowing(prof.isFollowing);
        }
        if ((prof as any).followersCount !== undefined) {
          setFollowersCount((prof as any).followersCount);
          setFollowingCount((prof as any).followingCount);
        }
      }

      // 2. Fetch posts, products, and shops concurrently in background
      Promise.all([
        fetchPosts(undefined, targetId),
        fetchProducts(undefined, undefined, targetId),
        fetchShops(targetId),
        (!prof || (prof as any).followersCount === undefined) ? fetchFollowStatus(targetId) : Promise.resolve(null),
      ]).then(([posts, prods, shops, followStatus]) => {
        if (posts) {
          const regularPosts = posts.filter((p) => p.type !== 'shop_share');
          const shopPosts = posts.filter((p) => p.type === 'shop_share');
          setUserPosts(regularPosts);
          setSellerPosts(shopPosts);
        }
        if (prods) {
          setUserProducts(prods || []);
        }
        if (shops && shops.length > 0) {
          setUserShop(shops[0]);
        } else {
          setUserShop(null);
        }
        if (followStatus) {
          setIsFollowing(followStatus.isFollowing);
          setFollowersCount(followStatus.followersCount);
          setFollowingCount(followStatus.followingCount);
        }
      }).catch((err) => {
        console.warn('Background profile tab data error:', err);
      });
    } catch {
      toast.error('Gagal memuat profil alumni.');
      setIsLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('Silakan masuk terlebih dahulu.');
      return;
    }

    if (isFollowing && profile?.fullName) {
      const confirmed = window.confirm(
        `Apakah Anda yakin ingin berhenti mengikuti ${profile.fullName}?`
      );
      if (!confirmed) return;
    }

    try {
      const res: any = await toggleFollow(targetId);
      if (res) {
        setIsFollowing(res.isFollowing);
        setFollowersCount(res.followersCount);
        setFollowingCount(res.followingCount);
        toast.success(
          res.isFollowing
            ? `Mulai mengikuti ${profile?.fullName || 'alumni'}`
            : `Berhenti mengikuti ${profile?.fullName || 'alumni'}`
        );
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
        <div
          onClick={() => {
            if (profile.coverPhotoUrl) {
              setPreviewImage({
                src: profile.coverPhotoUrl,
                title: `Foto Sampul: ${profile.fullName}`,
                subtitle: `${profile.className || 'Alumni 59'} (Angkatan 1999)`,
              });
            }
          }}
          className={`w-full h-44 sm:h-52 bg-gradient-to-r from-brand-primary to-brand-primaryDeep relative overflow-hidden group ${
            profile.coverPhotoUrl ? 'cursor-pointer' : ''
          }`}
          title={profile.coverPhotoUrl ? 'Klik untuk melihat foto sampul lebih besar' : undefined}
        >
          {profile.coverPhotoUrl ? (
            <img
              src={profile.coverPhotoUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20 text-white font-black text-4xl select-none">
              SMAN 59 JAKARTA ’99
            </div>
          )}

          {/* Tombol Ubah Cover di Bagian Kanan Bawah Foto Cover (Hanya untuk Pemilik Profil) */}
          {isMe && (
            <div
              className="absolute bottom-3 right-3 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                id="profile-cover-file-input"
                onChange={handleCoverChange}
                disabled={isUploadingCover}
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
                className="px-3.5 py-1.5 rounded-xl bg-black/65 hover:bg-black/85 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg border border-white/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-75 cursor-pointer"
                title="Klik untuk mengubah foto cover profil"
              >
                {isUploadingCover ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-white" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <Camera size={14} className="text-white" />
                    <span>Ubah Cover</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Avatar & Floating Actions */}
        <div className="px-4 flex items-end justify-between -mt-12 relative z-10">
          <button
            type="button"
            onClick={() => {
              if (profile.profilePhotoUrl) {
                setPreviewImage({
                  src: profile.profilePhotoUrl,
                  title: `Foto Profil: ${profile.fullName}`,
                  subtitle: `${profile.className || 'Alumni 59'} (Angkatan 1999)`,
                });
              }
            }}
            className="p-1 bg-white rounded-full shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer relative group focus:outline-none focus:ring-2 focus:ring-brand-primary"
            title="Klik untuk melihat foto profil lebih besar"
          >
            <AppAvatar
              src={profile.profilePhotoUrl}
              name={profile.fullName}
              size="xl"
            />
            {profile.profilePhotoUrl && (
              <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold">
                <Eye size={20} className="drop-shadow-md" />
              </div>
            )}
          </button>

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
                <Link
                  href="/change-password"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Ubah Kata Sandi Akun"
                >
                  <KeyRound size={16} />
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
        </div>
      </div>

      {/* 2. User Bio & Details */}
      <div className="px-4 pt-3 pb-4 bg-white border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            {profile.fullName}
          </h1>
          <ProfileCategoryBadge category={profile.profileCategory} size={18} showLabel />
          {profile.isTempPublic && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
              <Clock size={11} />
              Akses Terbuka Sementara
            </span>
          )}
        </div>

        {profile.nickname && (
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Panggilan: <span className="font-semibold text-slate-700">"{profile.nickname}"</span>
          </p>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs font-bold text-brand-primary bg-blue-50 px-2.5 py-0.5 rounded-md flex items-center gap-1">
            <GraduationCap size={13} />
            <span>Kelas {profile.className || 'SMAN 59'} (1999)</span>
          </span>
          {profile.gender && (
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              {profile.gender}
            </span>
          )}
          {profile.maritalStatus && (!profile.hideMaritalStatus || isMe) && (
            <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span>{profile.maritalStatus}</span>
              {profile.hideMaritalStatus && isMe && (
                <span className="text-[9px] text-amber-700 bg-amber-100 px-1 py-0.2 rounded font-semibold flex items-center gap-0.5">
                  <EyeOff size={9} /> Disembunyikan
                </span>
              )}
            </span>
          )}
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
          <button
            onClick={() => {
              setFollowModalTab('followers');
              setIsFollowModalOpen(true);
            }}
            className="text-left group cursor-pointer hover:opacity-80 transition-opacity"
            title="Lihat daftar pengikut"
          >
            <span className="font-extrabold text-slate-900 group-hover:text-brand-primary transition-colors">
              {followersCount}
            </span>{' '}
            <span className="text-slate-500 group-hover:text-slate-700 underline decoration-slate-300 underline-offset-2">
              Pengikut
            </span>
          </button>

          <button
            onClick={() => {
              setFollowModalTab('following');
              setIsFollowModalOpen(true);
            }}
            className="text-left group cursor-pointer hover:opacity-80 transition-opacity"
            title="Lihat alumni yang diikuti"
          >
            <span className="font-extrabold text-slate-900 group-hover:text-brand-primary transition-colors">
              {followingCount}
            </span>{' '}
            <span className="text-slate-500 group-hover:text-slate-700 underline decoration-slate-300 underline-offset-2">
              Mengikuti
            </span>
          </button>

          <div>
            <span className="font-extrabold text-slate-900">{userPosts.length}</span>{' '}
            <span className="text-slate-500">Postingan</span>
          </div>
        </div>
      </div>

      {/* Incomplete Profile Reminder Alert */}
      {isMe && (!profile.isComplete || (profile.completionPercentage !== undefined && profile.completionPercentage < 100)) && (
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <IncompleteProfileReminderBanner profile={profile} />
        </div>
      )}

      {/* 3. Tab Bar: Kanal Profil, Postingan, & Lapak Seller 99 */}
      <div className="flex items-center border-b border-slate-200 bg-white sticky top-14 z-20 shadow-2xs">
        <button
          onClick={() => setActiveTab('about')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'about'
              ? 'border-brand-primary text-brand-primary bg-blue-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database size={14} />
          <span className="hidden sm:inline">Kanal Profil (Database)</span>
          <span className="sm:hidden">Database</span>
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'posts'
              ? 'border-brand-primary text-brand-primary bg-blue-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Grid size={14} />
          <span>Postingan ({userPosts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('seller')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'seller'
              ? 'border-amber-600 text-amber-600 bg-amber-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Store size={14} />
          <span>Lapak Seller 99 ({userProducts.length + sellerPosts.length})</span>
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
        ) : activeTab === 'seller' ? (
          /* DEDICATED SELLER COLUMN */
          <div className="space-y-4">
            {/* 1. Shop Header Card (if user has shop) */}
            {userShop ? (
              <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-amber-700/60 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-8 opacity-10 text-white pointer-events-none">
                  <Store size={160} />
                </div>

                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-300/30 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Store size={12} />
                      <span>Lapak Seller Resmi Forsil 99</span>
                    </span>
                    {userShop.isDonator && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-400/20 border border-emerald-300/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                        <Heart size={11} className="fill-emerald-300" />
                        <span>Donatur Kas Sosial Forsil 99</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white leading-tight flex items-center gap-2">
                      <span>{userShop.name}</span>
                    </h3>
                    <p className="text-xs text-amber-100 mt-1 leading-relaxed">
                      {userShop.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-100">
                    {userShop.address && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin size={13} className="text-amber-300 flex-shrink-0" />
                        <span className="truncate">{userShop.address}</span>
                      </div>
                    )}
                    {(userShop.contactPhone || profile.whatsappNumber) && (
                      <div className="flex items-center gap-1.5">
                        <Phone size={13} className="text-emerald-400 flex-shrink-0" />
                        <span className="font-mono">{userShop.contactPhone || profile.whatsappNumber}</span>
                      </div>
                    )}
                  </div>

                  {userShop.isDonator && userShop.donationNote && (
                    <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-[11px] text-amber-100 flex items-center gap-2">
                      <Heart size={14} className="text-rose-400 fill-rose-400 flex-shrink-0" />
                      <span>
                        Komitmen Donasi: <strong>{userShop.donationNote}</strong>
                      </span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                    {(userShop.contactPhone || profile.whatsappNumber) ? (
                      <a
                        href={getWhatsAppUrl(userShop.contactPhone || profile.whatsappNumber)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
                      >
                        <Phone size={13} />
                        <span>Chat WhatsApp Lapak</span>
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span />
                    )}

                    {isMe && (
                      <button
                        onClick={() => setIsSellerModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <Edit3 size={13} />
                        <span>Edit Info Toko</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* 2. Invitation Banner if user is Me and does NOT have a shop yet */}
            {!userShop && isMe && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-200 shadow-sm text-center space-y-3.5">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                  <Store size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base">
                    Buka Lapak Usaha & Jasa Anda di Seller 99
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    Dukung perputaran ekonomi sesama rekan alumni SMAN 59. Promosikan produk kuliner, fashion, gadget, atau jasa profesional Anda langsung ke seluruh rekan angkatan '99.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] text-slate-500 font-medium">
                  <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 flex items-center gap-1 text-slate-700">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Data Alumni Lengkap
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 flex items-center gap-1 text-slate-700">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Minimal Connected Alumni
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 flex items-center gap-1 text-slate-700">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Validasi Tim Lapak 99
                  </span>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => setIsSellerModalOpen(true)}
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all inline-flex items-center gap-2 active:scale-95 shadow-amber-600/20"
                  >
                    <Store size={15} />
                    <span>Gabung Jadi Seller 99</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Products Grid & Seller Posts */}
            <div className="space-y-4">
              {userProducts.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <ShoppingBag size={14} className="text-amber-600" />
                      <span>Etalase Produk ({userProducts.length})</span>
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {userProducts.map((prod) => (
                      <ProductCard key={prod.id} product={prod} />
                    ))}
                  </div>
                </div>
              )}

              {sellerPosts.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-600" />
                    <span>Postingan Promosi Lapak ({sellerPosts.length})</span>
                  </h4>
                  <div className="space-y-3">
                    {sellerPosts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Empty state when no products and no seller posts */}
              {userProducts.length === 0 && sellerPosts.length === 0 && (
                userShop ? (
                  <EmptyState
                    icon={<Store size={28} />}
                    title="Belum ada produk atau jasa aktif"
                    description={`${profile.fullName} telah terdaftar sebagai Seller 99 namun belum memposting produk di etalase.`}
                  />
                ) : !isMe ? (
                  <EmptyState
                    icon={<Store size={28} />}
                    title="Belum Membuka Lapak di Seller 99"
                    description={`${profile.fullName} belum mendaftarkan toko atau memposting produk di direktori Seller 99.`}
                  />
                ) : null
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Professional Alumni Database Card Header (Buku Induk Registri) */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-primaryDeep text-white rounded-3xl p-5 shadow-lg border border-slate-700/60 relative overflow-hidden">
              {/* Official Watermark */}
              <div className="absolute -right-6 -bottom-8 opacity-10 text-white pointer-events-none">
                <GraduationCap size={160} />
              </div>

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-300/30 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Database size={12} />
                      <span>Buku Induk Registri Alumni</span>
                    </span>
                    <span className="text-[11px] text-slate-300 font-medium">SMAN 59 Jakarta ’99</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 text-slate-200">
                    <span>NIA:</span>
                    <strong className="text-white font-black">{profile.nia || '-'}</strong>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white leading-tight flex items-center gap-2 flex-wrap">
                    <span>{profile.fullName}</span>
                    <ProfileCategoryBadge category={profile.profileCategory} size={18} showLabel />
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Kelas {profile.className || 'SMAN 59'} • Lulusan Tahun 1999 (Angkatan Perak)
                  </p>
                </div>

                {/* Verification status footer inside header card */}
                <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 size={14} />
                    <span>Terdaftar & Terverifikasi Resmi di Forsil 99</span>
                  </div>
                  <div className="text-slate-300 text-[11px] flex items-center gap-1">
                    <Shield size={12} className="text-emerald-400" />
                    <span>Kepatuhan UU PDP No. 27/2022</span>
                  </div>
                </div>
              </div>
            </div>

            {/* A. OWNER PERSPECTIVE: Open all profile fields for user viewing their own profile */}
            {isMe ? (
              <div className="p-3.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-2xs flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-primary text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <Database size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Buku Induk Registri Profil Anda</p>
                    <p className="text-[11px] text-slate-600">
                      Sebagai pemilik akun, seluruh data terbuka lengkap untuk Anda. Rekan alumni lain melihat data Anda sesuai pembatasan kategori:{' '}
                      <span className="font-bold text-brand-primary capitalize">{profile.profileCategory?.replace('_', ' ')}</span>.
                    </p>
                  </div>
                </div>
                <Link
                  href="/profile/edit"
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Edit3 size={13} />
                  <span>Atur Profil & Privasi</span>
                </Link>
              </div>
            ) : (
              /* B. VISITOR PERSPECTIVE: Inform about visibility status */
              profile.canViewDetails !== false && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  <p className="text-[11px] leading-snug">
                    {profile.profileCategory === 'open' || profile.profileCategory === 'super_extrov'
                      ? 'Kanal profil ini dibuka untuk seluruh rekan alumni terverifikasi (Kategori Open Alumni).'
                      : 'Kanal profil ini dibuka khusus untuk rekan yang saling mengikuti (Kategori Connected Alumni).'}
                  </p>
                </div>
              )
            )}

            {/* C. VISITOR RESTRICTION GATE: If not owner and profile details are restricted */}
            {!isMe && profile.canViewDetails === false ? (
              <div className="space-y-4">
                {profile.privacyRestriction === 'followers_only' ? (
                  /* Connected Alumni: Followers Only Lock Card */
                  <div className="bg-blue-50/60 border border-blue-200 rounded-3xl p-6 text-center space-y-4 shadow-xs">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100 text-brand-primary flex items-center justify-center shadow-xs">
                      <Lock size={26} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                        <BadgeCheck size={14} className="text-blue-600" />
                        <span>Kategori Connected Alumni (Khusus Pengikut)</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">Detail Database Alumni Terkunci</h3>
                      <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                        {profile.fullName} hanya membagikan nomor kontak WhatsApp, tanggal lahir, dan alamat domisili kepada rekan alumni yang mem-follow akunnya.
                      </p>
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={handleToggleFollow}
                        className="px-6 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-bold shadow hover:bg-brand-primaryDark transition-all inline-flex items-center gap-2 active:scale-95"
                      >
                        <UserPlus size={15} />
                        <span>Ikuti {profile.nickname || profile.fullName} untuk Membuka Detail</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Introv: Private Profile Lock Card */
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 text-center space-y-3 shadow-xs">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center">
                      <Lock size={26} />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                      <CheckCircle2 size={14} className="text-slate-500" />
                      <span>Kategori Private Alumni (Profil Privat)</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Detail Kontak & Domisili Dirahasiakan</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Alumni ini memilih untuk mengunci kontak dan alamat domisili dalam database alumni (Mode Privat) sesuai kebijakan privasi Forsil 99.
                    </p>
                  </div>
                )}

                {/* Masked Preview of Public Directory Record */}
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-subtle space-y-3 text-xs opacity-80">
                  <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <User size={14} className="text-brand-primary" />
                    <span>I. Data Pokok Siswa (Pratinjau Publik)</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Nama Lengkap</span>
                      <span className="font-semibold text-slate-800">{profile.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Kelas di SMAN 59</span>
                      <span className="font-semibold text-slate-800">{profile.className || '1999'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Profesi Saat Ini</span>
                      <span className="font-semibold text-slate-800">{profile.occupation || 'Alumni'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Nomor Kontak & Alamat</span>
                      <span className="font-semibold text-slate-400 italic flex items-center gap-1">
                        <Lock size={12} /> Terkunci
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* D. UNLOCKED FULL DATABASE DOSSIER (Visible for isMe OR unrestricted visitors) */
              <div className="space-y-4">
                {/* 1. Data Identitas Pokok Siswa / Alumni */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 text-brand-primary flex items-center justify-center">
                        <User size={14} />
                      </div>
                      <span>I. DATA IDENTITAS POKOK ALUMNI (BUKU INDUK)</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      REG-1999
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[11px] block">Nama Lengkap Resmi</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">{profile.fullName}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[11px] block">Nama Panggilan / Alias</span>
                      <span className="font-semibold text-slate-800 text-xs block mt-0.5">
                        {profile.nickname ? `"${profile.nickname}"` : '-'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[11px] block">Nomor Induk Alumni (NIA)</span>
                      <span className="font-mono font-bold text-brand-primary text-xs block mt-0.5">
                        {profile.nia || '-'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[11px] block">Kelas & Angkatan</span>
                      <span className="font-semibold text-slate-800 text-xs block mt-0.5">
                        Kelas {profile.className || 'SMAN 59'} (Lulusan 1999)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px] block">Tanggal Lahir</span>
                        {profile.hideBirthDate && isMe && (
                          <span className="text-[9px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-0.5">
                            <EyeOff size={9} /> Disembunyikan
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5 mt-0.5">
                        <Cake size={13} className="text-amber-500 flex-shrink-0" />
                        {profile.birthDate ? (
                          <>
                            <span>{formatBirthDate(profile.birthDate) || 'Belum diisi'}</span>
                            {calculateAge(profile.birthDate) && (
                              <span className="text-slate-400 font-normal">{calculateAge(profile.birthDate)}</span>
                            )}
                          </>
                        ) : profile.hideBirthDate ? (
                          <span className="text-slate-400 font-normal italic flex items-center gap-1">
                            <EyeOff size={11} className="text-slate-400 flex-shrink-0" /> Disembunyikan oleh pemilik akun
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Belum diisi</span>
                        )}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[11px] block">Jenis Kelamin</span>
                      <span className="font-semibold text-slate-800 text-xs block mt-0.5">
                        {profile.gender || 'Belum diisi'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px] block">Status Pernikahan</span>
                        {profile.hideMaritalStatus && isMe && (
                          <span className="text-[9px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-0.5">
                            <EyeOff size={9} /> Disembunyikan
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5 mt-0.5">
                        <Heart size={13} className="text-rose-500 flex-shrink-0" />
                        {profile.maritalStatus ? (
                          <span>{profile.maritalStatus}</span>
                        ) : profile.hideMaritalStatus ? (
                          <span className="text-slate-400 font-normal italic flex items-center gap-1">
                            <EyeOff size={11} className="text-slate-400 flex-shrink-0" /> Disembunyikan oleh pemilik akun
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Belum diisi</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Data Kontak Resmi & Domisili Terkini */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <MapPin size={14} />
                      </div>
                      <span>II. DATA KONTAK RESMI & DOMISILI TERKINI</span>
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Nomor WhatsApp Resmi</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {profile.whatsappNumber || 'Tidak ditampilkan'}
                        </span>
                      </div>
                      {profile.whatsappNumber && (
                        <a
                          href={getWhatsAppUrl(profile.whatsappNumber)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
                        >
                          <Phone size={13} />
                          <span>Chat WhatsApp</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 text-[11px] block">Alamat Domisili Lengkap</span>
                        <span className="font-semibold text-slate-800 leading-relaxed block mt-0.5">
                          {profile.currentAddress || 'Belum diisi'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 text-[11px] block">Kota / Wilayah Domisili</span>
                        <span className="font-semibold text-slate-800 text-xs block mt-0.5">
                          {formatLocation(profile.city, profile.province)}
                        </span>
                      </div>
                    </div>

                    {(profile.email || (isMe && user?.email)) && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-400 text-[11px] block">Alamat Email Terdaftar</span>
                        <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5 mt-0.5">
                          <Mail size={13} className="text-brand-primary flex-shrink-0" />
                          <span>{profile.email || user?.email}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Profil Karir & Profesional */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Briefcase size={14} />
                      </div>
                      <span>III. KARIR & PROFESIONAL ALUMNI</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[11px] block">Pekerjaan / Profesi Saat Ini</span>
                      <span className="font-bold text-slate-900 text-xs block mt-0.5">
                        {profile.occupation || 'Belum diisi'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 text-[11px] block">Nama Instansi / Perusahaan</span>
                      <span className="font-semibold text-slate-800 text-xs block mt-0.5">
                        {profile.company || 'Belum diisi'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Minat, Hobi & Silaturahmi */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Sparkles size={14} />
                      </div>
                      <span>IV. MINAT, HOBI & SILATURAHMI</span>
                    </h4>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] block mb-1.5 font-medium">Hobi & Kegemaran:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.hobbies && profile.hobbies.length > 0 ? (
                        profile.hobbies.map((h, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs font-semibold"
                          >
                            {h}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Belum diisi</span>
                      )}
                    </div>
                  </div>

                  {profile.skills && profile.skills.length > 0 && (
                    <div className="pt-2 border-t border-slate-50">
                      <span className="text-slate-400 text-[11px] block mb-1.5 font-medium">Keahlian Tambahan:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skills.map((s, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.bio && (
                    <div className="pt-2 border-t border-slate-50">
                      <span className="text-slate-400 text-[11px] block mb-1 font-medium">Bio Silaturahmi:</span>
                      <p className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-line italic">
                        "{profile.bio}"
                      </p>
                    </div>
                  )}
                </div>

                {/* 5. Kanal Media Sosial & Kepatuhan */}
                {(profile.socialLinks?.instagram || profile.socialLinks?.linkedin) && (
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle space-y-3 text-xs">
                    <h4 className="font-bold text-slate-900 text-xs">
                      V. JEJARING MEDIA SOSIAL ALUMNI
                    </h4>
                    <div className="flex items-center gap-3 flex-wrap">
                      {profile.socialLinks?.instagram && (
                        <a
                          href={`https://instagram.com/${profile.socialLinks.instagram}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-pink-600 font-bold hover:underline bg-pink-50 px-3.5 py-2 rounded-xl text-xs border border-pink-100"
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
                          className="flex items-center gap-2 text-blue-700 font-bold hover:underline bg-blue-50 px-3.5 py-2 rounded-xl text-xs border border-blue-100"
                        >
                          <Linkedin size={16} />
                          <span>Profil LinkedIn</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Followers & Following Detail Modal */}
      <FollowListModal
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        targetUserId={targetId}
        targetUserName={profile.fullName}
        initialTab={followModalTab}
        onCountChange={async () => {
          const status = await fetchFollowStatus(targetId);
          if (status) {
            setIsFollowing(status.isFollowing);
            setFollowersCount(status.followersCount);
            setFollowingCount(status.followingCount);
          }
        }}
      />

      {/* Seller Registration Modal */}
      <SellerRegistrationModal
        isOpen={isSellerModalOpen}
        onClose={() => setIsSellerModalOpen(false)}
        initialShop={userShop}
        onSuccess={(newShop) => {
          setUserShop(newShop);
          loadProfileData();
        }}
      />

      {/* 5. Image Preview Modal (Lihat foto profil & foto cover lebih besar) */}
      <ImageViewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        src={previewImage?.src}
        title={previewImage?.title}
        subtitle={previewImage?.subtitle}
      />

      {/* 6. Modal Cropping Foto Cover Sesuai Ukuran Cover */}
      <CoverCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => {
          setIsCropModalOpen(false);
          setCropImageSrc(null);
          if (coverInputRef.current) coverInputRef.current.value = '';
        }}
        onCropComplete={handleCropComplete}
        aspectRatio={2.5}
        title="Sesuaikan Area Potong Cover Profil"
      />
    </div>
  );
}
