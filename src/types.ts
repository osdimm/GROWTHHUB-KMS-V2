export type NavigationTab = 
  | 'login'
  | 'dashboard'
  | 'data-pengguna'
  | 'hak-akses'
  | 'knowledge-base'
  | 'verifikasi-konten'
  | 'handover-rotasi'
  | 'forum-diskusi'
  | 'laporan-penggunaan'
  | 'profil-pengguna';

export type UserRole = 
  | 'Admin'
  | 'Manajer'
  | 'Karyawan'
  | 'Associate';

export type Division =
  | 'Talent Acquisition'
  | 'Talent Development'
  | 'Organizational Development'
  | 'Employee Benefit'
  | 'Administration'
  | 'Graphic Design'
  | 'Copywriting'
  | 'Content Coordinator'
  | 'Video Editor'
  | 'Public Relation'
  | 'Social Media Officer'
  | 'Key Opinion Leader Coordinator'
  | 'Representative'
  | 'Program Specialist'
  | 'Project Representative'
  | 'Community & Digital Marketing';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  division: string;
  status: 'Aktif' | 'Nonaktif';
  joinDate: string;
  avatar?: string;
  initials?: string;
  password?: string;
  mustChangePassword?: boolean;
}

export interface CategoryItem {
  id: string;
  code: string;
  name: string;
  description: string;
  contentCount: number;
  icon: string;
}

export interface ContentCategoryItem {
  id: string;
  name: string;
  description?: string;
  contentCount: number;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  division: string;
  category?: string;
  contentCategoryId: string;
  contentCategoryName?: string;
  summary: string;
  author: string;
  date: string;
  fileType: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'LINK';
  views: number;
  downloads?: number;
  downloadUrl?: string;
  contentType?: 'file' | 'link';
  linkUrl?: string;
  fileUrl?: string;
  fileBlob?: File | Blob;
}

export interface HandoverDoc {
  id: string;
  title: string;
  fileType: 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'LINK';
  fileSize: string;
  rotationPeriod: string;
  division: string;
  submitDate: string;
  author: string;
  authorRole: UserRole;
  contentType?: 'file' | 'link';
  linkUrl?: string;
  description?: string;
  fileUrl?: string;
  fileBlob?: File | Blob;
  views?: number;
  downloads?: number;
}

export interface ForumComment {
  id: string;
  author: string;
  authorRole: string;
  avatar?: string;
  initials?: string;
  content: string;
  timestamp: string;
  isPinned?: boolean;
  parentId?: string | null;
  replies?: ForumComment[];
  likes?: number;
  likedBy?: string[];
}

export interface ForumTopic {
  id: string;
  title: string;
  category: string;
  author: string;
  authorRole: string;
  authorAvatar?: string;
  authorInitials?: string;
  date: string;
  time: string;
  views: number;
  commentCount: number;
  content: string;
  tags: string[];
  comments: ForumComment[];
  created_at?: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  userInitials?: string;
  userAvatar?: string;
  department: string;
  action: string;
  timeAgo: string;
  status: 'BERHASIL' | 'TERTUNDA' | 'GAGAL';
}

export interface PendingDoc {
  id: string;
  title: string;
  category: string;
  author: string;
  subDivision?: string;
  submitDate?: string;
  submitTime?: string;
  fileName: string;
  fileSize: string;
  description: string;
  tags: string[];
  status: 'Menunggu Verifikasi' | 'Disetujui' | 'Ditolak';
  articleData?: KnowledgeArticle;
  note?: string;
  linkUrl?: string;
  fileUrl?: string;
  fileBlob?: File | Blob;
}

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  createdAt?: number;
  author?: string;
  targetRoles?: UserRole[];
  targetDivision?: string;
  targetUserId?: string;
  targetUserName?: string;
  excludeUploaderName?: string;
  type?: 'approved' | 'rejected' | 'pending' | 'info';
  read?: boolean;
}

export interface PopularTopic {
  id: number;
  rank: number;
  title: string;
  searches: number;
  trend: 'up' | 'down' | 'neutral';
}

