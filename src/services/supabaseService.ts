import { supabase } from '../lib/supabase';
import {
  User,
  CategoryItem,
  ContentCategoryItem,
  KnowledgeArticle,
  HandoverDoc,
  ForumTopic,
  ForumComment,
  ActivityLog,
  PendingDoc,
  AppNotification
} from '../types';
import { formatBytes, parseBytes } from '../utils/fileTypeHelper';
import { formatDateToISO, formatDateToIndonesian, calculateTimeAgo } from '../utils/dateUtils';

// ================= SUPABASE STORAGE FILE UPLOAD =================
export const uploadFileToSupabaseStorage = async (file: File | Blob, customFileName?: string): Promise<string | null> => {
  try {
    const rawName = (file as File).name || customFileName || `file_${Date.now()}.pdf`;
    const cleanFileName = `${Date.now()}_${rawName.replace(/[^\w.-]/g, '_')}`;
    const filePath = `uploads/${cleanFileName}`;

    const uploadPromise = async () => {
      // 1. Try 'kms-files' bucket
      const { data, error } = await supabase.storage
        .from('kms-files')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (!error && data?.path) {
        const { data: pubData } = supabase.storage.from('kms-files').getPublicUrl(data.path);
        return pubData?.publicUrl || null;
      }

      // 2. Try 'kms-file' bucket
      const { data: data2, error: error2 } = await supabase.storage
        .from('kms-file')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (!error2 && data2?.path) {
        const { data: pubData } = supabase.storage.from('kms-file').getPublicUrl(data2.path);
        if (pubData?.publicUrl) {
          return pubData.publicUrl;
        }
      }

      if (error || error2) {
        console.warn('Supabase Storage Upload policy warning:', error?.message || error2?.message);
      }
      return null;
    };

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000));

    return await Promise.race([uploadPromise(), timeoutPromise]);
  } catch (err) {
    console.error('Error uploading file to Supabase Storage:', err);
    return null;
  }
};

// ================= USERS / PROFILES =================
export const getProfilesFromSupabase = async (): Promise<User[] | null> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error || !data) return null;
  return data.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    division: u.division || '',
    status: typeof u.status === 'boolean' ? (u.status ? 'Aktif' : 'Nonaktif') : (u.status || 'Aktif'),
    joinDate: formatDateToIndonesian(u.join_date),
    initials: u.initials || '',
    avatar: u.avatar || undefined,
    password: u.password || undefined,
    mustChangePassword: u.must_change_password !== undefined ? Boolean(u.must_change_password) : false
  }));
};

export const saveProfileToSupabase = async (user: User) => {
  const { data, error } = await supabase.from('profiles').upsert({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    division: user.division,
    status: user.status === 'Aktif',
    join_date: formatDateToISO(user.joinDate),
    initials: user.initials,
    avatar: user.avatar,
    password: user.password,
    must_change_password: user.mustChangePassword || false
  }).select();

  if (error) {
    console.error('Gagal simpan profil ke Supabase:', error);
    alert(`❌ GAGAL simpan profil ke database Supabase:\n[Code: ${error.code || 'UNKNOWN'}] ${error.message}`);
    throw error;
  }
  return data;
};

export const deleteProfileFromSupabase = async (id: string) => {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) {
    console.error('Gagal hapus profil dari Supabase:', error);
    alert(`❌ GAGAL hapus profil dari database Supabase:\n[Code: ${error.code || 'UNKNOWN'}] ${error.message}`);
    throw error;
  }
};

// ================= CATEGORIES (Divisi) =================
export const getCategoriesFromSupabase = async (): Promise<CategoryItem[] | null> => {
  const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
  if (error || !data) return null;
  return data.map((c) => ({
    id: c.id,
    code: c.code || '',
    name: c.name,
    description: c.description || '',
    contentCount: c.content_count || 0,
    icon: c.icon || 'folder'
  }));
};

export const saveCategoryToSupabase = async (category: CategoryItem) => {
  const { data, error } = await supabase.from('categories').upsert({
    id: category.id,
    code: category.code,
    name: category.name,
    description: category.description,
    content_count: category.contentCount,
    icon: category.icon
  }).select();

  if (error) {
    console.error('Gagal simpan kategori ke Supabase:', error);
    alert(`❌ GAGAL simpan kategori ke database Supabase:\n[Code: ${error.code || 'UNKNOWN'}] ${error.message}`);
    throw error;
  }
  return data;
};

