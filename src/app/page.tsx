'use client';

import React, { useState, useEffect } from 'react';
import { StoryBar } from '@/components/feed/StoryBar';
import { QuickComposer } from '@/components/feed/QuickComposer';
import { PostCard } from '@/components/feed/PostCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { fetchPosts } from '@/services/postService';
import { Post } from '@/types';
import { Sparkles, RefreshCw, MessageSquareDashed } from 'lucide-react';
import { toast } from 'sonner';

const FILTER_TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'memory', label: '✨ Kenangan ’99' },
  { id: 'standard', label: 'Cerita' },
  { id: 'announcement', label: 'Pengumuman' },
  { id: 'help', label: 'Bantuan' },
];

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadPosts = async (tab = activeTab) => {
    setIsLoading(true);
    try {
      const data = await fetchPosts(tab);
      // Exclude seller product promotions from the general social timeline
      const filtered = tab === 'all' ? data.filter((p) => p.type !== 'shop_share') : data;
      setPosts(filtered);
    } catch (err: any) {
      toast.error('Gagal memuat timeline postingan.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts(activeTab);
  }, [activeTab]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPosts(activeTab);
  };

  const handlePostDeleted = (deletedId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedId));
  };

  return (
    <div className="w-full">
      {/* 1. Ephemeral Stories Bar */}
      <StoryBar />

      <div className="px-3">
        {/* 2. Quick Post Composer */}
        <QuickComposer />

        {/* 3. Filter Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 mb-3">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                activeTab === tab.id
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 4. Feed Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-subtle animate-pulse space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-32 h-3.5 bg-slate-200 rounded" />
                    <div className="w-20 h-2.5 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-full h-12 bg-slate-100 rounded-lg" />
                <div className="w-full h-44 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<MessageSquareDashed size={28} />}
            title="Belum ada postingan"
            description="Jadilah alumni pertama yang membagikan kabar, cerita, atau kenangan foto SMA 59!"
            actionText="Segarkan Halaman"
            onAction={handleRefresh}
          />
        ) : (
          <div className="space-y-3.5">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostDeleted={handlePostDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
