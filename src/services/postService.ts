import { apiClient } from './apiClient';
import { Post, Comment, PostType, ProfileVisibility } from '@/types';

export async function fetchPosts(category?: string, authorId?: string): Promise<Post[]> {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'all') {
      params.append('type', category);
    }
    if (authorId && authorId.trim().length > 0) {
      params.append('authorId', authorId.trim());
    }
    const queryString = params.toString();
    const url = queryString ? `/posts?${queryString}` : '/posts';
    const res = await apiClient.get(url);
    return res.posts || [];
  } catch (err) {
    console.warn('Fetch posts error:', err);
    return [];
  }
}

export async function reportPost(payload: {
  targetId: string;
  targetType?: string;
  category: string;
  description?: string;
}): Promise<any> {
  return await apiClient.post('/reports', payload);
}

export async function fetchPostById(id: string): Promise<Post | null> {
  try {
    const res = await apiClient.get(`/posts/${id}`);
    return res.post || null;
  } catch {
    return null;
  }
}

export async function createPost(payload: {
  text: string;
  type?: PostType;
  visibility?: ProfileVisibility;
  media?: { type: 'image' | 'video'; url: string; caption?: string }[];
  memoryMeta?: {
    year?: number;
    locationName?: string;
    album?: string;
    isThenAndNow?: boolean;
    thenPhotoUrl?: string;
    nowPhotoUrl?: string;
  };
  linkedProductId?: string;
  linkedEventId?: string;
}): Promise<Post> {
  const res = await apiClient.post('/posts', payload);
  return res.post;
}

export async function deletePost(postId: string): Promise<boolean> {
  try {
    await apiClient.delete(`/posts/${postId}`);
    return true;
  } catch {
    return false;
  }
}

export async function reactToPost(
  postId: string,
  reactionType: 'suka' | 'kangen' | 'salut' | 'semangat'
): Promise<any> {
  return await apiClient.post(`/posts/${postId}/react`, { reactionType });
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  try {
    const res = await apiClient.get(`/posts/${postId}/comments`);
    return res.comments || [];
  } catch {
    return [];
  }
}

export async function addComment(postId: string, text: string, parentId?: string): Promise<Comment> {
  const res = await apiClient.post(`/posts/${postId}/comments`, { text, parentId });
  return res.comment;
}

export async function fetchStories(): Promise<any[]> {
  try {
    const res = await apiClient.get('/stories');
    return res.stories || [];
  } catch {
    return [];
  }
}

export async function createStory(payload: {
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  caption?: string;
}): Promise<any> {
  return await apiClient.post('/stories', payload);
}