export const deleteCategoryFromSupabase = async (id: string) => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) {
    console.error('Gagal hapus kategori dari Supabase:', error);
    alert(`❌ GAGAL hapus kategori dari database Supabase:\n[Code: ${error.code || 'UNKNOWN'}] ${error.message}`);
    throw error;
  }
};

// ================= CONTENT CATEGORIES (Kategori Konten Pengetahuan) =================
export const getContentCategoriesFromSupabase = async (): Promise<ContentCategoryItem[] | null> => {
  const { data, error } = await supabase.from('content_categories').select('*').order('created_at', { ascending: true });
  if (error || !data) return null;
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description || '',
    contentCount: c.content_count || 0
  }));
};

export const saveContentCategoryToSupabase = async (cat: ContentCategoryItem) => {
  const { data, error } = await supabase.from('content_categories').upsert({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    content_count: cat.contentCount
  }).select();

  if (error) {
    console.error('Gagal simpan kategori konten ke Supabase:', error);
    alert(`❌ GAGAL simpan kategori konten ke database Supabase:\n[Code: ${error.code || 'UNKNOWN'}] ${error.message}`);
    throw error;
  }
  return data;
};

export const deleteContentCategoryFromSupabase = async (id: string) => {
  const { error } = await supabase.from('content_categories').delete().eq('id', id);
  if (error) {
    console.error('Gagal hapus kategori konten dari Supabase:', error);
    alert(`❌ GAGAL hapus kategori konten dari database Supabase:\n[Code: ${error.code || 'UNKNOWN'}] ${error.message}`);
    throw error;
  }
};

// ================= KNOWLEDGE ARTICLES =================
export const getArticlesFromSupabase = async (): Promise<KnowledgeArticle[] | null> => {
  const { data: catData } = await supabase.from('content_categories').select('*');
  const catMap = new Map((catData || []).map((c) => [c.id, c.name]));

  const { data, error } = await supabase.from('knowledge_articles').select('*').order('created_at', { ascending: false });
  if (error || !data) return null;
  return data.map((a) => ({
    id: a.id,
    title: a.title,
    division: a.division || a.category || '',
    category: a.division || a.category || '',
    contentCategoryId: a.content_category_id || 'cc-002',
    contentCategoryName: catMap.get(a.content_category_id) || catMap.get('cc-002') || 'Materi Pelatihan',
    summary: a.summary || '',
    author: a.author || '',
    date: formatDateToIndonesian(a.date),
    fileType: a.file_type || 'PDF',
    views: a.views || 0,
    downloads: a.downloads || 0,
    downloadUrl: a.download_url || undefined,
    contentType: a.content_type || 'file',
    linkUrl: a.link_url || undefined,
    fileUrl: a.file_url || undefined
  }));
};

export const saveArticleToSupabase = async (article: KnowledgeArticle) => {
  const fullPayload = {
    id: article.id,
    title: article.title,
    division: article.division || article.category,
    content_category_id: article.contentCategoryId || 'cc-002',
    summary: article.summary,
    author: article.author,
    date: formatDateToISO(article.date),
    file_type: article.fileType,
    views: article.views || 0,
    downloads: article.downloads || 0,
    download_url: article.downloadUrl || null,
    content_type: article.contentType || 'file',
    link_url: article.linkUrl || null,
    file_url: article.fileUrl || null
  };

  let { data, error } = await supabase.from('knowledge_articles').upsert(fullPayload).select();

  if (error) {
    console.warn('Upsert full article payload failed, retrying core fields:', error.message);
    const corePayload = {
      id: article.id,
      title: article.title,
      division: article.division || article.category,
      content_category_id: article.contentCategoryId || 'cc-002',
      summary: article.summary,
      author: article.author,
      date: formatDateToISO(article.date),
      file_type: article.fileType,
      views: article.views || 0
    };
    const retry = await supabase.from('knowledge_articles').upsert(corePayload).select();
    if (retry.error) {
      console.error('Gagal simpan artikel ke Supabase:', retry.error);
      alert(`❌ GAGAL simpan artikel ke database Supabase:\n[Code: ${retry.error.code || 'UNKNOWN'}] ${retry.error.message}\n\nSilakan jalankan SQL Script RLS & Schema di Supabase SQL Editor.`);
      throw retry.error;
    }
    return retry.data;
  }
  return data;
};

