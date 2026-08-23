'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  fetchThreadMessages,
  sendMessage,
  startDirectChat,
} from '@/services/chatService';
import { fetchProfileById } from '@/services/authService';
import { ChatMessage, AlumniProfile } from '@/types';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ChevronLeft, Send, Image as ImageIcon, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const targetId = params.id as string;

  const { user, profile, isAuthenticated } = useAuth();
  const [targetProfile, setTargetProfile] = useState<AlumniProfile | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    initChat();
  }, [targetId, isAuthenticated]);

  const initChat = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch other user profile
      const prof = await fetchProfileById(targetId);
      if (prof) setTargetProfile(prof);

      // 2. Start / Get Thread
      const thread = await startDirectChat(targetId);
      if (thread && thread.id) {
        setThreadId(thread.id);
        const msgs = await fetchThreadMessages(thread.id);
        setMessages(msgs);
      }
    } catch {
      toast.error('Gagal memuat ruang obrolan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !threadId) return;

    const messageText = text.trim();
    setText('');
    setIsSending(true);

    // Optimistic message
    const tempMessage: ChatMessage = {
      id: Date.now().toString(),
      threadId,
      senderId: user?.id || profile?.uid || '',
      text: messageText,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      await sendMessage(threadId, messageText);
    } catch (err: any) {
      toast.error('Gagal mengirim pesan.');
    } finally {
      setIsSending(false);
    }
  };

  const recipientName = targetProfile?.fullName || 'Rekan Alumni';
  const recipientClass = targetProfile?.className || 'Alumni ’99';
  const recipientPhoto = targetProfile?.profilePhotoUrl;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
      {/* Header Bar */}
      <div className="px-3 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between shadow-xs sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push('/chat')}
            className="p-1 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100"
          >
            <ChevronLeft size={20} />
          </button>

          <Link href={`/profile/${targetId}`} className="flex items-center gap-2.5">
            <AppAvatar src={recipientPhoto} name={recipientName} size="sm" />
            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                  {recipientName}
                </h3>
                <VerifiedBadge size={13} />
              </div>
              <p className="text-[10px] text-brand-primary font-medium">{recipientClass}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Message History */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-xs text-slate-400">Memuat obrolan...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <AppAvatar src={recipientPhoto} name={recipientName} size="lg" className="mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-800">{recipientName}</h4>
            <p className="text-xs text-slate-400 mt-1">
              Mulai obrolan hangat dengan rekan sekelas Anda di SMAN 59!
            </p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.senderId === user?.id || m.senderId === profile?.uid;
            return (
              <div
                key={m.id || idx}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-brand-primary text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      isMe ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Form */}
      <div className="p-3 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tulis pesan alumni..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
          <button
            type="submit"
            disabled={!text.trim() || isSending}
            className="p-2.5 bg-brand-primary text-white rounded-full hover:bg-brand-primaryDark disabled:opacity-40 shadow-sm transition-all active:scale-95"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
