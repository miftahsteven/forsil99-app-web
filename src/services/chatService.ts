import { apiClient } from './apiClient';
import { ChatThread, ChatMessage } from '@/types';

export async function fetchChatThreads(): Promise<ChatThread[]> {
  try {
    const res = await apiClient.get('/chat/threads');
    return res.threads || [];
  } catch (err) {
    console.warn('Fetch chat threads error:', err);
    return [];
  }
}

export async function startDirectChat(targetUserId: string): Promise<ChatThread> {
  const res = await apiClient.post('/chat/start', { targetUserId });
  return res.thread;
}

export async function fetchThreadMessages(threadId: string): Promise<ChatMessage[]> {
  try {
    const res = await apiClient.get(`/chat/threads/${threadId}/messages`);
    return res.messages || [];
  } catch (err) {
    console.warn('Fetch messages error:', err);
    return [];
  }
}

export async function sendMessage(
  threadId: string,
  text: string,
  imageUrl?: string
): Promise<ChatMessage> {
  const res = await apiClient.post(`/chat/threads/${threadId}/messages`, {
    text,
    imageUrl,
  });
  return res.chatMessage || res.message;
}
