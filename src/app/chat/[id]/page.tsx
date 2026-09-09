'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  fetchThreadMessages,
  sendMessage,
  startDirectChat,
} from '@/services/chatService';
import { fetchProfileById, toggleFollow, fetchFollowStatus } from '@/services/authService';
import { ChatMessage, AlumniProfile } from '@/types';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ImageViewModal } from '@/components/ui/ImageViewModal';
import {
  ChevronLeft,
  Send,
  UserPlus,
  Check,
  CheckCheck,
  Clock,
  ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { rtdb } from '@/services/firebaseConfig';
import {
  ref,
  onValue,
  onChildAdded,
  set,
  remove,
  onDisconnect,
} from 'firebase/database';

// Web Audio API message chime (Zero external MP3 asset dependency)
function playMessageChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(780, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1180, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.17);
  } catch {}
}

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const targetId = params.id as string;

  const { user, profile, isAuthenticated } = useAuth();
  const currentUserId = user?.id || profile?.uid || '';

  const [targetProfile, setTargetProfile] = useState<AlumniProfile | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(true);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState<boolean>(false);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState<boolean>(false);
  const [isRecipientTyping, setIsRecipientTyping] = useState<boolean>(false);
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadDone = useRef<boolean>(false);

  const otherUserId = targetProfile?.userId || targetProfile?.uid || targetId;

  // 1. Initial Room Setup
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    initChat();
  }, [targetId, isAuthenticated]);

  const initChat = async () => {
    setIsLoading(true);
    isInitialLoadDone.current = false;
    try {
      // Start or get canonical deduplicated thread
      const thread = await startDirectChat(targetId);
      if (thread && thread.id) {
        setThreadId(thread.id);
        if (thread.otherUser) {
          setTargetProfile({
            uid: thread.otherUser.uid,
            userId: thread.otherUser.uid,
            fullName: thread.otherUser.name,
            profilePhotoUrl: thread.otherUser.photoUrl,
            className: thread.otherUser.className,
            graduationYear: 1999,
          } as any);
        }

        // Fetch initial historical messages
        const msgs = await fetchThreadMessages(thread.id);
        setMessages(msgs);
        isInitialLoadDone.current = true;
      }

      // Fetch full profile and follow status in parallel
      Promise.all([
        fetchProfileById(targetId),
        fetchFollowStatus(targetId),
      ]).then(([prof, followStatus]) => {
        if (prof) setTargetProfile(prof);
        if (followStatus && typeof followStatus.isFollowing === 'boolean') {
          setIsFollowing(followStatus.isFollowing);
        }
      }).catch(() => {});
    } catch (err: any) {
      console.warn('Init chat error:', err);
      toast.error('Gagal memuat ruang obrolan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    setIsUpdatingFollow(true);
    try {
      const res: any = await toggleFollow(targetId);
      if (res && typeof res.isFollowing === 'boolean') {
        setIsFollowing(res.isFollowing);
        toast.success(
          res.isFollowing
            ? `Mulai mengikuti ${targetProfile?.fullName || 'alumni'}`
            : `Berhenti mengikuti ${targetProfile?.fullName || 'alumni'}`
        );
      } else {
        setIsFollowing(!isFollowing);
      }
    } catch {
      toast.error('Gagal memperbarui status ikuti.');
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  // 2. Real-time Firebase RTDB WebSocket Stream (<50ms latency)
  useEffect(() => {
    if (!threadId) return;

    let isSubscribed = true;
    const roomMessagesRef = ref(rtdb, `chatRooms/${threadId}/messages`);

    // Stream incoming messages directly via RTDB
    const unsubscribeMessages = onChildAdded(roomMessagesRef, (snapshot) => {
      if (!isSubscribed) return;
      const data = snapshot.val();
      if (!data || !data.id) return;

      setMessages((prev) => {
        // If message already exists by id, do not add duplicate
        if (prev.some((m) => m.id === data.id)) {
          return prev;
        }

        // If this matches an optimistic message tempId, replace it
        if (data.clientTempId && prev.some((m) => m.clientTempId === data.clientTempId || m.id === data.clientTempId)) {
          return prev.map((m) =>
            m.clientTempId === data.clientTempId || m.id === data.clientTempId
              ? { ...data, status: 'delivered' }
              : m
          );
        }

        // If it's an incoming message from the other alumni, play audio chime
        if (isInitialLoadDone.current && data.senderId !== currentUserId) {
          playMessageChime();
        }

        return [...prev, { ...data, status: data.isRead ? 'read' : 'delivered' }];
      });
    });

    // 3. Listen for Read Receipts in real-time (Blue Checkmarks ✓✓)
    const readReceiptRef = ref(rtdb, `chatRooms/${threadId}/readReceipts/${otherUserId}`);
    const unsubscribeReceipt = onValue(readReceiptRef, (snapshot) => {
      if (!isSubscribed) return;
      const val = snapshot.val();
      if (val && val.readAt) {
        setMessages((prev) =>
          prev.map((m) => {
            const isMe = m.senderId === currentUserId;
            if (isMe && !m.isRead) {
              return { ...m, isRead: true, status: 'read' };
            }
            return m;
          })
        );
      }
    });

    // 4. Listen for Recipient's Typing Indicator
    const typingRef = ref(rtdb, `chatRooms/${threadId}/typing/${otherUserId}`);
    const unsubscribeTyping = onValue(typingRef, (snapshot) => {
      if (!isSubscribed) return;
      setIsRecipientTyping(Boolean(snapshot.val()));
    });

    return () => {
      isSubscribed = false;
      unsubscribeMessages();
      unsubscribeReceipt();
      unsubscribeTyping();
    };
  }, [threadId, otherUserId, currentUserId]);

  // Mark room as read on mount or when new messages arrive
  useEffect(() => {
    if (!threadId || !currentUserId) return;
    const myReceiptRef = ref(rtdb, `chatRooms/${threadId}/readReceipts/${currentUserId}`);
    set(myReceiptRef, { readAt: Date.now() }).catch(() => {});
  }, [threadId, currentUserId, messages.length]);

  // Auto scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, isRecipientTyping, scrollToBottom]);

  // Handle scroll detection for "scroll to bottom" button
  const handleScroll = () => {
    if (!messageContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isScrolledUp);
  };

  // Broadcast typing indicator to Firebase RTDB
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    if (!threadId || !currentUserId) return;

    const myTypingRef = ref(rtdb, `chatRooms/${threadId}/typing/${currentUserId}`);

    if (val.trim()) {
      set(myTypingRef, true).catch(() => {});
      // Auto-remove on disconnect
      onDisconnect(myTypingRef).remove().catch(() => {});

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        remove(myTypingRef).catch(() => {});
      }, 2500);
    } else {
      remove(myTypingRef).catch(() => {});
    }
  };

  // Stop typing indicator on blur or send
  const stopTyping = () => {
    if (!threadId || !currentUserId) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    const myTypingRef = ref(rtdb, `chatRooms/${threadId}/typing/${currentUserId}`);
    remove(myTypingRef).catch(() => {});
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !threadId) return;

    if (!isFollowing) {
      toast.error(
        `Anda harus mengikuti (follow) ${recipientName} terlebih dahulu untuk mengirim pesan.`,
        {
          action: {
            label: '+ Ikuti Sekarang',
            onClick: handleFollow,
          },
          duration: 5000,
        }
      );
      return;
    }

    const messageText = text.trim();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setText('');
    stopTyping();
    setIsSending(true);

    // Optimistic UI message (WhatsApp style with instant single check ✓)
    const optimisticMessage: ChatMessage = {
      id: tempId,
      clientTempId: tempId,
      threadId,
      senderId: currentUserId,
      senderName: profile?.fullName || 'Saya',
      text: messageText,
      createdAt: new Date().toISOString(),
      isRead: false,
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const saved = await sendMessage(threadId, messageText, undefined, tempId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId || m.clientTempId === tempId
            ? { ...saved, status: saved.isRead ? 'read' : 'delivered' }
            : m
        )
      );
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim pesan.');
      // Mark optimistic message as failed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, status: 'sending' } : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const recipientName = targetProfile?.fullName || 'Rekan Alumni';
  const recipientClass = targetProfile?.className || 'Alumni ’99';
  const recipientPhoto = targetProfile?.profilePhotoUrl;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#efeae2]/30 dark:bg-slate-900/50 relative">
      {/* WhatsApp Web Style Header */}
      <div className="px-3.5 py-2.5 bg-white border-b border-slate-200/80 flex items-center justify-between shadow-2xs sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push('/chat')}
            className="p-1 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
            title="Kembali ke Daftar Pesan"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (recipientPhoto) setIsAvatarPreviewOpen(true);
              }}
              className={`relative flex-shrink-0 rounded-full focus:outline-none ${
                recipientPhoto ? 'cursor-zoom-in' : 'cursor-default'
              }`}
              title={recipientPhoto ? `Lihat foto ${recipientName} lebih besar` : undefined}
            >
              <AppAvatar src={recipientPhoto} name={recipientName} size="sm" />
            </button>
            <Link href={`/profile/${targetId}`} className="hover:opacity-90 transition-opacity">
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                  {recipientName}
                </h3>
                <VerifiedBadge size={13} />
              </div>
              {isRecipientTyping ? (
                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>sedang mengetik...</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 font-medium">{recipientClass}</p>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Warning banner if not following */}
      {!isFollowing && targetProfile && (
        <div className="bg-amber-50 border-b border-amber-200/80 px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-xs text-amber-900 sticky top-[53px] z-10 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <UserPlus size={16} className="text-amber-600 flex-shrink-0" />
            <span className="truncate">
              Anda belum mengikuti <strong>{recipientName}</strong>. Ikuti untuk mengaktifkan fitur chat.
            </span>
          </div>
          <button
            type="button"
            onClick={handleFollow}
            disabled={isUpdatingFollow}
            className="px-3 py-1 bg-brand-primary hover:bg-brand-primaryDark text-white text-xs font-semibold rounded-lg flex-shrink-0 transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            + Ikuti Sekarang
          </button>
        </div>
      )}

      {/* Message History (WhatsApp Web layout) */}
      <div
        ref={messageContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-gradient-to-b from-slate-100/60 to-white/80"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-2">
            <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Menghubungkan ke ruang chat...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <AppAvatar src={recipientPhoto} name={recipientName} size="lg" className="mx-auto shadow-sm" />
            <h4 className="font-bold text-sm text-slate-800">{recipientName}</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Mulai obrolan hangat secara real-time dengan rekan sekelas Anda di SMAN 59!
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Terkoneksi langsung via Firebase RTDB</span>
            </div>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.senderId === currentUserId;
            const isRead = m.isRead || m.status === 'read';
            const isSendingMessage = m.status === 'sending';

            return (
              <div
                key={m.id || idx}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
              >
                <div
                  className={`max-w-[78%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs relative group transition-all ${
                    isMe
                      ? 'bg-brand-primary text-white rounded-tr-xs'
                      : 'bg-white text-slate-900 border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line text-xs break-words">{m.text}</p>

                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span
                      className={`text-[9px] ${
                        isMe ? 'text-blue-100/90' : 'text-slate-400'
                      }`}
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {/* WhatsApp style delivery checkmarks */}
                    {isMe && (
                      <span
                        className="inline-flex items-center ml-0.5"
                        title={isSendingMessage ? 'Mengirim...' : isRead ? 'Telah dibaca' : 'Terkirim ke server'}
                      >
                        {isSendingMessage ? (
                          <Clock size={11} className="text-blue-200 animate-spin" />
                        ) : isRead ? (
                          <CheckCheck size={13} className="text-sky-300 font-bold" />
                        ) : (
                          <CheckCheck size={13} className="text-blue-200" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* WhatsApp style typing bubble */}
        {isRecipientTyping && (
          <div className="flex justify-start animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs px-3.5 py-2 shadow-2xs flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500">{recipientName} sedang mengetik</span>
              <span className="flex items-center gap-0.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="absolute right-4 bottom-16 p-2 rounded-full bg-white border border-slate-200 shadow-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all active:scale-90 z-20"
          title="Gulir ke pesan terbaru"
        >
          <ArrowDown size={16} />
        </button>
      )}

      {/* Input Message Form */}
      <div className="p-3 bg-white border-t border-slate-200/90 shadow-xs">
        {!isFollowing ? (
          <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 px-4 text-xs text-slate-600">
            <span className="truncate">
              Ikuti <strong>{recipientName}</strong> untuk membuka fitur kirim pesan chat.
            </span>
            <button
              type="button"
              onClick={handleFollow}
              disabled={isUpdatingFollow}
              className="px-3.5 py-1.5 bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold rounded-xl text-xs flex-shrink-0 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              + Ikuti Sekarang
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ketik pesan..."
              value={text}
              onChange={handleTextChange}
              onBlur={stopTyping}
              className="flex-1 bg-slate-100/90 border border-slate-200/60 rounded-full px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:bg-white transition-all shadow-2xs"
            />
            <button
              type="submit"
              disabled={!text.trim() || isSending}
              className="p-2.5 bg-brand-primary text-white rounded-full hover:bg-brand-primaryDark disabled:opacity-40 shadow-sm transition-all active:scale-95 cursor-pointer flex-shrink-0"
              title="Kirim Pesan"
            >
              <Send size={15} />
            </button>
          </form>
        )}
      </div>

      {/* Lightbox Modal Foto Profil */}
      <ImageViewModal
        isOpen={isAvatarPreviewOpen}
        onClose={() => setIsAvatarPreviewOpen(false)}
        imageUrl={recipientPhoto}
        altText={`Foto profil ${recipientName}`}
        title={recipientName}
        subtitle={`${recipientClass} (SMAN 59 ’99)`}
      />
    </div>
  );
}
