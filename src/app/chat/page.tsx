'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchChatThreads } from '@/services/chatService';
import { ChatThread } from '@/types';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageSquare, Search, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ChatInboxPage() {
  const { user, profile, isAuthenticated } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadThreads();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadThreads = async () => {
    setIsLoading(true);
    try {
      const data = await fetchChatThreads();
      setThreads(data);
    } catch {
      toast.error('Gagal memuat pesan.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <EmptyState
          icon={<MessageSquare size={28} />}
          title="Masuk untuk melihat pesan"
          description="Fitur percakapan langsung hanya dapat diakses oleh alumni yang telah masuk ke akunnya."
          actionText="Masuk ke Akun"
          onAction={() => (window.location.href = '/login')}
        />
      </div>
    );
  }

  const filteredThreads = threads.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const other = t.members?.find((m) => m.id !== user?.id)?.profile?.fullName || t.otherUser?.name || '';
    return other.toLowerCase().includes(q);
  });

  return (
    <div className="w-full px-3 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Pesan Langsung</h1>
          <p className="text-xs text-slate-500">Percakapan pribadi dengan rekan alumni</p>
        </div>
        <Link
          href="/alumni"
          className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-primaryDark shadow-sm"
          title="Mulai Obrolan Baru"
        >
          <Plus size={16} />
        </Link>
      </div>

      {/* Search Input */}
      <div className="relative mb-3.5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari obrolan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-primary shadow-xs"
        />
      </div>

      {/* Thread list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-subtle animate-pulse flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-1.5">
                <div className="w-32 h-4 bg-slate-200 rounded" />
                <div className="w-48 h-3 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredThreads.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={28} />}
          title="Belum ada pesan"
          description="Buka Direktori Alumni untuk menemukan rekan sekelas dan mulai percakapan!"
          actionText="Buka Direktori Alumni"
          onAction={() => (window.location.href = '/alumni')}
        />
      ) : (
        <div className="space-y-2">
          {filteredThreads.map((thread) => {
            const otherMember = thread.members?.find((m) => m.id !== user?.id);
            const otherProfile = otherMember?.profile;
            const otherName = otherProfile?.fullName || thread.otherUser?.name || 'Alumni 99';
            const otherPhoto = otherProfile?.profilePhotoUrl || thread.otherUser?.photoUrl;
            const otherId = otherMember?.id || thread.otherUser?.uid || thread.id;

            return (
              <Link
                key={thread.id}
                href={`/chat/${otherId}`}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 hover:border-slate-200 shadow-subtle flex items-center justify-between gap-3 transition-all block"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <AppAvatar src={otherPhoto} name={otherName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{otherName}</h4>
                      {thread.lastMessageAt && (
                        <span className="text-[10px] text-slate-400">
                          {formatDistanceToNow(new Date(thread.lastMessageAt), { locale: localeId })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {thread.lastMessageText || 'Mulai percakapan...'}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
