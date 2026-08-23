'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Send,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Flame,
  ThumbsUp,
  Smile,
  CornerDownRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Post, Comment } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { reactToPost, addComment, deletePost, fetchComments } from '@/services/postService';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { VerifiedBadge, GoldBadge } from '@/components/ui/VerifiedBadge';
import { toast } from 'sonner';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
}

const REACTION_EMOJIS = {
  suka: { label: 'Suka', emoji: '👍', color: 'text-blue-600' },
  kangen: { label: 'Kangen', emoji: '❤️', color: 'text-rose-600' },
  salut: { label: 'Salut', emoji: '👏', color: 'text-amber-600' },
  semangat: { label: 'Semangat', emoji: '💪', color: 'text-emerald-600' },
};

export function PostCard({ post, onPostDeleted }: PostCardProps) {
  const { user, profile, isAuthenticated, isAdmin } = useAuth();
  
  // Local reactive states
  const [reactionCount, setReactionCount] = useState<number>(post.reactionCount || 0);
  const [userReaction, setUserReaction] = useState<'suka' | 'kangen' | 'salut' | 'semangat' | undefined>(
    post.userReaction
  );
  const [reactors, setReactors] = useState<Array<{ uid: string; fullName: string; className?: string; photoUrl?: string; reaction: 'suka' | 'kangen' | 'salut' | 'semangat' }>>(
    (post as any).reactors || []
  );
  const [showReactionPicker, setShowReactionPicker] = useState<boolean>(false);
  const [showReactionsModal, setShowReactionsModal] = useState<boolean>(false);
  const [reactionsFilterTab, setReactionsFilterTab] = useState<'all' | 'kangen' | 'salut' | 'suka' | 'semangat'>('all');

  const [showComments, setShowComments] = useState<boolean>(false);
  const [showAllCommentsModal, setShowAllCommentsModal] = useState<boolean>(false);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [commentCount, setCommentCount] = useState<number>(post.commentCount || 0);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);
  const [commentText, setCommentText] = useState<string>('');
  const [modalCommentText, setModalCommentText] = useState<string>('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [isSubmittingModalComment, setIsSubmittingModalComment] = useState<boolean>(false);

  const loadCommentsIfEmpty = async () => {
    if (comments.length === 0 && commentCount > 0) {
      setIsLoadingComments(true);
      try {
        const fetched = await fetchComments(post.id);
        if (fetched && fetched.length > 0) {
          setComments(fetched);
          setCommentCount(fetched.length);
        }
      } catch (err) {
        console.warn('Load comments error:', err);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  const handleToggleComments = () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState) {
      loadCommentsIfEmpty();
    }
  };

  const handleOpenAllCommentsModal = () => {
    setShowAllCommentsModal(true);
    loadCommentsIfEmpty();
  };

  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const authorProfile = post.author?.profile;
  const authorName = authorProfile?.fullName || post.authorName || 'Alumni SMAN 59';
  const authorClass = authorProfile?.className || post.authorClass || 'Alumni ’99';
  const authorPhoto = authorProfile?.profilePhotoUrl || post.authorPhotoUrl;
  const authorId = post.authorId || post.author?.id;

  const isOwner = user?.id === authorId || profile?.uid === authorId;
  const canDelete = isOwner || isAdmin;

  // Format relative timestamp
  let formattedTime = 'Baru saja';
  try {
    if (post.createdAt) {
      formattedTime = formatDistanceToNow(new Date(post.createdAt), {
        addSuffix: true,
        locale: localeId,
      });
    }
  } catch (e) {
    formattedTime = 'Baru saja';
  }

  // Handle reaction trigger
  const handleReaction = async (type: 'suka' | 'kangen' | 'salut' | 'semangat') => {
    if (!isAuthenticated) {
      toast.error('Silakan masuk terlebih dahulu untuk memberi reaksi.');
      return;
    }

    const previousReaction = userReaction;
    const isTogglingOff = previousReaction === type;
    const currentUid = profile?.uid || user?.id || '';
    const currentName = profile?.fullName || user?.email || 'Saya';
    const currentPhoto = profile?.profilePhotoUrl;
    const currentClass = profile?.className || 'Alumni 99';

    // Optimistic update
    if (isTogglingOff) {
      setUserReaction(undefined);
      setReactionCount((prev) => Math.max(0, prev - 1));
      setReactors((prev) => prev.filter((r) => r.uid !== currentUid));
    } else {
      setUserReaction(type);
      if (!previousReaction) {
        setReactionCount((prev) => prev + 1);
        setReactors((prev) => [
          { uid: currentUid, fullName: currentName, className: currentClass, photoUrl: currentPhoto, reaction: type },
          ...prev.filter((r) => r.uid !== currentUid),
        ]);
      } else {
        setReactors((prev) =>
          prev.map((r) => (r.uid === currentUid ? { ...r, reaction: type } : r))
        );
      }
    }
    setShowReactionPicker(false);

    try {
      await reactToPost(post.id, type);
    } catch (err: any) {
      // Revert on error
      setUserReaction(previousReaction);
      toast.error('Gagal memperbarui reaksi.');
    }
  };

  // Handle comment submit
  const handleCommentSubmit = async (e: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText !== undefined ? customText : commentText;
    if (!textToSend.trim()) return;
    if (!isAuthenticated) {
      toast.error('Silakan masuk untuk menulis komentar.');
      return;
    }

    setIsSubmittingComment(true);
    setIsSubmittingModalComment(true);
    try {
      const targetComment = replyingTo ? comments.find((c) => c.id === replyingTo.id) : null;
      const rootParentId = targetComment ? (targetComment.parentId || targetComment.id) : undefined;
      const newComment = await addComment(post.id, textToSend.trim(), rootParentId);

      const enrichedComment: Comment = {
        ...newComment,
        authorName: profile?.fullName || newComment.authorName || 'Alumni 59',
        authorPhotoUrl: profile?.profilePhotoUrl || newComment.authorPhotoUrl,
        authorClass: profile?.className || newComment.authorClass || 'Alumni 99',
        parentAuthorName: replyingTo?.name,
      };

      setComments((prev) => [...prev, enrichedComment]);
      setCommentCount((prev) => prev + 1);
      setCommentText('');
      setModalCommentText('');
      setReplyingTo(null);
      toast.success('Komentar terkirim!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengirim komentar.');
    } finally {
      setIsSubmittingComment(false);
      setIsSubmittingModalComment(false);
    }
  };

  // Handle post delete
  const handleDeletePost = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus postingan ini?')) return;
    setIsDeleting(true);
    try {
      const success = await deletePost(post.id);
      if (success) {
        toast.success('Postingan berhasil dihapus.');
        if (onPostDeleted) onPostDeleted(post.id);
      }
    } catch {
      toast.error('Gagal menghapus postingan.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Cerita dari ${authorName} di Forsil 99`,
        text: post.text.slice(0, 100),
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Tautan berhasil disalin ke clipboard!');
    }
  };

  const hasMedia = Boolean(
    (post.media && post.media.length > 0) ||
    (post.memoryMeta?.isThenAndNow && (post.memoryMeta.thenPhotoUrl || post.memoryMeta.nowPhotoUrl))
  );

  // Comments hierarchy grouping
  const parentComments = comments.filter((c) => !c.parentId);
  const visibleParents = parentComments.slice(0, 3);
  const hasMoreComments = parentComments.length > 3;

  // Filtered reactors for modal
  const filteredReactors = reactors.filter((r) => {
    if (reactionsFilterTab === 'all') return true;
    return r.reaction === reactionsFilterTab;
  });

  return (
    <article className="bg-white rounded-2xl border border-slate-100/90 shadow-subtle mb-3.5 overflow-hidden transition-all">
      {/* 1. Header: Author info & options */}
      <div className="p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${authorId}`} className="active:scale-95 transition-transform">
            <AppAvatar src={authorPhoto} name={authorName} size="md" />
          </Link>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/profile/${authorId}`}
                className="font-bold text-sm text-slate-900 hover:text-brand-primary transition-colors leading-snug"
              >
                {authorName}
              </Link>
              <VerifiedBadge size={14} />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium text-brand-primaryDark">{authorClass}</span>
              <span>•</span>
              <span className="text-[11px] text-slate-400">{formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Post category badge or options */}
        <div className="flex items-center gap-1">
          {post.type === 'memory' && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Sparkles size={11} />
              <span>Nostalgia {post.memoryMeta?.year || '1999'}</span>
            </span>
          )}

          {canDelete && (
            <button
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
              title="Hapus postingan"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Body Text */}
      {post.text && (
        <div className="px-4 pb-3">
          <p
            className={`text-slate-800 leading-relaxed whitespace-pre-line ${
              !hasMedia && post.text.length < 120
                ? 'text-base font-medium text-slate-900'
                : 'text-sm font-normal'
            }`}
          >
            {post.text}
          </p>
        </div>
      )}

      {/* 3. Media: Nostalgia Then & Now or Carousel */}
      {post.memoryMeta?.isThenAndNow && (post.memoryMeta.thenPhotoUrl || post.memoryMeta.nowPhotoUrl) ? (
        <div className="px-3 pb-3">
          <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden bg-slate-50 p-2 border border-slate-100">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full mb-1.5">
                DULU ({post.memoryMeta.year || 1999})
              </span>
              <div className="w-full h-48 rounded-lg overflow-hidden bg-slate-200">
                <img
                  src={post.memoryMeta.thenPhotoUrl}
                  alt="Dulu"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full mb-1.5">
                SEKARANG (2026)
              </span>
              <div className="w-full h-48 rounded-lg overflow-hidden bg-slate-200">
                <img
                  src={post.memoryMeta.nowPhotoUrl}
                  alt="Sekarang"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      ) : post.media && post.media.length > 0 ? (
        <div className="relative bg-slate-950 w-full overflow-hidden">
          {post.media[activeMediaIndex]?.type === 'video' ? (
            <video
              src={post.media[activeMediaIndex]?.url}
              controls
              playsInline
              className="w-full max-h-[480px] object-contain mx-auto"
            />
          ) : (
            <img
              src={post.media[activeMediaIndex]?.url}
              alt="Media postingan"
              className="w-full max-h-[500px] object-contain mx-auto"
            />
          )}

          {/* Multi-image indicators and arrows */}
          {post.media.length > 1 && (
            <>
              {activeMediaIndex > 0 && (
                <button
                  onClick={() => setActiveMediaIndex(activeMediaIndex - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
              {activeMediaIndex < post.media.length - 1 && (
                <button
                  onClick={() => setActiveMediaIndex(activeMediaIndex + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <ChevronRight size={18} />
                </button>
              )}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full">
                {post.media.map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === activeMediaIndex ? 'bg-white w-3' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* 4. Reaction Count Summary: Max 2 Names + Selebihnya Link */}
      {reactionCount > 0 && (
        <div className="px-4 py-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-50">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center -space-x-1">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-100 text-[10px] shadow-2xs z-10">❤️</span>
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-[10px] shadow-2xs">👏</span>
            </span>

            {/* Names display: 1 name, 2 names, or 2 names + X selebihnya */}
            {reactors.length === 1 ? (
              <span className="text-slate-700 font-normal">
                <button
                  type="button"
                  onClick={() => setShowReactionsModal(true)}
                  className="font-semibold text-slate-900 hover:text-brand-primary hover:underline transition-colors cursor-pointer"
                >
                  {reactors[0].fullName}
                </button>{' '}
                menyukai ini
              </span>
            ) : reactors.length === 2 ? (
              <span className="text-slate-700 font-normal">
                <button
                  type="button"
                  onClick={() => setShowReactionsModal(true)}
                  className="font-semibold text-slate-900 hover:text-brand-primary hover:underline transition-colors cursor-pointer"
                >
                  {reactors[0].fullName}
                </button>
                {' dan '}
                <button
                  type="button"
                  onClick={() => setShowReactionsModal(true)}
                  className="font-semibold text-slate-900 hover:text-brand-primary hover:underline transition-colors cursor-pointer"
                >
                  {reactors[1].fullName}
                </button>
              </span>
            ) : reactors.length > 2 || reactionCount > 2 ? (
              <span className="text-slate-700 font-normal">
                <button
                  type="button"
                  onClick={() => setShowReactionsModal(true)}
                  className="font-semibold text-slate-900 hover:text-brand-primary hover:underline transition-colors cursor-pointer"
                >
                  {reactors[0]?.fullName || 'Alumni 59'}
                </button>
                {', '}
                <button
                  type="button"
                  onClick={() => setShowReactionsModal(true)}
                  className="font-semibold text-slate-900 hover:text-brand-primary hover:underline transition-colors cursor-pointer"
                >
                  {reactors[1]?.fullName || 'Alumni 59'}
                </button>
                {', dan '}
                <button
                  type="button"
                  onClick={() => setShowReactionsModal(true)}
                  className="font-bold text-brand-primary hover:text-brand-primaryDark hover:underline transition-colors cursor-pointer"
                >
                  {Math.max(reactors.length - 2, reactionCount - 2)} selebihnya
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowReactionsModal(true)}
                className="font-semibold text-slate-900 hover:text-brand-primary hover:underline cursor-pointer"
              >
                {reactionCount} Reaksi
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {commentCount > 0 && (
              <button
                type="button"
                onClick={handleToggleComments}
                className="hover:underline text-slate-500 hover:text-brand-primary transition-colors text-xs font-medium cursor-pointer"
              >
                {commentCount} komentar
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. Interaction Buttons */}
      <div className="px-2 py-1 border-t border-slate-100 flex items-center justify-around relative">
        {/* Reaksi Button with Popover */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer ${
              userReaction
                ? REACTION_EMOJIS[userReaction]?.color
                : 'text-slate-600'
            }`}
          >
            <span className="text-base">
              {userReaction ? REACTION_EMOJIS[userReaction]?.emoji : '👍'}
            </span>
            <span>{userReaction ? REACTION_EMOJIS[userReaction]?.label : 'Reaksi'}</span>
          </button>

          {/* Reaction Picker Bar */}
          {showReactionPicker && (
            <div className="absolute -top-12 left-0 sm:left-4 z-20 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-slate-200 px-3 py-1.5 flex items-center gap-2.5 animate-in fade-in zoom-in-90 duration-150">
              {(Object.keys(REACTION_EMOJIS) as Array<keyof typeof REACTION_EMOJIS>).map((type) => (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  className="hover:scale-125 active:scale-95 transition-transform text-xl p-1 cursor-pointer"
                  title={REACTION_EMOJIS[type].label}
                >
                  {REACTION_EMOJIS[type].emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Komentar Button */}
        <button
          onClick={handleToggleComments}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
        >
          <MessageCircle size={17} />
          <span>Komentar {commentCount > 0 ? `(${commentCount})` : ''}</span>
        </button>

        {/* Bagikan Button */}
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
        >
          <Share2 size={17} />
          <span>Bagikan</span>
        </button>
      </div>

      {/* 6. Comments Section (Max 3 Top-Level Comments with Replies) */}
      {showComments && (
        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 animate-in fade-in duration-150">
          {/* Comments List */}
          <div className="space-y-2.5 mb-3">
            {isLoadingComments ? (
              <div className="flex items-center justify-center py-4 gap-2 text-xs text-slate-400">
                <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                <span>Memuat komentar...</span>
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">
                Belum ada komentar. Jadilah yang pertama berkomentar!
              </p>
            ) : (
              <>
                {visibleParents.map((parentComment) => {
                  const childReplies = comments.filter((c) => c.parentId === parentComment.id);
                  return (
                    <div key={parentComment.id} className="space-y-2">
                      {/* Parent Comment */}
                      <div className="flex items-start gap-2.5">
                        <AppAvatar
                          src={parentComment.author?.profile?.profilePhotoUrl || parentComment.authorPhotoUrl}
                          name={parentComment.author?.profile?.fullName || parentComment.authorName || 'Alumni'}
                          size="xs"
                        />
                        <div className="flex-1 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">
                              {parentComment.author?.profile?.fullName || parentComment.authorName || 'Alumni'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {parentComment.createdAt ? formatDistanceToNow(new Date(parentComment.createdAt), { locale: localeId }) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed">{parentComment.text}</p>
                          <div className="mt-1.5 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingTo({
                                  id: parentComment.id,
                                  name: parentComment.author?.profile?.fullName || parentComment.authorName || 'Alumni',
                                });
                              }}
                              className="text-[11px] font-semibold text-slate-500 hover:text-brand-primary transition-colors cursor-pointer"
                            >
                              Balas
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Child Replies */}
                      {childReplies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2.5 pl-8">
                          <AppAvatar
                            src={reply.author?.profile?.profilePhotoUrl || reply.authorPhotoUrl}
                            name={reply.author?.profile?.fullName || reply.authorName || 'Alumni'}
                            size="xs"
                          />
                          <div className="flex-1 bg-slate-50/90 p-2.5 rounded-2xl border border-slate-200/60 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900">
                                  {reply.author?.profile?.fullName || reply.authorName || 'Alumni'}
                                </span>
                                {reply.parentAuthorName && (
                                  <span className="text-[10px] font-medium text-brand-primary">
                                    → @{reply.parentAuthorName}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {reply.createdAt ? formatDistanceToNow(new Date(reply.createdAt), { locale: localeId }) : ''}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 mt-1 leading-relaxed">{reply.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {/* More Comments Button: triggers Modal */}
                {hasMoreComments && (
                  <button
                    type="button"
                    onClick={handleOpenAllCommentsModal}
                    className="w-full text-center py-2 px-3 text-xs font-semibold text-brand-primary bg-slate-100/90 hover:bg-slate-200/80 rounded-xl transition-all my-1 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <MessageCircle size={14} />
                    <span>Lihat {parentComments.length - 3} komentar selebihnya...</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Replying banner */}
          {replyingTo && (
            <div className="flex items-center justify-between bg-brand-primary/10 px-3 py-1.5 rounded-lg mb-2 text-xs text-brand-primary font-medium">
              <span>Membalas @{replyingTo.name}</span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Inline Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={(e) => handleCommentSubmit(e)} className="flex items-center gap-2">
              <AppAvatar
                src={profile?.profilePhotoUrl}
                name={profile?.fullName || 'Saya'}
                size="xs"
              />
              <input
                type="text"
                placeholder={replyingTo ? `Balas @${replyingTo.name}...` : 'Tulis komentar alumni...'}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={isSubmittingComment}
                className="flex-1 bg-white border border-slate-200 rounded-full px-3.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-brand-primary"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="p-1.5 bg-brand-primary text-white rounded-full hover:bg-brand-primaryDark disabled:opacity-40 transition-opacity cursor-pointer"
              >
                <Send size={14} />
              </button>
            </form>
          ) : (
            <div className="text-center py-1">
              <Link href="/login" className="text-xs text-brand-primary font-semibold hover:underline">
                Masuk untuk menulis komentar
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 1: WHO REACTED (REAKSI ALUMNI)
          ══════════════════════════════════════════════════════════════════ */}
      {showReactionsModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowReactionsModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">❤️👏</span>
                <h3 className="font-bold text-sm text-slate-900">
                  Reaksi Alumni ({reactors.length || reactionCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReactionsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-3 border-b border-slate-100 overflow-x-auto bg-white">
              {(['all', 'kangen', 'salut', 'suka', 'semangat'] as const).map((tab) => {
                const count = tab === 'all'
                  ? reactors.length
                  : reactors.filter((r) => r.reaction === tab).length;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setReactionsFilterTab(tab)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                      reactionsFilterTab === tab
                        ? 'bg-brand-primary text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tab === 'all' ? 'Semua' : REACTION_EMOJIS[tab]?.emoji}</span>
                    <span>{tab === 'all' ? `(${reactors.length})` : `(${count})`}</span>
                  </button>
                );
              })}
            </div>

            {/* Reactor List */}
            <div className="p-3 overflow-y-auto flex-1 divide-y divide-slate-50">
              {filteredReactors.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada reaksi pada kategori ini.
                </div>
              ) : (
                filteredReactors.map((item, idx) => (
                  <div key={item.uid || idx} className="py-2.5 flex items-center justify-between">
                    <Link
                      href={`/profile/${item.uid}`}
                      onClick={() => setShowReactionsModal(false)}
                      className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                    >
                      <AppAvatar src={item.photoUrl} name={item.fullName} size="sm" />
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-900">{item.fullName}</span>
                        <span className="text-[11px] text-slate-500">{item.className || 'Alumni 99'}</span>
                      </div>
                    </Link>
                    <span className="text-lg px-2 py-1 bg-slate-50 rounded-full border border-slate-100">
                      {REACTION_EMOJIS[item.reaction]?.emoji || '❤️'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 2: ALL COMMENTS (SEMUA KOMENTAR POPUP)
          ══════════════════════════════════════════════════════════════════ */}
      {showAllCommentsModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setShowAllCommentsModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-brand-primary" />
                <h3 className="font-bold text-sm text-slate-900">
                  Semua Komentar ({comments.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAllCommentsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Comments Thread */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3.5 divide-y divide-slate-50">
              {parentComments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Belum ada komentar pada postingan ini.
                </div>
              ) : (
                parentComments.map((parentComment) => {
                  const childReplies = comments.filter((c) => c.parentId === parentComment.id);
                  return (
                    <div key={parentComment.id} className="pt-3 first:pt-0 space-y-2">
                      {/* Parent */}
                      <div className="flex items-start gap-2.5">
                        <AppAvatar
                          src={parentComment.author?.profile?.profilePhotoUrl || parentComment.authorPhotoUrl}
                          name={parentComment.author?.profile?.fullName || parentComment.authorName || 'Alumni'}
                          size="sm"
                        />
                        <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">
                              {parentComment.author?.profile?.fullName || parentComment.authorName || 'Alumni'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {parentComment.createdAt ? formatDistanceToNow(new Date(parentComment.createdAt), { locale: localeId }) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-1 leading-relaxed">{parentComment.text}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingTo({
                                  id: parentComment.id,
                                  name: parentComment.author?.profile?.fullName || parentComment.authorName || 'Alumni',
                                });
                              }}
                              className="text-[11px] font-semibold text-brand-primary hover:underline cursor-pointer"
                            >
                              Balas
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Child Replies */}
                      {childReplies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2.5 pl-8">
                          <AppAvatar
                            src={reply.author?.profile?.profilePhotoUrl || reply.authorPhotoUrl}
                            name={reply.author?.profile?.fullName || reply.authorName || 'Alumni'}
                            size="xs"
                          />
                          <div className="flex-1 bg-slate-100/80 p-2.5 rounded-2xl border border-slate-200/60">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900">
                                  {reply.author?.profile?.fullName || reply.authorName || 'Alumni'}
                                </span>
                                {reply.parentAuthorName && (
                                  <span className="text-[10px] font-medium text-brand-primary">
                                    → @{reply.parentAuthorName}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {reply.createdAt ? formatDistanceToNow(new Date(reply.createdAt), { locale: localeId }) : ''}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 mt-1 leading-relaxed">{reply.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>

            {/* Replying Banner inside Modal */}
            {replyingTo && (
              <div className="flex items-center justify-between bg-brand-primary/10 px-4 py-2 text-xs text-brand-primary font-medium border-t border-brand-primary/20">
                <span>Membalas @{replyingTo.name}</span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Sticky Input in Modal */}
            {isAuthenticated ? (
              <form
                onSubmit={(e) => handleCommentSubmit(e, modalCommentText)}
                className="p-3 border-t border-slate-100 bg-white flex items-center gap-2"
              >
                <AppAvatar
                  src={profile?.profilePhotoUrl}
                  name={profile?.fullName || 'Saya'}
                  size="xs"
                />
                <input
                  type="text"
                  placeholder={replyingTo ? `Balas @${replyingTo.name}...` : 'Tulis komentar alumni...'}
                  value={modalCommentText}
                  onChange={(e) => setModalCommentText(e.target.value)}
                  disabled={isSubmittingModalComment}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-primary"
                />
                <button
                  type="submit"
                  disabled={isSubmittingModalComment || !modalCommentText.trim()}
                  className="p-2 bg-brand-primary text-white rounded-full hover:bg-brand-primaryDark disabled:opacity-40 transition-opacity cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </form>
            ) : (
              <div className="p-3 text-center border-t border-slate-100 bg-slate-50 text-xs">
                <Link href="/login" className="text-brand-primary font-semibold hover:underline">
                  Masuk untuk menulis komentar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