export const deleteArticleFromSupabase = async (id: string) => {
  const { error } = await supabase.from('knowledge_articles').delete().eq('id', id);
  if (error) {
    console.error('Gagal hapus artikel dari Supabase:', error);
    alert(`❌ GAGAL hapus artikel dari database Supabase:\n[Code: ${error.code || 'UNKNOWN'}] ${error.message}`);
    throw error;
  }
};

// ================= HANDOVER DOCS =================
export const getHandoverDocsFromSupabase = async (): Promise<HandoverDoc[] | null> => {
  const { data, error } = await supabase.from('handover_docs').select('*').order('created_at', { ascending: false });
  if (error || !data) return null;
  return data.map((h) => ({
    id: h.id,
    title: h.title,
    fileType: h.file_type || (h.content_type === 'link' ? 'LINK' : 'PDF'),
    fileSize: formatBytes(h.file_size),
    rotationPeriod: h.rotation_period || '',
    division: h.division || '',
    submitDate: formatDateToIndonesian(h.submit_date),
    author: h.author || '',
    authorRole: h.author_role || 'Karyawan',
    description: h.description || '',
    contentType: h.content_type || 'file',
    linkUrl: h.link_url || undefined,
    fileUrl: h.file_url || undefined,
    views: h.views || 0,
    downloads: h.downloads || 0
  }));
};

export const saveHandoverDocToSupabase = async (doc: HandoverDoc) => {
  const dbFileType = doc.fileType === 'LINK' ? null : doc.fileType;
  const fullPayload = {
    id: doc.id,
    title: doc.title,
    file_type: dbFileType,
    file_size: parseBytes(doc.fileSize),
    rotation_period: doc.rotationPeriod,
    division: doc.division,
    submit_date: formatDateToISO(doc.submitDate),
    author: doc.author,
    author_role: doc.authorRole || 'Karyawan',
    description: doc.description,
    content_type: doc.contentType || 'file',
    link_url: doc.linkUrl || null,
    file_url: doc.fileUrl || null
  };

  let { data, error } = await supabase.from('handover_docs').upsert(fullPayload).select();

  if (error) {
    console.warn('Upsert full handover doc payload failed, retrying core fields:', error.message);
    const corePayload = {
      id: doc.id,
      title: doc.title,
      file_type: dbFileType,
      file_size: parseBytes(doc.fileSize),
      rotation_period: doc.rotationPeriod,
      division: doc.division,
      submit_date: formatDateToISO(doc.submitDate),
      author: doc.author,
      author_role: doc.authorRole || 'Karyawan',
      description: doc.description
    };
    const retry = await supabase.from('handover_docs').upsert(corePayload).select();
    if (retry.error) {
      console.error('Gagal simpan handover doc ke Supabase:', retry.error);
      alert(`❌ GAGAL simpan handover doc ke database Supabase:\n[Code: ${retry.error.code || 'UNKNOWN'}] ${retry.error.message}\n\nSilakan jalankan SQL Script RLS & Schema di Supabase SQL Editor.`);
      throw retry.error;
    }
    return retry.data;
  }
  return data;
};

export const deleteHandoverDocFromSupabase = async (id: string) => {
  const { error } = await supabase.from('handover_docs').delete().eq('id', id);
  if (error) {
    console.error('Gagal hapus handover doc dari Supabase:', error);
    alert(`❌ GAGAL hapus handover doc dari database Supabase:\n[Code: ${error.code || 'UNKNOWN'}] ${error.message}`);
    throw error;
  }
};

