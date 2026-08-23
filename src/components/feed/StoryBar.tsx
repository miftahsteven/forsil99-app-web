'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchStories, createStory } from '@/services/postService';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { toast } from 'sonner';

export function StoryBar() {
  const { user, profile, isVerified } = useAuth();
  const [stories, setStories] = useState<any[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    const data = await fetchStories();
    setStories(data);
  };

  const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 15MB');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        await createStory({
          mediaUrl: base64,
          mediaType: file.type.startsWith('video') ? 'video' : 'image',
          caption: 'Cerita 24 Jam Alumni SMAN 59',
        });
        toast.success('Cerita berhasil diunggah!');
        loadStories();
      } catch (err: any) {
        toast.error(err.message || 'Gagal mengunggah cerita.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="bg-white px-3 py-3 border-b border-slate-100 shadow-subtle mb-3">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
          {/* Add My Story Button */}
          <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
            <label className="relative cursor-pointer">
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                disabled={isUploading}
                onChange={handleCreateStory}
              />
              <div className="relative">
                <AppAvatar
                  src={profile?.profilePhotoUrl}
                  name={profile?.fullName || 'Saya'}
                  size="md"
                  className="group-hover:opacity-90"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-primary text-white rounded-full border-2 border-white flex items-center justify-center shadow">
                  <Plus size={12} strokeWidth={3} />
                </div>
              </div>
            </label>
            <span className="text-[11px] font-medium text-slate-700 mt-1.5 truncate max-w-[64px]">
              {isUploading ? 'Mengunggah...' : 'Cerita Anda'}
            </span>
          </div>

          {/* Stories List */}
          {stories.map((story, idx) => (
            <div
              key={story.id || idx}
              onClick={() => setActiveStoryIndex(idx)}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <AppAvatar
                src={story.author?.profile?.profilePhotoUrl || story.mediaUrl}
                name={story.author?.profile?.fullName || 'Alumni'}
                size="md"
                hasStory={true}
              />
              <span className="text-[11px] font-medium text-slate-700 mt-1.5 truncate max-w-[64px]">
                {story.author?.profile?.nickname || story.author?.profile?.fullName?.split(' ')[0] || 'Alumni'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {activeStoryIndex !== null && stories[activeStoryIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm h-[80vh] max-h-[640px] bg-slate-900 rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xl">
            {/* Header info */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <AppAvatar
                  src={stories[activeStoryIndex].author?.profile?.profilePhotoUrl}
                  name={stories[activeStoryIndex].author?.profile?.fullName}
                  size="xs"
                />
                <div>
                  <p className="text-xs font-bold leading-tight">
                    {stories[activeStoryIndex].author?.profile?.fullName || 'Alumni 99'}
                  </p>
                  <p className="text-[10px] text-slate-300">
                    {stories[activeStoryIndex].author?.profile?.className || 'Alumni SMAN 59'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveStoryIndex(null)}
                className="p-1 rounded-full bg-black/40 text-white hover:bg-black/60"
              >
                <X size={18} />
              </button>
            </div>

            {/* Media Content */}
            <div className="flex-1 flex items-center justify-center bg-black">
              {stories[activeStoryIndex].mediaType === 'video' ? (
                <video
                  src={stories[activeStoryIndex].mediaUrl}
                  autoPlay
                  playsInline
                  controls
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <img
                  src={stories[activeStoryIndex].mediaUrl}
                  alt="Story"
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>

            {/* Caption */}
            {stories[activeStoryIndex].caption && (
              <div className="p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-xs text-center">
                {stories[activeStoryIndex].caption}
              </div>
            )}

            {/* Navigation Arrows */}
            {activeStoryIndex > 0 && (
              <button
                onClick={() => setActiveStoryIndex(activeStoryIndex - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full hover:bg-black/60"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {activeStoryIndex < stories.length - 1 && (
              <button
                onClick={() => setActiveStoryIndex(activeStoryIndex + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full hover:bg-black/60"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
