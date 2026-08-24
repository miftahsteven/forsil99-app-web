export type VerificationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'need_revision'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type UserRole = 'alumni' | 'seller' | 'moderator' | 'admin' | 'super_admin';

export type ProfileVisibility = 'verified_alumni' | 'same_class' | 'only_me' | 'public';

export interface UserAccount {
  id: string;
  uid?: string;
  phoneNumber?: string;
  email?: string;
  verificationStatus: VerificationStatus;
  roles: UserRole[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AlumniProfile {
  id?: string;
  uid: string;
  userId?: string;
  accountId?: string;
  fullName: string;
  nickname?: string;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  graduationYear: number;
  schoolCode: 'SMAN59JKT' | string;
  className?: string;
  major?: string;
  nia?: string;
  birthDate?: string;
  city?: string;
  province?: string;
  occupation?: string;
  company?: string;
  businessField?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    facebook?: string;
  };
  privacy?: {
    phone?: ProfileVisibility;
    birthDate?: ProfileVisibility;
    occupation?: ProfileVisibility;
    lastSeen?: ProfileVisibility;
  };
  verifiedAt?: string;
  sellerStatus?: 'none' | 'pending' | 'approved' | 'rejected' | 'suspended';
  searchKeywords?: string[];
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    followers?: number;
    following?: number;
  };
  isFollowing?: boolean;
}

export type PostType = 'standard' | 'memory' | 'announcement' | 'help' | 'event' | 'shop_share';

export interface PostMedia {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
}

export interface MemoryMeta {
  year?: number;
  locationName?: string;
  album?: string;
  isThenAndNow?: boolean;
  thenPhotoUrl?: string;
  nowPhotoUrl?: string;
}

export interface PostReaction {
  id?: string;
  postId: string;
  userId: string;
  reactionType: 'suka' | 'kangen' | 'salut' | 'semangat';
  user?: {
    id: string;
    profile?: AlumniProfile;
  };
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author?: {
    id: string;
    profile?: AlumniProfile;
  };
  authorName?: string;
  authorPhotoUrl?: string;
  authorClass?: string;
  authorIsVerified?: boolean;
  text: string;
  createdAt: string;
  parentId?: string;
  parentAuthorName?: string;
  likeCount?: number;
  isLiked?: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  author?: {
    id: string;
    email?: string;
    phoneNumber?: string;
    profile?: AlumniProfile;
  };
  authorName?: string;
  authorNickname?: string;
  authorPhotoUrl?: string;
  authorClass?: string;
  authorIsVerified?: boolean;
  type: PostType;
  text: string;
  media?: PostMedia[];
  taggedUserIds?: string[];
  hashtags?: string[];
  visibility?: ProfileVisibility;
  memoryMeta?: MemoryMeta;
  shopCategory?: string;
  price?: number;
  linkedProductId?: string;
  linkedEventId?: string;
  reactionCount: number;
  userReaction?: 'suka' | 'kangen' | 'salut' | 'semangat';
  reactions?: PostReaction[];
  commentCount: number;
  comments?: Comment[];
  saveCount?: number;
  isPinned?: boolean;
  commentsEnabled?: boolean;
  moderationStatus?: 'visible' | 'hidden' | 'removed' | 'under_review';
  createdAt: string;
  updatedAt?: string;
}

export interface Shop {
  id: string;
  ownerId: string;
  owner?: {
    id: string;
    profile?: AlumniProfile;
  };
  ownerName?: string;
  name: string;
  logoUrl?: string;
  description: string;
  categoryIds: string[];
  businessType: 'product' | 'service' | 'both';
  city?: string;
  serviceAreas: string[];
  contactPhone?: string;
  contactMethod: 'chat' | 'phone' | 'whatsapp';
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended';
  viewCount: number;
  createdAt: string;
  products?: Product[];
}

export interface Product {
  id: string;
  shopId: string;
  shop?: Shop;
  ownerId: string;
  owner?: {
    id: string;
    profile?: AlumniProfile;
  };
  ownerName?: string;
  name: string;
  type: 'product' | 'service';
  categoryId: string;
  categoryName: string;
  description: string;
  imageUrls: string[];
  priceType: 'fixed' | 'starting_from' | 'contact_seller';
  price?: number;
  unit?: string;
  city?: string;
  serviceAreas: string[];
  status: 'draft' | 'active' | 'out_of_stock' | 'inactive';
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LiveLocation {
  userId: string;
  fullName: string;
  nickname?: string;
  photoUrl?: string;
  className?: string;
  occupation?: string;
  company?: string;
  isSharing: boolean;
  lat: number;
  lng: number;
  cityName: string;
  areaName: string;
  updatedAt: string;
  distanceKm?: number;
  distanceText?: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  sender?: {
    id: string;
    profile?: AlumniProfile;
  };
  text: string;
  imageUrl?: string;
  createdAt: string;
  isRead: boolean;
}

export interface ChatThread {
  id: string;
  memberIds: string[];
  members?: {
    id: string;
    profile?: AlumniProfile;
  }[];
  otherUser?: {
    uid: string;
    name: string;
    photoUrl?: string;
    className?: string;
    isVerified?: boolean;
  };
  lastMessageText?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  messages?: ChatMessage[];
}

export interface AlumniEvent {
  id: string;
  title: string;
  description: string;
  coverUrl?: string;
  startAt: string;
  endAt?: string;
  locationName: string;
  address?: string;
  organizerName: string;
  attendeeCount: number;
  userRsvp?: 'hadir' | 'mungkin' | 'tidak';
  status: 'published' | 'completed' | 'cancelled';
  rsvps?: {
    id: string;
    userId: string;
    status: 'hadir' | 'mungkin' | 'tidak';
    user?: {
      id: string;
      profile?: AlumniProfile;
    };
  }[];
}

export interface AppNotification {
  id: string;
  recipientId: string;
  actorId?: string;
  actorName?: string;
  actorPhotoUrl?: string;
  type: 'verification' | 'reaction' | 'comment' | 'chat' | 'shop' | 'event' | 'system';
  title: string;
  body: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

export interface AlumniRegistration {
  id: string;
  googleUid?: string;
  googleEmail: string;
  fullName: string;
  nickname?: string;
  className: string;
  whatsapp: string;
  referralAccountId: string;
  referralName: string;
  selfieBase64?: string;
  selfieUrl?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  adminNotes?: string;
  revisionMessage?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface MemorialPrayer {
  id: string;
  deceasedId: string;
  authorId: string;
  authorName: string;
  authorNickname?: string;
  authorPhotoUrl?: string;
  authorClass?: string;
  text: string;
  createdAt: string;
}

export interface DeceasedAlumni {
  id: string;
  fullName: string;
  nickname?: string;
  className?: string;
  photoUrl?: string;
  passedAwayYear: number;
  passedAwayDate?: string;
  bio?: string;
  createdById?: string;
  flowerCount: number;
  prayerCount: number;
  hasGivenFlower?: boolean;
  flowerExpiresAt?: string | null;
  recentPrayers?: MemorialPrayer[];
  prayers?: MemorialPrayer[];
}