// ================= FORUM TOPICS =================
export const getForumTopicsFromSupabase = async (): Promise<ForumTopic[] | null> => {
  const { data, error } = await supabase.from('forum_topics').select('*, forum_comments(*)').order('created_at', { ascending: false });
  if (error || !data) return null;
  return data.map((t) => {
    const createdDate = t.created_at ? new Date(t.created_at) : new Date();
    const formattedDate = createdDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = createdDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    return {
      id: t.id,
      title: t.title,
      category: t.category,
      author: t.author,
      authorRole: t.author_role || 'Karyawan',
      authorAvatar: t.author_avatar || undefined,
      authorInitials: t.author_initials || '',
      date: formattedDate,
      time: formattedTime,
      views: t.views || 0,
      commentCount: (t.forum_comments && t.forum_comments.length) || t.comment_count || 0,
      content: t.content || '',
      tags: t.tags || [],
      created_at: t.created_at,
      comments: (t.forum_comments || []).map((c: any) => {
        const commentDate = c.created_at ? new Date(c.created_at) : new Date();
        return {
          id: c.id,
          author: c.author,
          authorRole: c.author_role || '',
          avatar: c.avatar || undefined,
          initials: c.initials || '',
          content: c.content,
          timestamp: commentDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          isPinned: c.is_pinned || false,
          parentId: c.parent_id || null,
          likes: c.likes || 0
        };
      })
    };
  });
};

export const saveForumTopicToSupabase = async (topic: ForumTopic) => {
  const { data, error } = await supabase.from('forum_topics').upsert({
    id: topic.id,
    title: topic.title,
    category: topic.category,
    author: topic.author,
    author_role: topic.authorRole,
    author_avatar: topic.authorAvatar,
    author_initials: topic.authorInitials,
    views: topic.views,
    comment_count: topic.commentCount,
    content: topic.content,
    tags: topic.tags
  }).select();

  if (error) {
    console.error('Gagal simpan forum topic ke Supabase:', error);
    alert(`❌ GAGAL simpan forum topic ke database Supabase:\n[Code: ${error.code || 'UNKNOWN'}] ${error.message}`);
    throw error;
  }
  return data;
};

export const saveForumCommentToSupabase = async (topicId: string, comment: ForumComment) => {
  const payload: any = {
    id: comment.id,
    topic_id: topicId,
    author: comment.author,
    author_role: comment.authorRole,
    avatar: comment.avatar,
    initials: comment.initials,
    content: comment.content,
    likes: comment.likes || 0,
    is_pinned: comment.isPinned || false,
    parent_id: comment.parentId || null
  };

  let { data, error } = await supabase.from('forum_comments').upsert(payload).select();

  if (error) {
    console.warn('Upsert with parent_id/is_pinned failed, retrying basic fields:', error.message);
    const fallbackPayload = {
      id: comment.id,
      topic_id: topicId,
      author: comment.author,
      author_role: comment.authorRole,
      avatar: comment.avatar,
      initials: comment.initials,
      content: comment.content
    };
    const retry = await supabase.from('forum_comments').upsert(fallbackPayload).select();
    if (retry.error) {
      console.error('Gagal simpan forum comment ke Supabase:', retry.error);
      alert(`❌ GAGAL simpan komentar forum ke database Supabase:\n[Code: ${retry.error.code || 'UNKNOWN'}] ${retry.error.message}`);
      throw retry.error;
    }
    return retry.data;
  }
  return data;
};

export const deleteForumTopicFromSupabase = async (id: string) => {
  const { error } = await supabase.from('forum_topics').delete().eq('id', id);
  if (error) {
    console.error('Gagal hapus forum topic dari Supabase:', error);
    alert(`❌ GAGAL hapus topik forum dari database Supabase:\n[Code: ${error.code || 'UNKNOWN'}] ${error.message}`);
    throw error;
  }
};

export const deleteForumCommentFromSupabase = async (commentId: string) => {
  const { error } = await supabase.from('forum_comments').delete().eq('id', commentId);
  if (error) {
    console.error('Gagal hapus forum comment dari Supabase:', error);
    alert(`❌ GAGAL hapus komentar forum dari database Supabase:\n[Code: ${error.code || 'UNKNOWN'}] ${error.message}`);
    throw error;
  }
};

