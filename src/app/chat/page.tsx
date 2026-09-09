'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchChatThreads } from '@/services/chatService';
import { ChatThread } from '@/types';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { MessageSquare, Search, Plus, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';
import { rtdb } from '@/services/firebaseConfig';
import { ref, onValue } from 'firebase/database';

export default function ChatInboxPage() {
  const { user, profile, isAuthenticated } = useAuth();
  const currentUserId = user?.id || profile?.uid || '';

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Initial Load from PostgreSQL API
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

  // 2. Real-time Inbox Stream via Firebase RTDB
  // Listens to userChats/${currentUserId} to update lastMessage and re-sort instantaneously
  useEffect(() => {
    if (!currentUserId) return;

    let isSubscribed = true;
    const userInboxRef = ref(rtdb, `userChats/${currentUserId}`);

    const unsubscribe = onValue(userInboxRef, (snapshot) => {
      if (!isSubscribed) return;
      const data = snapshot.val();
      if (!data) return;

      setThreads((prev) => {
        let hasNewThread = false;
        const updated = prev.map((thread) => {
          const rtdbInfo = data[thread.id];
          if (rtdbInfo) {
            return {
              ...thread,
              lastMessageText: rtdbInfo.lastMessageText || thread.lastMessageText,
              lastMessageAt: rtdbInfo.lastMessageAt
                ? new Date(rtdbInfo.lastMessageAt).toISOString()
                : thread.lastMessageAt,
              unreadCount: typeof rtdbInfo.unreadCount === 'number'
                ? rtdbInfo.unreadCount
                : thread.unreadCount,
            };
          }
          return thread;
        });

        // Check if there is an RTDB thread not yet present in state
        for (const threadId of Object.keys(data)) {
          if (!prev.some((t) => t.id === threadId)) {
            hasNewThread = true;
            break;
          }
        }

        if (hasNewThread) {
          // Trigger a background refresh to pull full metadata
          fetchChatThreads().then((fresh) => {
            if (isSubscribed && fresh) setThreads(fresh);
          }).catch(() => {});
        }

        // Sort threads by latest message timestamp
        return updated.sort((a, b) => {
          const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return timeB - timeA;
        });
      });
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [currentUserId]);

  // 3. Deduplicate threads by otherUser to strictly guarantee 1 channel per alumni
  const deduplicatedThreads = useMemo(() => {
    const map = new Map<string, ChatThread>();

    for (const thread of threads) {
      const otherMember = thread.members?.find((m) => m.id !== currentUserId);
      const otherUid = thread.otherUser?.uid || otherMember?.id || thread.id;

      if (!map.has(otherUid)) {
        map.set(otherUid, thread);
      } else {
        // Keep the thread with the newer lastMessageAt
        const existing = map.get(otherUid)!;
        const timeExisting = existing.lastMessageAt ? new Date(existing.lastMessageAt).getTime() : 0;
        const timeCurrent = thread.lastMessageAt ? new Date(thread.lastMessageAt).getTime() : 0;
        if (timeCurrent > timeExisting) {
          map.set(otherUid, thread);
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [threads, currentUserId]);

  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return deduplicatedThreads;
    const q = searchQuery.toLowerCase();
    return deduplicatedThreads.filter((t) => {
      const other = t.members?.find((m) => m.id !== currentUserId)?.profile?.fullName || t.otherUser?.name || '';
      return other.toLowerCase().includes(q);
    });
  }, [deduplicatedThreads, searchQuery, currentUserId]);

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

  return (
    <div className="w-full px-3.5 py-3.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-bold text-slate-900">Pesan Langsung</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] text-emerald-700 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">Percakapan pribadi dengan rekan alumni SMAN 59</p>
        </div>
        <Link
          href="/alumni"
          className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-primaryDark shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center"
          title="Mulai Obrolan Baru dari Direktori"
        >
          <Plus size={17} />
        </Link>
      </div>

      {/* Search Input */}
      <div className="relative mb-3.5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari obrolan rekan alumni..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-primary shadow-xs transition-all"
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
              <div className="flex-1 space-y-2">
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
          description="Buka Direktori Alumni untuk menemukan rekan sekelas dan mulai percakapan hangat!"
          actionText="Buka Direktori Alumni"
          onAction={() => (window.location.href = '/alumni')}
        />
      ) : (
        <div className="space-y-2">
          {filteredThreads.map((thread) => {
            const otherMember = thread.members?.find((m) => m.id !== currentUserId);
            const otherProfile = otherMember?.profile;
            const otherName = otherProfile?.fullName || thread.otherUser?.name || 'Alumni 99';
            const otherPhoto = otherProfile?.profilePhotoUrl || thread.otherUser?.photoUrl;
            const otherId = thread.otherUser?.uid || otherMember?.id || thread.id;
            const unread = thread.unreadCount || 0;

            return (
              <Link
                key={thread.id}
                href={`/chat/${otherId}`}
                className="bg-white rounded-2xl p-3.5 border border-slate-100/90 hover:border-slate-200 shadow-subtle hover:shadow-xs flex items-center justify-between gap-3 transition-all block group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <AppAvatar src={otherPhoto} name={otherName} size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-brand-primary transition-colors">
                          {otherName}
                        </h4>
                        {thread.otherUser?.isVerified && <VerifiedBadge size={13} />}
                      </div>
                      {thread.lastMessageAt && (
                        <span className="text-[10px] text-slate-400 font-medium flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(thread.lastMessageAt), {
                            addSuffix: false,
                            locale: localeId,
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs truncate ${unread > 0 ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                        {thread.lastMessageText || 'Mulai percakapan...'}
                      </p>
                      {unread > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-brand-primary text-white text-[10px] font-bold rounded-full min-w-[18px] text-center flex-shrink-0 shadow-2xs animate-pulse">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
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
