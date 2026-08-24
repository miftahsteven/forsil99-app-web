'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createPost } from '@/services/postService';
import { PostType, ProfileVisibility } from '@/types';
import { AppButton } from '@/components/ui/AppButton';
import { AppAvatar } from '@/components/ui/AppAvatar';
import {
  Image as ImageIcon,
  History,
  Megaphone,
  HelpCircle,
  ShoppingBag,
  Sparkles,
  X,
  Globe,
  Users,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { compressImage, processPostImageFiles } from '@/utils/imageCompressor';

function CreatePostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = (searchParams?.get('type') as PostType) || 'standard';

  const { profile, isAuthenticated } = useAuth();

  const [postType, setPostType] = useState<PostType>(initialType);
  const [text, setText] = useState<string>('');
  const [visibility, setVisibility] = useState<ProfileVisibility>('verified_alumni');
  
  // Media attachments
  const [mediaList, setMediaList] = useState<{ type: 'image' | 'video'; url: string }[]>([]);
  const [isProcessingMedia, setIsProcessingMedia] = useState<boolean>(false);
  
  // Nostalgia metadata
  const [isThenAndNow, setIsThenAndNow] = useState<boolean>(postType === 'memory');
  const [memoryYear, setMemoryYear] = useState<number>(1999);
  const [thenPhotoUrl, setThenPhotoUrl] = useState<string>('');
  const [nowPhotoUrl, setNowPhotoUrl] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingMedia(true);
    try {
      const fileArray = Array.from(files);
      const processed = await processPostImageFiles(fileArray, mediaList.length);
      setMediaList((prev) => [...prev, ...processed]);
      toast.success(`${processed.length} media berhasil ditambahkan.`);
    } catch (err: any) {
      toast.error('Gagal memproses gambar: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setIsProcessingMedia(false);
      // Reset input value to allow re-selection
      e.target.value = '';
    }
  };

  const handleThenPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { imageCount: 2 });
      setThenPhotoUrl(compressed);
    } catch (err: any) {
      toast.error('Gagal memproses foto: ' + err.message);
    }
  };

  const handleNowPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { imageCount: 2 });
      setNowPhotoUrl(compressed);
    } catch (err: any) {
      toast.error('Gagal memproses foto: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && mediaList.length === 0 && !thenPhotoUrl) {
      toast.error('Tuliskan cerita atau lampirkan foto sebelum memposting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPost({
        text: text.trim(),
        type: postType,
        visibility,
        media: mediaList,
        memoryMeta:
          postType === 'memory'
            ? {
                year: memoryYear,
                isThenAndNow,
                thenPhotoUrl: thenPhotoUrl || undefined,
                nowPhotoUrl: nowPhotoUrl || undefined,
              }
            : undefined,
      });

      toast.success('Postingan berhasil dibagikan!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Gagal membagikan postingan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full px-3 py-4">
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card">
        {/* Author Header & Privacy selector */}
        <div className="flex items-center gap-3 mb-4">
          <AppAvatar
            src={profile?.profilePhotoUrl}
            name={profile?.fullName || 'Saya'}
            size="md"
          />
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              {profile?.fullName || 'Alumni SMAN 59'}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-semibold text-brand-primary bg-blue-50 px-2 py-0.2 rounded">
                {profile?.className || 'Alumni ’99'}
              </span>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as ProfileVisibility)}
                className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border-0 focus:outline-none"
              >
                <option value="verified_alumni">Semua Alumni 99</option>
                <option value="same_class">Teman Sekelas Saja</option>
                <option value="only_me">Hanya Saya</option>
              </select>
            </div>
          </div>
        </div>

        {/* Post Type Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3">
          {[
            { type: 'standard', label: 'Cerita Biasa', icon: Sparkles },
            { type: 'memory', label: 'Kenangan ’99', icon: History },
            { type: 'announcement', label: 'Pengumuman', icon: Megaphone },
            { type: 'help', label: 'Bantuan & Loker', icon: HelpCircle },
            { type: 'shop_share', label: 'Promosi Usaha', icon: ShoppingBag },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = postType === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => setPostType(item.type as PostType)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Nostalgia Year & Then/Now Toggle Box */}
        {postType === 'memory' && (
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 mb-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <Sparkles size={14} /> Kapsul Waktu Nostalgia
              </span>
              <select
                value={memoryYear}
                onChange={(e) => setMemoryYear(Number(e.target.value))}
                className="text-xs font-bold bg-white text-amber-900 border border-amber-300 rounded-lg px-2 py-1"
              >
                <option value={1996}>Tahun 1996 (Kelas 1)</option>
                <option value={1997}>Tahun 1997 (Kelas 2)</option>
                <option value={1998}>Tahun 1998 (Kelas 3)</option>
                <option value={1999}>Tahun 1999 (Kelulusan)</option>
              </select>
            </div>

            {/* Then & Now Uploaders */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="flex flex-col items-center">
                <label className="w-full h-32 border-2 border-dashed border-amber-300 rounded-xl flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-amber-100/40 relative overflow-hidden">
                  {thenPhotoUrl ? (
                    <img src={thenPhotoUrl} alt="Dulu" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <History size={20} className="mx-auto text-amber-600 mb-1" />
                      <span className="text-[11px] font-bold text-amber-900 block">Foto DULU ({memoryYear})</span>
                      <span className="text-[9px] text-slate-400">Klik untuk upload</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleThenPhoto} className="hidden" />
                </label>
              </div>

              <div className="flex flex-col items-center">
                <label className="w-full h-32 border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-blue-100/40 relative overflow-hidden">
                  {nowPhotoUrl ? (
                    <img src={nowPhotoUrl} alt="Sekarang" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <Sparkles size={20} className="mx-auto text-blue-600 mb-1" />
                      <span className="text-[11px] font-bold text-blue-900 block">Foto SEKARANG</span>
                      <span className="text-[9px] text-slate-400">Klik untuk upload</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleNowPhoto} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Text Input */}
        <textarea
          rows={5}
          placeholder="Tuliskan cerita, kabar, atau kenangan masa SMA 59..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border-0 focus:ring-0 text-sm text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none p-1"
        />

        {/* Uploaded Media Previews */}
        {mediaList.length > 0 && (
          <div className="grid grid-cols-3 gap-2 my-3">
            {mediaList.map((m, idx) => (
              <div key={idx} className="relative rounded-xl overflow-hidden h-24 bg-slate-100 border">
                <img src={m.url} alt="Media" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setMediaList((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Bar: Attachments & Submit */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <label className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors ${isProcessingMedia ? 'opacity-60 pointer-events-none' : ''}`}>
            <ImageIcon size={16} className="text-emerald-600" />
            <span>{isProcessingMedia ? 'Mengompres...' : 'Lampirkan Foto / Video'}</span>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              disabled={isProcessingMedia}
              onChange={handleMediaUpload}
              className="hidden"
            />
          </label>

          <AppButton
            onClick={handleSubmit}
            variant="primary"
            size="md"
            isLoading={isSubmitting || isProcessingMedia}
            disabled={isProcessingMedia}
          >
            Bagikan Postingan
          </AppButton>
        </div>
      </div>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat...</div>}>
      <CreatePostContent />
    </Suspense>
  );
}