// ================= PENDING DOCS =================
export const getPendingDocsFromSupabase = async (): Promise<PendingDoc[] | null> => {
  const { data, error } = await supabase.from('pending_docs').select('*').order('created_at', { ascending: false });
  if (error || !data) return null;
  return data.map((p) => {
    const createdDate = p.created_at ? new Date(p.created_at) : new Date();
    const isExternalLink = p.file_url && (p.file_url.startsWith('http://') || p.file_url.startsWith('https://')) && !p.file_url.includes('/storage/v1/');
    const extractedLinkUrl = isExternalLink ? p.file_url : (p.file_name && (p.file_name.startsWith('http://') || p.file_name.startsWith('https://')) ? p.file_name : undefined);

    return {
      id: p.id,
      title: p.title,
      category: p.category,
      author: p.author,
      subDivision: p.category,
      submitDate: createdDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      submitTime: createdDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      fileName: p.file_name || '',
      fileSize: extractedLinkUrl ? 'Tautan Eksternal' : formatBytes(p.file_size),
      description: p.description || '',
      tags: p.tags || [],
      status: p.status || 'Menunggu Verifikasi',
      note: p.note || undefined,
      fileUrl: p.file_url || undefined,
      linkUrl: extractedLinkUrl
    };
  });
};

export const savePendingDocToSupabase = async (doc: PendingDoc) => {
  const { data, error } = await supabase.from('pending_docs').upsert({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    author: doc.author,
    file_name: doc.fileName,
    file_size: parseBytes(doc.fileSize),
    description: doc.description,
    tags: doc.tags,
    status: doc.status,
    note: doc.note,
    file_url: doc.fileUrl
  }).select();

  if (error) {
    console.error('Gagal simpan pending doc ke Supabase:', error);
    alert(`❌ GAGAL simpan pending doc ke database Supabase:\n[Code: ${error.code || 'UNKNOWN'}] ${error.message}`);
    throw error;
  }
  return data;
};

// ================= ACTIVITIES =================
export const getActivitiesFromSupabase = async (): Promise<ActivityLog[] | null> => {
  const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false });
  if (error || !data) return null;
  return data.map((a) => ({
    id: a.id,
    user: a.user_name || a.user || '',
    userInitials: a.user_initials || '',
    userAvatar: a.user_avatar || undefined,
    department: a.department || '',
    action: a.action,
    timeAgo: calculateTimeAgo(a.created_at),
    status: a.status || 'BERHASIL'
  }));
};

export const saveActivityToSupabase = async (activity: ActivityLog) => {
  const { data, error } = await supabase.from('activity_logs').upsert({
    id: activity.id,
    user_name: activity.user,
    user_initials: activity.userInitials,
    user_avatar: activity.userAvatar,
    department: activity.department,
    action: activity.action,
    status: activity.status
  }).select();

  if (error) {
    console.error('Gagal simpan activity ke Supabase:', error);
    alert(`❌ GAGAL simpan log aktivitas ke database Supabase:\n[Code: ${error.code || 'UNKNOWN'}] ${error.message}`);
    throw error;
  }
  return data;
};

// ================= NOTIFICATIONS =================
export const getNotificationsFromSupabase = async (): Promise<AppNotification[] | null> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !data) {
    if (error) console.error('Error fetching notifications from Supabase:', error.message);
    return null;
  }

  return data.map((n) => ({
    id: n.id,
    title: n.title,
    desc: n.description,
    time: n.time || 'Baru saja',
    createdAt: typeof n.created_at === 'string' ? new Date(n.created_at).getTime() : n.created_at,
    author: n.author || '',
    targetUserId: n.target_user_id || undefined,
    targetUserName: n.target_user_name || undefined,
    targetDivision: n.target_division || undefined,
    targetRoles: n.target_roles || undefined,
    excludeUploaderName: n.exclude_uploader_name || undefined,
    type: n.type || 'info',
    read: Boolean(n.read)
  }));
};

export const saveNotificationToSupabase = async (notif: AppNotification) => {
  const createdAtIso = notif.createdAt
    ? new Date(notif.createdAt).toISOString()
    : new Date().toISOString();

  const { data, error } = await supabase.from('notifications').upsert({
    id: notif.id,
    title: notif.title,
    description: notif.desc,
    time: notif.time,
    created_at: createdAtIso,
    author: notif.author || 'System',
    target_user_id: notif.targetUserId || null,
    target_user_name: notif.targetUserName || null,
    target_division: notif.targetDivision || null,
    target_roles: notif.targetRoles || null,
    exclude_uploader_name: notif.excludeUploaderName || null,
    type: notif.type || 'info',
    read: Boolean(notif.read)
  }).select();

  if (error) {
    console.error('Error saving notification to Supabase:', error.message);
  }
  return data;
};

export const deleteNotificationFromSupabase = async (id: string) => {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) {
    console.error('Error deleting notification from Supabase:', error.message);
  }
};
