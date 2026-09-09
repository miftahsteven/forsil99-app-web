'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Trash2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchStories, createStory, deleteStory } from '@/services/postService';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { AppButton } from '@/components/ui/AppButton';
import { toast } from 'sonner';
import { compressImage } from '@/utils/imageCompressor';

interface StoryItem {
  id: string;
  authorId: string;
  authorName: string;
  authorNickname?: string;
  authorPhotoUrl?: string;
  authorClass?: string;
  authorCategory?: string;
  isOwner: boolean;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  caption?: string;
  visibility?: string;
  createdAt: string;
  expiresAt: string;
}

interface UserStoryGroup {
  authorId: string;
  authorName: string;
  authorNickname?: string;
  authorPhotoUrl?: string;
  authorClass?: string;
  authorCategory?: string;
  isOwner: boolean;
  latestCreatedAt: string;
  items: StoryItem[];
}

export function StoryBar() {
  const { user, profile } = useAuth();
  const [stories, setStories] = useState<StoryItem[]>([]);

  // Active Story Group & Segment state
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);

  // Flow Kirim Story states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [storyCaption, setStoryCaption] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Hapus Story states
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    const data = await fetchStories();
    setStories(data || []);
  };

  // 1. Group stories per alumni account (authorId)
  const storyGroups: UserStoryGroup[] = useMemo(() => {
    const map = new Map<string, UserStoryGroup>();

    stories.forEach((story) => {
      const key = story.authorId;
      const isMyStory =
        story.isOwner ||
        story.authorId === user?.id ||
        story.authorId === profile?.uid;

      if (!map.has(key)) {
        map.set(key, {
          authorId: story.authorId,
          authorName: isMyStory
            ? (profile?.fullName || story.authorName || 'Cerita Anda')
            : (story.authorName || 'Alumni 59'),
          authorNickname: story.authorNickname,
          authorPhotoUrl: isMyStory
            ? (profile?.profilePhotoUrl || story.authorPhotoUrl)
            : story.authorPhotoUrl,
          authorClass: isMyStory
            ? (profile?.className || story.authorClass)
            : story.authorClass,
          authorCategory: isMyStory
            ? (profile?.profileCategory || story.authorCategory)
            : story.authorCategory,
          isOwner: isMyStory,
          latestCreatedAt: story.createdAt,
          items: [],
        });
      }

      const grp = map.get(key)!;
      grp.items.push(story);
      if (new Date(story.createdAt).getTime() > new Date(grp.latestCreatedAt).getTime()) {
        grp.latestCreatedAt = story.createdAt;
      }
    });

    // Urutkan item tiap user dari lama ke baru (kronologis seperti Instagram/WhatsApp)
    map.forEach((grp) => {
      grp.items.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });

    return Array.from(map.values());
  }, [stories, user?.id, profile]);

  // Kelompokkan cerita milik user yang sedang login
  const myGroup = useMemo(() => {
    return (
      storyGroups.find(
        (g) => g.isOwner || g.authorId === user?.id || g.authorId === profile?.uid
      ) || null
    );
  }, [storyGroups, user?.id, profile]);

  // Kelompokkan cerita milik alumni lain (diurutkan dari yang terbaru posting)
  const otherGroups = useMemo(() => {
    return storyGroups
      .filter(
        (g) => !g.isOwner && g.authorId !== user?.id && g.authorId !== profile?.uid
      )
      .sort(
        (a, b) =>
          new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime()
      );
  }, [storyGroups, user?.id, profile]);

  // Seluruh grup gabungan untuk navigasi viewer (Saya di awal jika ada, lalu alumni lain)
  const allDisplayGroups = useMemo(() => {
    const list: UserStoryGroup[] = [];
    if (myGroup) list.push(myGroup);
    list.push(...otherGroups);
    return list;
  }, [myGroup, otherGroups]);

  const hasMyActiveStory = Boolean(myGroup && myGroup.items.length > 0);

  // Step 1: User selects image
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Sementara baru bisa kirim story gambar/foto.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageBase64(reader.result as string);
      setStoryCaption('');
      setIsCreateModalOpen(true);
    };
    reader.onerror = () => {
      toast.error('Gagal membaca file foto.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Step 2: User confirms publishing story with caption
  const handlePublishStory = async () => {
    if (!selectedImageBase64) return;

    setIsUploading(true);
    try {
      const compressed = await compressImage(selectedImageBase64, {
        imageCount: 1,
        maxDimension: 1200,
        quality: 0.8,
      });

      await createStory({
        mediaUrl: compressed,
        mediaType: 'image',
        caption: storyCaption.trim() || undefined,
      });

      toast.success('Cerita berhasil dibagikan!');
      setIsCreateModalOpen(false);
      setSelectedImageBase64(null);
      setStoryCaption('');
      await loadStories();
    } catch (err: any) {
      toast.error(err.message || 'Gagal membagikan cerita.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelCreate = () => {
    setIsCreateModalOpen(false);
    setSelectedImageBase64(null);
    setStoryCaption('');
  };

  // Hapus Story
  const handleDeleteStory = async (storyId: string) => {
    if (!storyId) return;

    setIsDeleting(true);
    try {
      await deleteStory(storyId);
      toast.success('Cerita berhasil dihapus.');
      setConfirmDeleteId(null);

      // Jika grup ini hanya punya 1 cerita, tutup viewer
      if (
        activeGroupIndex !== null &&
        allDisplayGroups[activeGroupIndex]?.items.length <= 1
      ) {
        setActiveGroupIndex(null);
        setActiveItemIndex(0);
      } else if (activeItemIndex > 0) {
        setActiveItemIndex(activeItemIndex - 1);
      }

      await loadStories();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus cerita.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Relative time helper
  const formatTimeAgo = (isoDate?: string) => {
    if (!isoDate) return '';
    const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    return 'Hari ini';
  };

  // Navigation handlers for Story Viewer
  const handleViewerPrev = useCallback(() => {
    setConfirmDeleteId(null);
    if (activeGroupIndex === null) return;
    const currentGroup = allDisplayGroups[activeGroupIndex];
    if (!currentGroup) return;

    if (activeItemIndex > 0) {
      // Pindah ke slide sebelumnya pada author yang sama
      setActiveItemIndex((prev) => prev - 1);
    } else if (activeGroupIndex > 0) {
      // Pindah ke author sebelumnya (slide terakhirnya)
      const prevGroup = allDisplayGroups[activeGroupIndex - 1];
      setActiveGroupIndex(activeGroupIndex - 1);
      setActiveItemIndex(Math.max(0, prevGroup.items.length - 1));
    }
  }, [activeGroupIndex, activeItemIndex, allDisplayGroups]);

  const handleViewerNext = useCallback(() => {
    setConfirmDeleteId(null);
    if (activeGroupIndex === null) return;
    const currentGroup = allDisplayGroups[activeGroupIndex];
    if (!currentGroup) return;

    if (activeItemIndex < currentGroup.items.length - 1) {
      // Pindah ke slide selanjutnya pada author yang sama
      setActiveItemIndex((prev) => prev + 1);
    } else if (activeGroupIndex < allDisplayGroups.length - 1) {
      // Pindah ke author berikutnya (slide pertama)
      setActiveGroupIndex(activeGroupIndex + 1);
      setActiveItemIndex(0);
    } else {
      // Selesai seluruh cerita, tutup viewer
      setActiveGroupIndex(null);
      setActiveItemIndex(0);
    }
  }, [activeGroupIndex, activeItemIndex, allDisplayGroups]);

  // Keyboard navigation (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    if (activeGroupIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleViewerPrev();
      } else if (e.key === 'ArrowRight') {
        handleViewerNext();
      } else if (e.key === 'Escape') {
        setActiveGroupIndex(null);
        setActiveItemIndex(0);
        setConfirmDeleteId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGroupIndex, handleViewerPrev, handleViewerNext]);

  return (
    <>
      <div id="home-story-bar" className="bg-white px-3 py-3 border-b border-slate-100 shadow-subtle mb-3">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {/* 1. Add / View My Story Button (Grouped in 1 circle) */}
          <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
            <div className="relative">
              <input
                id="my-story-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                disabled={isUploading}
                onChange={handleFileSelect}
              />

              <div
                onClick={() => {
                  if (hasMyActiveStory) {
                    const myIdx = allDisplayGroups.findIndex(
                      (g) => g.authorId === myGroup?.authorId
                    );
                    setActiveGroupIndex(myIdx !== -1 ? myIdx : 0);
                    setActiveItemIndex(0);
                  } else {
                    document.getElementById('my-story-file-input')?.click();
                  }
                }}
                className="relative cursor-pointer"
              >
                <AppAvatar
                  src={profile?.profilePhotoUrl}
                  name={profile?.fullName || 'Saya'}
                  size="md"
                  hasStory={hasMyActiveStory}
                  className="group-hover:opacity-90 transition-opacity"
                />

                {/* Badge jumlah story saya jika lebih dari 1 */}
                {myGroup && myGroup.items.length > 1 && (
                  <span
                    className="absolute -top-1 -left-1 bg-amber-500 text-white text-[9.5px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white shadow-xs z-10"
                    title={`${myGroup.items.length} cerita Anda`}
                  >
                    {myGroup.items.length}
                  </span>
                )}
              </div>

              {/* Plus icon to upload new story */}
              <label
                htmlFor="my-story-file-input"
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-primary text-white rounded-full border-2 border-white flex items-center justify-center shadow cursor-pointer hover:scale-110 active:scale-95 transition-transform z-10"
                title="Tambah Cerita"
              >
                <Plus size={12} strokeWidth={3} />
              </label>
            </div>

            <span className="text-[11px] font-medium text-slate-700 mt-1.5 truncate max-w-[68px]">
              {hasMyActiveStory ? 'Cerita Anda' : 'Tambah Cerita'}
            </span>
          </div>

          {/* 2. Other Alumni Stories List — Disatukan per Akun (1 Akun = 1 Lingkaran) */}
          {otherGroups.map((group) => {
            const actualGroupIndex = allDisplayGroups.findIndex(
              (g) => g.authorId === group.authorId
            );
            const displayName =
              group.authorNickname || group.authorName?.split(' ')[0] || 'Alumni';

            return (
              <div
                key={group.authorId}
                onClick={() => {
                  setActiveGroupIndex(actualGroupIndex !== -1 ? actualGroupIndex : 0);
                  setActiveItemIndex(0);
                }}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer active:scale-95 transition-transform group"
              >
                <div className="relative">
                  <AppAvatar
                    src={group.authorPhotoUrl}
                    name={group.authorName || 'Alumni'}
                    size="md"
                    hasStory={true}
                    className="group-hover:opacity-90 transition-opacity"
                  />

                  {/* Badge indikator jika alumni ini memiliki lebih dari 1 cerita */}
                  {group.items.length > 1 && (
                    <span
                      className="absolute -top-1 -right-1 bg-brand-primary text-white text-[9.5px] font-bold px-1.5 py-0.2 rounded-full border-2 border-white shadow-xs z-10"
                      title={`${group.items.length} cerita aktif`}
                    >
                      {group.items.length}
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-medium text-slate-700 mt-1.5 truncate max-w-[68px]">
                  {displayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: Pratinjau & Buat Story Baru (dengan input caption, ganti foto, batal & kirim) */}
      {isCreateModalOpen && selectedImageBase64 && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto border border-slate-100 animate-scale-in">
            {/* Modal Header */}
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Bagikan Cerita 24 Jam</h3>
                <p className="text-[11px] text-slate-500">Tayang selama 1x24 jam untuk kawan alumni</p>
              </div>
              <button
                type="button"
                onClick={handleCancelCreate}
                disabled={isUploading}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                title="Tutup / Batal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Simple Information Notice */}
            <div className="bg-amber-50/90 border-b border-amber-100 px-4 py-2 text-[11.5px] text-amber-900 flex items-center gap-1.5">
              <span className="text-sm">💡</span>
              <span>Sementara baru bisa kirim story gambar/foto.</span>
            </div>

            {/* Image Preview & Caption Input */}
            <div className="p-4 space-y-3.5">
              <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                <img
                  src={selectedImageBase64}
                  alt="Pratinjau Foto Cerita"
                  className="w-full h-full object-contain"
                />
                <label
                  htmlFor="my-story-file-input"
                  className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/85 text-white text-[10.5px] font-semibold px-2.5 py-1 rounded-lg backdrop-blur-sm cursor-pointer transition-colors shadow"
                >
                  Ganti Foto
                </label>
              </div>

              {/* Caption Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Keterangan Foto (Caption)
                  </label>
                  <span className="text-[10.5px] text-slate-400">
                    {storyCaption.length}/150
                  </span>
                </div>
                <textarea
                  value={storyCaption}
                  onChange={(e) => setStoryCaption(e.target.value.slice(0, 150))}
                  placeholder="Ceritakan tentang foto ini (lagi di mana, kegiatan apa, dsb)..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none transition-all"
                  disabled={isUploading}
                  autoFocus
                />
              </div>

              {/* User Category Audience Guidance */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-[10.5px] text-slate-600 leading-snug">
                {profile?.profileCategory === 'super_extrov' || profile?.profileVisibility === 'public' ? (
                  <span className="text-amber-800 font-medium">
                    👑 Kategori <strong>Super Extrov</strong>: Cerita akan tampil ke seluruh rekan alumni Forsil 99.
                  </span>
                ) : profile?.profileCategory === 'extrov' || profile?.profileVisibility === 'followers' ? (
                  <span className="text-sky-800 font-medium">
                    🔷 Kategori <strong>Extrov</strong>: Cerita akan tampil untuk pengikut dan rekan sekelas Anda.
                  </span>
                ) : (
                  <span className="text-slate-600 font-medium">
                    ⚪ Kategori <strong>Introv</strong>: Cerita hanya tampil untuk lingkaran pertemanan terdekat Anda.
                  </span>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelCreate}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <AppButton
                variant="primary"
                size="sm"
                onClick={handlePublishStory}
                isLoading={isUploading}
                className="px-5 shadow-button"
              >
                Kirim Cerita
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Story Viewer Modal (Grouped Playback dengan Segment Progress Bar) */}
      {activeGroupIndex !== null && allDisplayGroups[activeGroupIndex] && (() => {
        const currentGroup = allDisplayGroups[activeGroupIndex];
        const currentItem =
          currentGroup.items[activeItemIndex] || currentGroup.items[0];
        if (!currentItem) return null;

        const isOwner = currentGroup.isOwner;
        const authorName = currentGroup.authorName;
        const authorClass = currentGroup.authorClass;
        const authorPhoto = currentGroup.authorPhotoUrl;
        const authorCategory = currentGroup.authorCategory;

        const hasPrev =
          activeItemIndex > 0 || activeGroupIndex > 0;
        const hasNext =
          activeItemIndex < currentGroup.items.length - 1 ||
          activeGroupIndex < allDisplayGroups.length - 1;

        return (
          <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-sm h-[84vh] max-h-[660px] bg-slate-900 rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xl select-none">
              {/* Segment Progress Bars di bagian atas (seperti Instagram Stories) */}
              <div className="absolute top-2 left-2 right-2 z-30 flex items-center gap-1.5 px-1">
                {currentGroup.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="h-1 flex-1 rounded-full overflow-hidden bg-white/30 backdrop-blur-xs"
                  >
                    <div
                      className={`h-full transition-all duration-200 ${
                        idx < activeItemIndex
                          ? 'w-full bg-white'
                          : idx === activeItemIndex
                          ? 'w-full bg-white shadow-xs'
                          : 'w-0 bg-transparent'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Header Info: Identitas Pemilik Story */}
              <div className="absolute top-0 left-0 right-0 pt-4 pb-3.5 px-3.5 bg-gradient-to-b from-black/85 via-black/50 to-transparent z-20 flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <AppAvatar
                    src={authorPhoto}
                    name={authorName}
                    size="xs"
                    className="border border-white/40 ring-1 ring-white/20 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold leading-tight truncate text-white drop-shadow-sm">
                        {authorName}
                      </p>
                      {isOwner && (
                        <span className="text-[9px] font-bold bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-full shadow-xs">
                          Anda
                        </span>
                      )}
                      {currentGroup.items.length > 1 && (
                        <span className="text-[9px] text-white/80 font-medium bg-white/20 px-1 rounded">
                          {activeItemIndex + 1}/{currentGroup.items.length}
                        </span>
                      )}
                      {authorCategory === 'super_extrov' && (
                        <span className="text-[10px]" title="Super Extrov (Terbuka untuk Semua)">
                          👑
                        </span>
                      )}
                      {authorCategory === 'extrov' && (
                        <span className="text-[10px]" title="Extrov (Pengikut & Sekelas)">
                          🔷
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-300 truncate mt-0.5">
                      {authorClass} • {formatTimeAgo(currentItem.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Right controls: Delete (if owner) & Close */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(currentItem.id)}
                      className="p-1.5 rounded-full bg-black/40 text-rose-300 hover:text-white hover:bg-rose-600/80 transition-colors"
                      title="Hapus Cerita Ini"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveGroupIndex(null);
                      setActiveItemIndex(0);
                      setConfirmDeleteId(null);
                    }}
                    className="p-1.5 rounded-full bg-black/40 text-white/90 hover:bg-black/60 transition-colors"
                    title="Tutup Cerita"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Area Media Konten */}
              <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
                {currentItem.mediaType === 'video' ? (
                  <video
                    src={currentItem.mediaUrl}
                    autoPlay
                    playsInline
                    controls
                    className="max-h-full max-w-full object-contain select-none"
                  />
                ) : (
                  <img
                    src={currentItem.mediaUrl}
                    alt={authorName}
                    className="max-h-full max-w-full object-contain select-none"
                  />
                )}

                {/* Invisible tap zones: Tap kiri untuk Prev, tap kanan untuk Next (Standar Story UX) */}
                <div
                  className="absolute top-16 bottom-20 left-0 w-1/3 z-10 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewerPrev();
                  }}
                  title="Cerita Sebelumnya"
                />
                <div
                  className="absolute top-16 bottom-20 right-0 w-2/3 z-10 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewerNext();
                  }}
                  title="Cerita Selanjutnya"
                />
              </div>

              {/* Caption */}
              {currentItem.caption && (
                <div className="p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white text-xs leading-relaxed text-center z-20">
                  <p className="bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-xl inline-block border border-white/10 max-w-[92%] shadow-sm">
                    {currentItem.caption}
                  </p>
                </div>
              )}

              {/* Navigation Arrows (Tombol navigasi samping) */}
              {hasPrev && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewerPrev();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/75 transition-colors z-30 shadow-md"
                  title="Cerita Sebelumnya"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {hasNext && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewerNext();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/75 transition-colors z-30 shadow-md"
                  title="Cerita Selanjutnya"
                >
                  <ChevronRight size={20} />
                </button>
              )}

              {/* Confirmation Popup Hapus Story */}
              {confirmDeleteId === currentItem.id && (
                <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-5 text-center max-w-[270px] space-y-3 shadow-2xl animate-scale-in">
                    <div className="w-11 h-11 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                      <Trash2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Hapus Cerita Ini?</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Cerita ini akan dihapus permanen dan tidak dapat dilihat lagi oleh kawan alumni.
                      </p>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isDeleting}
                        className="flex-1 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStory(currentItem.id)}
                        disabled={isDeleting}
                        className="flex-1 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors shadow-sm"
                      >
                        {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}
