import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import {
  NavigationTab,
  User,
  CategoryItem,
  ContentCategoryItem,
  KnowledgeArticle,
  HandoverDoc,
  ForumTopic,
  ForumComment,
  ActivityLog,
  PopularTopic,
  UserRole,
  PendingDoc,
  AppNotification
} from './types';
import {
  getProfilesFromSupabase,
  saveProfileToSupabase,
  deleteProfileFromSupabase,
  getCategoriesFromSupabase,
  saveCategoryToSupabase,
  deleteCategoryFromSupabase,
  getContentCategoriesFromSupabase,
  saveContentCategoryToSupabase,
  deleteContentCategoryFromSupabase,
  getArticlesFromSupabase,
  saveArticleToSupabase,
  deleteArticleFromSupabase,
  getHandoverDocsFromSupabase,
  saveHandoverDocToSupabase,
  deleteHandoverDocFromSupabase,
  getForumTopicsFromSupabase,
  saveForumTopicToSupabase,
  saveForumCommentToSupabase,
  deleteForumTopicFromSupabase,
  deleteForumCommentFromSupabase,
  getPendingDocsFromSupabase,
  savePendingDocToSupabase,
  getActivitiesFromSupabase,
  saveActivityToSupabase,
  getNotificationsFromSupabase,
  saveNotificationToSupabase,
  deleteNotificationFromSupabase
} from './services/supabaseService';

import { Sidebar } from './components/Sidebar';
import { Header, ThemeMode } from './components/Header';
import { LogoutModal } from './components/LogoutModal';

// Views
import { LoginPage } from './components/views/LoginPage';
import { DashboardView } from './components/views/DashboardView';
import { DataPenggunaView } from './components/views/DataPenggunaView';
import { HakAksesView } from './components/views/HakAksesView';
import { KnowledgeBaseView } from './components/views/KnowledgeBaseView';
import { VerifikasiKontenView } from './components/views/VerifikasiKontenView';
import { HandoverRotasiView } from './components/views/HandoverRotasiView';
import { ForumDiskusiView } from './components/views/ForumDiskusiView';
import { LaporanPenggunaanView } from './components/views/LaporanPenggunaanView';
import { ProfilPenggunaView } from './components/views/ProfilPenggunaView';

import { autoDetectFileType } from './utils/fileTypeHelper';

// Helpers for safe localStorage setItem to prevent QuotaExceededError crashes
const safeLocalStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Gagal menyimpan cache '${key}' ke localStorage (kemungkinan kuota penuh):`, e);
    try {
      localStorage.removeItem(key);
    } catch {
      // biarkan, tidak fatal
    }
  }
};

const safeSessionStorageSet = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Gagal menyimpan session '${key}' ke sessionStorage:`, e);
  }
};

const stripHeavyFields = (items: any[]) =>
  items.map(({ fileBlob, fileUrl, ...rest }) => ({
    ...rest,
    ...(fileUrl && !fileUrl.startsWith('data:') ? { fileUrl } : {})
  }));

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('kms_is_logged_in') === 'true';
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    const savedLoggedIn = sessionStorage.getItem('kms_is_logged_in') === 'true';
    if (!savedLoggedIn) return 'login';
    const savedTab = sessionStorage.getItem('kms_active_tab');
    return (savedTab as NavigationTab) || 'dashboard';
  });

  const [globalSearch, setGlobalSearch] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Active Role & Current User State (Persisted in sessionStorage per-tab)
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    const saved = sessionStorage.getItem('kms_active_role');
    return (saved as UserRole) || 'Admin';
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return sessionStorage.getItem('kms_current_user_id') || 'u-admin';
  });

  // Theme Mode State (with localStorage persistence & system preference detection)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('kms_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved as ThemeMode;
      }
    } catch (e) {
      console.error(e);
    }
    return 'light';
  });

  // Apply Dark/Light/System theme to document root & body
  useEffect(() => {
    safeLocalStorageSet('kms_theme', themeMode);

    const root = document.documentElement;
    const body = document.body;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
        body.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    if (themeMode === 'system') {
      const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(systemQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => applyTheme(e.matches);
      systemQuery.addEventListener('change', handleChange);
      return () => systemQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(themeMode === 'dark');
    }
  }, [themeMode]);

  // Save session state to sessionStorage safely (per tab isolation)
  useEffect(() => {
    if (isLoggedIn) {
      safeSessionStorageSet('kms_is_logged_in', 'true');
      safeSessionStorageSet('kms_active_tab', activeTab);
      safeSessionStorageSet('kms_active_role', activeRole);
      safeSessionStorageSet('kms_current_user_id', currentUserId);
    } else {
      try {
        sessionStorage.removeItem('kms_is_logged_in');
        sessionStorage.removeItem('kms_active_tab');
        sessionStorage.removeItem('kms_active_role');
        sessionStorage.removeItem('kms_current_user_id');
      } catch (e) {
        console.warn('Gagal remove session state:', e);
      }
    }
  }, [isLoggedIn, activeTab, activeRole, currentUserId]);

  // App Centralized State (with localStorage persistence for views & downloads)
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [contentCategories, setContentCategories] = useState<ContentCategoryItem[]>([]);

  const [articles, setArticles] = useState<KnowledgeArticle[]>(() => {
    try {
      const saved = localStorage.getItem('kms_articles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return stripHeavyFields(parsed);
      }
    } catch (e) {
      console.error('Error loading kms_articles from localStorage', e);
    }
    return [];
  });

  const [handoverDocs, setHandoverDocs] = useState<HandoverDoc[]>(() => {
    try {
      const saved = localStorage.getItem('kms_handover_docs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return stripHeavyFields(parsed);
      }
    } catch (e) {
      console.error('Error loading kms_handover_docs from localStorage', e);
    }
    return [];
  });

  const [forumTopics, setForumTopics] = useState<ForumTopic[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [popularTopics] = useState<PopularTopic[]>([]);
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('kms_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading kms_notifications from localStorage', e);
    }
    return [];
  });
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(true);

  // One-time automatic cleanup for legacy bloated localStorage data
  useEffect(() => {
    try {
      const hasCleaned = localStorage.getItem('kms_storage_v2_cleaned');
      if (!hasCleaned) {
        ['kms_articles', 'kms_handover_docs'].forEach((key) => {
          const raw = localStorage.getItem(key);
          if (raw && (raw.includes('data:') || raw.length > 500000)) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                const cleaned = stripHeavyFields(parsed);
                safeLocalStorageSet(key, JSON.stringify(cleaned));
              }
            } catch {
              try {
                localStorage.removeItem(key);
              } catch {
                // Ignore
              }
            }
          }
        });
        safeLocalStorageSet('kms_storage_v2_cleaned', 'true');
      }
    } catch (err) {
      console.warn('Automatic localStorage cleanup warning:', err);
    }
  }, []);

  // Sync articles, handoverDocs & notifications to localStorage safely
  useEffect(() => {
    if (articles && articles.length > 0) {
      safeLocalStorageSet('kms_articles', JSON.stringify(stripHeavyFields(articles)));
    }
  }, [articles]);

  useEffect(() => {
    if (handoverDocs && handoverDocs.length > 0) {
      safeLocalStorageSet('kms_handover_docs', JSON.stringify(stripHeavyFields(handoverDocs)));
    }
  }, [handoverDocs]);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      safeLocalStorageSet('kms_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  // Fetch Live Data from Supabase on Mount & Smart Merge with localStorage
  useEffect(() => {
    const loadSupabaseData = async () => {
      setIsLoadingSupabase(true);
      try {
        const results = await Promise.allSettled([
          getProfilesFromSupabase(),
          getCategoriesFromSupabase(),
          getContentCategoriesFromSupabase(),
          getArticlesFromSupabase(),
          getHandoverDocsFromSupabase(),
          getForumTopicsFromSupabase(),
          getPendingDocsFromSupabase(),
          getActivitiesFromSupabase(),
          getNotificationsFromSupabase()
        ]);

        const dbUsers = results[0].status === 'fulfilled' ? results[0].value : null;
        const dbCategories = results[1].status === 'fulfilled' ? results[1].value : null;
        const dbContentCategories = results[2].status === 'fulfilled' ? results[2].value : null;
        const dbArticles = results[3].status === 'fulfilled' ? results[3].value : null;
        const dbHandovers = results[4].status === 'fulfilled' ? results[4].value : null;
        const dbTopics = results[5].status === 'fulfilled' ? results[5].value : null;
        const dbPending = results[6].status === 'fulfilled' ? results[6].value : null;
        const dbActivities = results[7].status === 'fulfilled' ? results[7].value : null;
        const dbNotifications = results[8].status === 'fulfilled' ? results[8].value : null;

        if (dbUsers && dbUsers.length > 0) setUsers(dbUsers);
        if (dbCategories !== null) setCategories(dbCategories);
        if (dbContentCategories !== null && dbContentCategories.length > 0) setContentCategories(dbContentCategories);

        if (dbArticles !== null && dbArticles.length > 0) {
          setArticles((prev) => {
            const merged = dbArticles.map((dbArt) => {
              const localMatch = prev.find((p) => p.id === dbArt.id || p.title === dbArt.title);
              if (localMatch) {
                return {
                  ...dbArt,
                  views: Math.max(dbArt.views || 0, localMatch.views || 0),
                  downloads: Math.max(dbArt.downloads || 0, localMatch.downloads || 0)
                };
              }
              return dbArt;
            });
            const dbIds = new Set(dbArticles.map((a) => a.id));
            const localOnly = prev.filter((p) => !dbIds.has(p.id));
            return [...merged, ...localOnly];
          });
        }

        if (dbHandovers !== null && dbHandovers.length > 0) {
          setHandoverDocs((prev) => {
            const merged = dbHandovers.map((dbHo) => {
              const localMatch = prev.find((p) => p.id === dbHo.id || p.title === dbHo.title);
              if (localMatch) {
                return {
                  ...dbHo,
                  views: Math.max(dbHo.views || 0, localMatch.views || 0),
                  downloads: Math.max(dbHo.downloads || 0, localMatch.downloads || 0)
                };
              }
              return dbHo;
            });
            const dbIds = new Set(dbHandovers.map((h) => h.id));
            const localOnly = prev.filter((p) => !dbIds.has(p.id));
            return [...merged, ...localOnly];
          });
        }

        if (dbTopics) setForumTopics(dbTopics);
        if (dbPending) setPendingDocs(dbPending);
        if (dbActivities) setActivities(dbActivities);
        if (dbNotifications && dbNotifications.length > 0) setNotifications(dbNotifications);
      } catch (err) {
        console.error('Failed to sync with Supabase on mount:', err);
      } finally {
        setIsLoadingSupabase(false);
      }
    };
    loadSupabaseData();
  }, []);

  // State for Realtime Reply Notification Popup Alert & Navigation Highlight Target
  const [replyNotificationPopup, setReplyNotificationPopup] = useState<{
    topicId: string;
    commentId: string;
    targetAuthor: string;
    senderName: string;
    message: string;
  } | null>(null);

  const [targetForumTopicId, setTargetForumTopicId] = useState<string | null>(null);
  const [targetHighlightCommentId, setTargetHighlightCommentId] = useState<string | null>(null);

  const processedReplyNotifIds = useRef<Set<string>>(new Set());

  const checkAndShowReplyPopup = (newComment: any, topicsList: ForumTopic[] = forumTopics) => {
    if (!newComment) return;

    let targetAuthor = '';
    let foundTopicId: string = newComment.topic_id || newComment.topicId || '';
    const parentId = newComment.parent_id || newComment.parentId;
    const commentAuthor = newComment.author || newComment.user_name || 'Pengguna';
    const commentIdClean = newComment.id || newComment.commentId || `${Date.now()}`;
    const replyNotifId = `notif-reply-${commentIdClean}`;

    // Cooldown & deduplication guard: if this reply notification ID was already created in this session, skip!
    if (processedReplyNotifIds.current.has(replyNotifId)) {
      return;
    }

    // Helper for recursive comment lookup
    const findCommentRecursive = (commentsList: ForumComment[]): ForumComment | null => {
      for (const c of commentsList) {
        if (c.id === parentId || String(c.id) === String(parentId)) return c;
        if (c.replies && c.replies.length > 0) {
          const childMatch = findCommentRecursive(c.replies);
          if (childMatch) return childMatch;
        }
      }
      return null;
    };

    // 1. Find parent comment by parentId across all topics & nested replies
    if (parentId && topicsList && topicsList.length > 0) {
      for (const topic of topicsList) {
        if (topic.comments) {
          const found = findCommentRecursive(topic.comments);
          if (found) {
            targetAuthor = found.author;
            if (!foundTopicId) foundTopicId = topic.id;
            break;
          }
        }
      }
    }

    // 2. Fallback: Extract @Mention from content if parentId didn't match
    if (!targetAuthor && newComment.content && typeof newComment.content === 'string') {
      const match = newComment.content.match(/@([A-Za-z0-9\s._-]+?)(?=\s|$|[:\n])/);
      if (match && match[1]) {
        targetAuthor = match[1].trim();
      }
    }

    if (!targetAuthor) return;

    const cleanName = (str: string) =>
      (str || '').replace(/\s*\(.*?\)\s*/g, '').replace(/^@/, '').trim().toLowerCase();

    const cleanCommentAuthor = cleanName(commentAuthor);
    const cleanTargetAuthor = cleanName(targetAuthor);

    // Do not create notification if replying to oneself
    if (cleanCommentAuthor && cleanTargetAuthor && cleanCommentAuthor === cleanTargetAuthor) {
      return;
    }

    // Mark as processed immediately so duplicate re-evaluations won't recreate it
    processedReplyNotifIds.current.add(replyNotifId);

    const currentUser = users.find((u) => u.id === currentUserId) || users[0];
    const cleanLoggedIn = cleanName(currentUser.name);

    const isSender =
      cleanLoggedIn &&
      (cleanCommentAuthor === cleanLoggedIn ||
        cleanLoggedIn.includes(cleanCommentAuthor) ||
        cleanCommentAuthor.includes(cleanLoggedIn));

    const isRecipient =
      cleanLoggedIn &&
      !isSender &&
      (cleanTargetAuthor === cleanLoggedIn ||
        cleanTargetAuthor.includes(cleanLoggedIn) ||
        cleanLoggedIn.includes(cleanTargetAuthor));

    // Create ONE deterministic notification item
    const replyNotifItem: AppNotification = {
      id: replyNotifId,
      title: `💬 Balasan Komentar dari ${commentAuthor}`,
      desc: `"${newComment.content || ''}"`,
      time: 'Baru saja',
      createdAt: typeof newComment.createdAt === 'number' ? newComment.createdAt : Date.now(),
      author: commentAuthor,
      targetUserName: targetAuthor,
      type: 'info',
      read: false
    };

    setNotifications((prev) => {
      if (
        prev.some(
          (n) =>
            n.id === replyNotifItem.id ||
            (n.targetUserName === targetAuthor && n.desc === replyNotifItem.desc && n.author === commentAuthor)
        )
      ) {
        return prev;
      }
      return [replyNotifItem, ...prev];
    });

    saveNotificationToSupabase(replyNotifItem).catch((err) =>
      console.error('Gagal simpan notifikasi balasan ke Supabase:', err)
    );

    // Trigger popup toast alert ONLY for the recipient (User B who was replied to), NEVER for the sender (User A)
    if (isRecipient) {
      if (!foundTopicId && topicsList.length > 0) {
        foundTopicId = topicsList[0].id;
      }

      setReplyNotificationPopup({
        topicId: foundTopicId,
        commentId: newComment.id,
        targetAuthor,
        senderName: commentAuthor,
        message: newComment.content || ''
      });

      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        setReplyNotificationPopup(null);
      }, 6000);
    }
  };

  // Handler for clicking the notification popup: navigate to forum, set topic, scroll & highlight target comment
  const handleNotificationPopupClick = () => {
    if (!replyNotificationPopup) return;

    setActiveTab('forum-diskusi');
    setTargetForumTopicId(replyNotificationPopup.topicId);
    setTargetHighlightCommentId(replyNotificationPopup.commentId);
    setReplyNotificationPopup(null);
  };

  // Supabase Real-time Subscription for Forum Topics, Comments & Notifications (Live Updates Lintas Session!)
  useEffect(() => {
    const handleRealtimeUpdate = async (insertedComment?: any) => {
      try {
        const latestTopics = await getForumTopicsFromSupabase();
        if (latestTopics && latestTopics.length > 0) {
          setForumTopics((prevTopics) => {
            return latestTopics.map((latest) => {
              const prevMatch = prevTopics.find((p) => p.id === latest.id);
              if (!prevMatch) return latest;

              const dbCommentIds = new Set(latest.comments.map((c) => c.id));
              const localOnlyComments = prevMatch.comments.filter((c) => !dbCommentIds.has(c.id));
              const mergedComments = [...latest.comments, ...localOnlyComments];

              return {
                ...latest,
                comments: mergedComments,
                commentCount: mergedComments.length
              };
            });
          });

          // Check and trigger popup for the recipient user
          if (insertedComment) {
            checkAndShowReplyPopup(insertedComment, latestTopics);
          }
        }
      } catch (e) {
        console.warn('Realtime fetch warning:', e);
      }
    };

    const handleRealtimeNotifs = async () => {
      try {
        const latestNotifs = await getNotificationsFromSupabase();
        if (latestNotifs && latestNotifs.length > 0) {
          setNotifications(latestNotifs);
        }
      } catch (e) {
        console.warn('Realtime notifications fetch warning:', e);
      }
    };

    const forumChannel = supabase
      .channel('public_realtime_app')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'forum_topics' },
        () => {
          handleRealtimeUpdate();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'forum_comments' },
        (payload) => {
          const newComment = payload.new;
          handleRealtimeUpdate(newComment);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'forum_comments' },
        () => {
          handleRealtimeUpdate();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'forum_comments' },
        () => {
          handleRealtimeUpdate();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          handleRealtimeNotifs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(forumChannel);
    };
  }, [currentUserId, users]);

  // Supabase Real-time Subscription for Knowledge Articles, Handover Docs & Pending Docs (Live Updates Lintas Session!)
  useEffect(() => {
    const dataChannel = supabase
      .channel('public_realtime_kms_data')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'knowledge_articles' },
        async () => {
          try {
            const latest = await getArticlesFromSupabase();
            if (latest !== null) {
              setArticles(latest);
            }
          } catch (e) {
            console.warn('Realtime articles fetch warning:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'handover_docs' },
        async () => {
          try {
            const latest = await getHandoverDocsFromSupabase();
            if (latest !== null) {
              setHandoverDocs(latest);
            }
          } catch (e) {
            console.warn('Realtime handover docs fetch warning:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pending_docs' },
        async () => {
          try {
            const latest = await getPendingDocsFromSupabase();
            if (latest !== null) {
              setPendingDocs(latest);
            }
          } catch (e) {
            console.warn('Realtime pending docs fetch warning:', e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dataChannel);
    };
  }, []);


  // Verification & Notification Handlers
  const handleRequestVerification = (newDoc: PendingDoc) => {
    setPendingDocs((prev) => [newDoc, ...prev]);
    savePendingDocToSupabase(newDoc).catch(console.error);

    // Rule 1: Notify Manager of the SAME DIVISION only
    const managerNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Pengajuan Verifikasi Konten Baru',
      desc: `${newDoc.author} mengunggah dokumen "${newDoc.title}" untuk divisi ${newDoc.category} yang memerlukan verifikasi Manajer.`,
      time: 'Baru saja',
      createdAt: Date.now(),
      author: newDoc.author,
      targetRoles: ['Manajer'],
      targetDivision: newDoc.category,
      type: 'pending',
      read: false
    };

    // Confirm upload for uploader
    const uploaderConfirmNotif: AppNotification = {
      id: `notif-up-${Date.now()}`,
      title: 'Pengajuan Dalam Tinjauan',
      desc: `Dokumen "${newDoc.title}" berhasil diunggah dan sedang menunggu verifikasi dari Manajer Divisi ${newDoc.category}.`,
      time: 'Baru saja',
      createdAt: Date.now(),
      author: newDoc.author,
      targetUserName: newDoc.author,
      type: 'info',
      read: false
    };

    setNotifications((prev) => [managerNotif, uploaderConfirmNotif, ...prev]);
    saveNotificationToSupabase(managerNotif).catch((err) =>
      console.error('Gagal simpan notifikasi manajer ke Supabase:', err)
    );
    saveNotificationToSupabase(uploaderConfirmNotif).catch((err) =>
      console.error('Gagal simpan notifikasi uploader ke Supabase:', err)
    );
  };

  const handleApproveDoc = (docId: string, note?: string) => {
    const targetDoc = pendingDocs.find((d) => d.id === docId);
    if (!targetDoc) return;

    const updatedDoc: PendingDoc = { ...targetDoc, status: 'Disetujui', note };

    setPendingDocs((prev) =>
      prev.map((d) => (d.id === docId ? updatedDoc : d))
    );
    savePendingDocToSupabase(updatedDoc).catch(console.error);

    const resolvedLinkUrl = targetDoc.linkUrl || targetDoc.fileUrl || targetDoc.articleData?.linkUrl || targetDoc.articleData?.fileUrl;
    const resolvedFileUrl = targetDoc.fileUrl || targetDoc.articleData?.fileUrl;

    const articleToAdd: KnowledgeArticle = targetDoc.articleData
      ? {
          ...targetDoc.articleData,
          linkUrl: targetDoc.articleData.linkUrl || resolvedLinkUrl,
          fileBlob: targetDoc.articleData.fileBlob || targetDoc.fileBlob,
          fileUrl: resolvedFileUrl
        }
      : {
          id: `kb-${Date.now()}`,
          title: targetDoc.title,
          category: targetDoc.category,
          summary: targetDoc.description || 'Dokumen terverifikasi.',
          author: targetDoc.author,
          date: targetDoc.submitDate,
          fileType: autoDetectFileType(targetDoc.fileName || targetDoc.title),
          views: 1,
          contentType: targetDoc.fileName.endsWith('.link') || targetDoc.fileSize === 'Tautan Eksternal' ? 'link' : 'file',
          linkUrl: resolvedLinkUrl,
          fileBlob: targetDoc.fileBlob,
          fileUrl: resolvedFileUrl
        };

    // ALWAYS save approved article directly to Supabase
    saveArticleToSupabase(articleToAdd).catch(console.error);

    setArticles((prev) => {
      const filtered = prev.filter((a) => a.id !== articleToAdd.id && a.title !== articleToAdd.title);
      return [articleToAdd, ...filtered];
    });

    setCategories((prev) =>
      prev.map((c) => {
        if (c.name === targetDoc.category) {
          const updatedCat = { ...c, contentCount: c.contentCount + 1 };
          saveCategoryToSupabase(updatedCat).catch(console.error);
          return updatedCat;
        }
        return c;
      })
    );

    // Notification 1: ONLY FOR UPLOADER (Confirmation of approval)
    const uploaderApprovedNotif: AppNotification = {
      id: `notif-app-up-${Date.now()}`,
      title: '✅ Pengajuan Dokumen Disetujui',
      desc: `Dokumen "${targetDoc.title}" yang Anda unggah telah DISETUJUI oleh Manajer (${currentUser.name}) dan resmi dipublikasikan.${note ? ` Catatan Manajer: "${note}"` : ''}`,
      time: 'Baru saja',
      createdAt: Date.now(),
      author: currentUser.name,
      targetUserName: targetDoc.author,
      type: 'approved',
      read: false
    };

    // Notification 2: COMPANY-WIDE Knowledge Base Notification for ALL OTHER USERS (excluding uploader)
    const allUsersNotif: AppNotification = {
      id: `notif-app-all-${Date.now()}`,
      title: '📚 Ada File Knowledge Base Baru',
      desc: `Dokumen "${targetDoc.title}" yang diunggah oleh ${targetDoc.author} telah disetujui dan kini tersedia di Knowledge Base. Silakan lihat dan pelajari dokumen ini.`,
      time: 'Baru saja',
      createdAt: Date.now(),
      author: targetDoc.author,
      excludeUploaderName: targetDoc.author,
      type: 'approved',
      read: false
    };

    setNotifications((prev) => [uploaderApprovedNotif, allUsersNotif, ...prev]);
    saveNotificationToSupabase(uploaderApprovedNotif).catch((err) =>
      console.error('Gagal simpan notifikasi approval uploader ke Supabase:', err)
    );
    saveNotificationToSupabase(allUsersNotif).catch((err) =>
      console.error('Gagal simpan notifikasi broadcast approval ke Supabase:', err)
    );
  };

  const handleRejectDoc = (docId: string, note?: string) => {
    const targetDoc = pendingDocs.find((d) => d.id === docId);
    if (!targetDoc) return;

    const updatedDoc: PendingDoc = { ...targetDoc, status: 'Ditolak', note };

    setPendingDocs((prev) =>
      prev.map((d) => (d.id === docId ? updatedDoc : d))
    );
    savePendingDocToSupabase(updatedDoc).catch(console.error);

    // Rule 3: Notify ONLY UPLOADER when document is rejected
    const uploaderRejectionNotif: AppNotification = {
      id: `notif-rej-${Date.now()}`,
      title: '❌ Pengajuan Konten Ditolak',
      desc: `Dokumen "${targetDoc.title}" yang Anda unggah DITOLAK oleh Manajer (${currentUser.name}).${note ? ` Catatan: "${note}"` : ''}`,
      time: 'Baru saja',
      createdAt: Date.now(),
      author: targetDoc.author,
      targetUserName: targetDoc.author,
      type: 'rejected',
      read: false
    };

    setNotifications((prev) => [uploaderRejectionNotif, ...prev]);
    saveNotificationToSupabase(uploaderRejectionNotif).catch((err) =>
      console.error('Gagal simpan notifikasi rejection ke Supabase:', err)
    );
  };

  // Get active currentUser (with instant sessionStorage restoration on page refresh)
  const savedUserJson = typeof window !== 'undefined' ? sessionStorage.getItem('kms_current_user') : null;
  let savedUserProfile: User | null = null;
  if (savedUserJson) {
    try {
      savedUserProfile = JSON.parse(savedUserJson);
    } catch {
      // Ignore
    }
  }

  const currentUser: User =
    users.find((u) => u.id === currentUserId) ||
    users.find((u) => u.role === activeRole) ||
    savedUserProfile || {
      id: currentUserId || 'u-user',
      name: 'Pengguna',
      email: '',
      role: activeRole,
      division: 'Administration',
      position: activeRole,
      initials: 'P',
      status: 'Aktif' as const
    };

  // Persist current active user profile to sessionStorage for instant restoration on refresh
  useEffect(() => {
    if (isLoggedIn && currentUser && currentUser.name && currentUser.name !== 'Pengguna') {
      safeSessionStorageSet('kms_current_user', JSON.stringify(currentUser));
    }
  }, [isLoggedIn, currentUser]);

  // Filter notifications relevant to current active user (with 7-day auto-expiry filter)
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const userNotifications = notifications.filter((n) => {
    // 7-day auto-expiry check: ONLY filter if createdAt is a valid epoch timestamp in ms (> 1000000000000)
    if (n.createdAt && typeof n.createdAt === 'number' && n.createdAt > 1000000000000) {
      if (Date.now() - n.createdAt > SEVEN_DAYS_MS) {
        return false;
      }
    }

    // 1. Direct user notification (e.g. Rejection for uploader only, or uploader approval confirmation)
    if (n.targetUserId && n.targetUserId === currentUser.id) return true;
    if (n.targetUserName) {
      return n.targetUserName.toLowerCase() === currentUser.name.toLowerCase();
    }

    // 2. Division-specific notifications (STRICT DIVISION BOUNDARY: Outside division gets NOTHING, NO Admin bypass)
    if (n.targetDivision) {
      const isSameDivision = currentUser.division && currentUser.division.toLowerCase() === n.targetDivision.toLowerCase();
      if (!isSameDivision) {
        return false;
      }

      // If excludeUploaderName matches current user, don't show member study notice to uploader
      if (n.excludeUploaderName && n.excludeUploaderName.toLowerCase() === currentUser.name.toLowerCase()) {
        return false;
      }

      // Upload verification: ONLY Manager of the SAME division
      if (n.targetRoles && n.targetRoles.includes('Manajer')) {
        return isSameDivision && currentUser.role === 'Manajer';
      }

      // Approved doc notification for division members
      if (n.type === 'approved') {
        return isSameDivision;
      }

      return isSameDivision;
    }

    // 3. Exclude specific uploader check for company-wide broadcast notifications (e.g. Knowledge Base approval notice to all other users)
    if (n.excludeUploaderName && n.excludeUploaderName.toLowerCase() === currentUser.name.toLowerCase()) {
      return false;
    }

    // 4. Role-based notification fallback
    if (n.targetRoles && n.targetRoles.length > 0) {
      return n.targetRoles.includes(currentUser.role);
    }

    // 5. Global / Broadcast notifications (system welcome or general announcements for all users)
    return true;
  });

  const handleClearNotifications = () => {
    const userNotifIds = new Set(userNotifications.map((u) => u.id));
    setNotifications((prev) =>
      prev.map((n) => {
        if (userNotifIds.has(n.id)) {
          const updated = { ...n, read: true };
          saveNotificationToSupabase(updated).catch((err) =>
            console.error('Gagal update status read notifikasi ke Supabase:', err)
          );
          return updated;
        }
        return n;
      })
    );
  };

  const handleDeleteNotification = (notifId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    deleteNotificationFromSupabase(notifId).catch((err) =>
      console.error('Gagal hapus notifikasi dari Supabase:', err)
    );
  };

  const handleUpdateCurrentUser = (updated: Partial<User>) => {
    const newUser = { ...currentUser, ...updated };
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? newUser : u))
    );
    saveProfileToSupabase(newUser).catch(console.error);
  };

  const handleSwitchUserRole = (newRole: UserRole) => {
    setActiveRole(newRole);
    const targetUser = users.find((u) => u.role === newRole);
    if (targetUser) {
      setCurrentUserId(targetUser.id);
    }
    if (newRole === 'Karyawan' || newRole === 'Associate') {
      if (activeTab === 'dashboard' || activeTab === 'data-pengguna' || activeTab === 'hak-akses' || activeTab === 'laporan-penggunaan' || activeTab === 'verifikasi-konten') {
        setActiveTab('knowledge-base');
      }
    } else if (newRole === 'Manajer') {
      if (activeTab === 'dashboard' || activeTab === 'data-pengguna' || activeTab === 'hak-akses' || activeTab === 'laporan-penggunaan') {
        setActiveTab('knowledge-base');
      }
    } else if (newRole === 'Admin') {
      if (activeTab === 'verifikasi-konten') {
        setActiveTab('dashboard');
      }
    }
  };

  // User Handlers
  const handleAddUser = (newUser: User) => {
    setUsers((prev) => [newUser, ...prev]);
    saveProfileToSupabase(newUser).catch(console.error);
  };

  const handleUpdateUser = (id: string, updated: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updatedUser = { ...u, ...updated, mustChangePassword: false };
          saveProfileToSupabase(updatedUser).catch(console.error);
          return updatedUser;
        }
        return u;
      })
    );
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updatedUser: User = { ...u, role: newRole, mustChangePassword: false };
          saveProfileToSupabase(updatedUser).catch(console.error);
          return updatedUser;
        }
        return u;
      })
    );
  };

  const handleDeleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    deleteProfileFromSupabase(id).catch(console.error);
  };

  // Category Handlers
  const handleEditHandoverDoc = (id: string, updated: Partial<HandoverDoc>) => {
    setHandoverDocs((prev) => {
      const next = prev.map((h) => (h.id === id ? { ...h, ...updated } : h));
      const target = next.find((h) => h.id === id);
      if (target) {
        saveHandoverDocToSupabase(target).catch(console.error);
      }
      return next;
    });
  };

  const handleAddCategory = (newCat: CategoryItem) => {
    setCategories((prev) => [newCat, ...prev]);
    saveCategoryToSupabase(newCat).catch(console.error);
  };

  const handleEditCategory = (id: string, updated: Partial<CategoryItem>, oldName?: string) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updatedCat = { ...c, ...updated };
          saveCategoryToSupabase(updatedCat).catch(console.error);
          return updatedCat;
        }
        return c;
      })
    );
    if (oldName && updated.name && oldName !== updated.name) {
      setArticles((prev) =>
        prev.map((a) => {
          if (a.category === oldName) {
            const updatedArt = { ...a, category: updated.name! };
            saveArticleToSupabase(updatedArt).catch(console.error);
            return updatedArt;
          }
          return a;
        })
      );
    }
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    deleteCategoryFromSupabase(id).catch(console.error);
  };

  // Content Category Handlers
  const handleAddContentCategory = (newCat: ContentCategoryItem) => {
    setContentCategories((prev) => [...prev, newCat]);
  };

  const handleEditContentCategory = (id: string, updated: Partial<ContentCategoryItem>) => {
    setContentCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
  };

  const handleDeleteContentCategory = (id: string) => {
    setContentCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Article Handlers
  const handleAddArticle = (newArt: KnowledgeArticle) => {
    setArticles((prev) => [newArt, ...prev]);
    saveArticleToSupabase(newArt).catch(console.error);
    // update division category count
    setCategories((prev) =>
      prev.map((c) => {
        if (c.name === newArt.division || c.name === newArt.category) {
          const updatedCat = { ...c, contentCount: c.contentCount + 1 };
          saveCategoryToSupabase(updatedCat).catch(console.error);
          return updatedCat;
        }
        return c;
      })
    );
    // update content category count
    if (newArt.contentCategoryId) {
      setContentCategories((prev) =>
        prev.map((c) => {
          if (c.id === newArt.contentCategoryId) {
            const updatedCat = { ...c, contentCount: c.contentCount + 1 };
            saveContentCategoryToSupabase(updatedCat).catch(console.error);
            return updatedCat;
          }
          return c;
        })
      );
    }
  };

  const handleEditArticle = async (id: string, updated: Partial<KnowledgeArticle>) => {
    let updatedArt: KnowledgeArticle | null = null;
    setArticles((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          updatedArt = { ...a, ...updated };
          return updatedArt;
        }
        return a;
      })
    );

    if (updatedArt) {
      try {
        await saveArticleToSupabase(updatedArt);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui';
        console.error('❌ Gagal simpan pembaruan artikel ke Supabase:', message);
      }
    }
  };

  const handleDeleteArticle = (id: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
    deleteArticleFromSupabase(id).catch(console.error);
  };

  // Handover Handlers
  const handleAddHandover = (newDoc: HandoverDoc) => {
    const docWithRole: HandoverDoc = {
      ...newDoc,
      authorRole: newDoc.authorRole || currentUser.role
    };
    setHandoverDocs((prev) => [docWithRole, ...prev]);
    saveHandoverDocToSupabase(docWithRole).catch(console.error);
  };

  const handleDeleteHandover = (id: string) => {
    setHandoverDocs((prev) => prev.filter((d) => d.id !== id));
    deleteHandoverDocFromSupabase(id).catch(console.error);
  };

  // Forum Handlers
  const handleAddTopic = (newTopic: ForumTopic) => {
    setForumTopics((prev) => [newTopic, ...prev]);
    saveForumTopicToSupabase(newTopic).catch(console.error);

    // Rule: Send notification to ALL members in the SAME DIVISION when a new forum topic is created
    const forumNotif: AppNotification = {
      id: `notif-forum-${Date.now()}`,
      title: '💬 Topik Forum Diskusi Baru',
      desc: `${newTopic.author} membuat topik diskusi baru "${newTopic.title}" di divisi ${newTopic.category}.`,
      time: 'Baru saja',
      createdAt: Date.now(),
      author: newTopic.author,
      targetDivision: newTopic.category,
      type: 'info',
      read: false
    };

    setNotifications((prev) => [forumNotif, ...prev]);
    saveNotificationToSupabase(forumNotif).catch((err) =>
      console.error('Gagal simpan notifikasi forum ke Supabase:', err)
    );
  };

  const handleDeleteTopic = (topicId: string) => {
    setForumTopics((prev) => prev.filter((t) => t.id !== topicId));
    deleteForumTopicFromSupabase(topicId).catch(console.error);
  };

  const handleDeleteComment = (topicId: string, commentId: string) => {
    setForumTopics((prev) =>
      prev.map((t) => {
        if (t.id === topicId) {
          const updatedComments = t.comments.map((c) => {
            if (c.id === commentId) {
              const softDeleted: ForumComment = {
                ...c,
                author: '[Dihapus]',
                content: '[Komentar telah dihapus]',
                isPinned: false
              };
              return softDeleted;
            }
            return c;
          });
          const updatedTopic = {
            ...t,
            comments: updatedComments
          };
          saveForumTopicToSupabase(updatedTopic).catch(console.error);
          return updatedTopic;
        }
        return t;
      })
    );
  };

  const handleAddComment = (topicId: string, newComment: ForumComment) => {
    let updatedTopicsSnapshot: ForumTopic[] = [];

    setForumTopics((prev) => {
      const updated = prev.map((t) => {
        if (t.id === topicId) {
          const updatedTopic = {
            ...t,
            comments: [...t.comments, newComment],
            commentCount: t.comments.length + 1
          };
          saveForumTopicToSupabase(updatedTopic).catch(console.error);
          saveForumCommentToSupabase(topicId, newComment).catch(console.error);
          return updatedTopic;
        }
        return t;
      });
      updatedTopicsSnapshot = updated;
      return updated;
    });

    // Trigger instant check for reply notification popup outside state reducer
    checkAndShowReplyPopup({ ...newComment, topic_id: topicId }, updatedTopicsSnapshot);
  };

  const handleTogglePinComment = (topicId: string, commentId: string) => {
    setForumTopics((prev) =>
      prev.map((t) => {
        if (t.id === topicId) {
          const updatedComments = t.comments.map((c) => {
            if (c.id === commentId) {
              const updatedComment = { ...c, isPinned: !c.isPinned };
              saveForumCommentToSupabase(topicId, updatedComment).catch(console.error);
              return updatedComment;
            }
            return c;
          });
          return { ...t, comments: updatedComments };
        }
        return t;
      })
    );
  };


  // If user is not logged in or activeTab is 'login', render full-screen login page
  if (!isLoggedIn || activeTab === 'login') {
    return (
      <LoginPage
        users={users}
        onLoginSuccess={(user) => {
          setIsLoggedIn(true);
          sessionStorage.setItem('kms_is_logged_in', 'true');
          setCurrentUserId(user.id);
          setActiveRole(user.role);
          if (user.role === 'Karyawan' || user.role === 'Associate') {
            setActiveTab('knowledge-base');
          } else if (user.role === 'Manajer') {
            setActiveTab('verifikasi-konten');
          } else {
            setActiveTab('dashboard');
          }
        }}
        onRegisterAssociate={(newUser) => {
          setUsers((prev) => [newUser, ...prev]);
          setIsLoggedIn(true);
          sessionStorage.setItem('kms_is_logged_in', 'true');
          setCurrentUserId(newUser.id);
          setActiveRole('Associate');
          setActiveTab('knowledge-base');
        }}
      />
    );
  }

  const getPageTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard System';
      case 'data-pengguna':
        return 'Manajemen Pengguna';
      case 'hak-akses':
        return 'Matriks Hak Akses';
      case 'knowledge-base':
        return 'Knowledge Base';
      case 'verifikasi-konten':
        return 'Verifikasi Konten';
      case 'handover-rotasi':
        return 'Handover Rotasi';
      case 'forum-diskusi':
        return 'Forum Diskusi';
      case 'laporan-penggunaan':
        return 'Laporan Penggunaan';
      case 'profil-pengguna':
        return 'Profil Pengguna';
      default:
        return 'Growth Hub KMS';
    }
  };

  const handleNavigateTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    setGlobalSearch('');
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] dark:bg-[#0A0A0F] text-[#191c1e] dark:text-[#F0F0F5] font-sans antialiased overflow-x-hidden">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        onLogoutClick={() => setShowLogoutModal(true)}
        isOpenMobile={isMobileSidebarOpen}
        setIsOpenMobile={setIsMobileSidebarOpen}
        currentUser={currentUser}
      />

      {/* Top Header */}
      <Header
        title={getPageTitle(activeTab)}
        searchQuery={globalSearch}
        setSearchQuery={setGlobalSearch}
        setActiveTab={handleNavigateTab}
        onLogoutClick={() => setShowLogoutModal(true)}
        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        currentUser={currentUser}
        onSwitchUserRole={handleSwitchUserRole}
        notifications={userNotifications}
        onClearNotifications={handleClearNotifications}
        onDeleteNotification={handleDeleteNotification}
        activeTab={activeTab}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
      />

      {/* Main App Container */}
      <main className="pt-20 pb-12 lg:pl-[280px] w-full transition-all">
        <div className="px-4 sm:px-6 lg:px-8 w-full">
        {isLoadingSupabase ? (
          <div className="flex-1 flex items-center justify-center p-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 min-h-[420px] shadow-sm">
            <div className="text-center space-y-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-[#006194] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#006194]/20 animate-pulse">
                <span className="material-symbols-outlined text-3xl">cloud_sync</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Buffering...</h3>
                <p className="text-xs text-slate-400 mt-1">Memuat repositori real-time KMS Growth Hub</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                activities={activities}
                popularTopics={popularTopics}
                forumTopics={forumTopics}
                setActiveTab={setActiveTab}
                users={users}
                articles={articles}
                handoverDocs={handoverDocs}
              />
            )}

            {activeTab === 'data-pengguna' && (
              <DataPenggunaView
                users={users}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
                globalSearch={globalSearch}
              />
            )}

            {activeTab === 'hak-akses' && (
              <HakAksesView
                users={users}
                onUpdateUserRole={handleUpdateUserRole}
                globalSearch={globalSearch}
              />
            )}

            {activeTab === 'knowledge-base' && (
              <KnowledgeBaseView
                categories={categories}
                contentCategories={contentCategories}
                articles={articles}
                onAddCategory={handleAddCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                onAddContentCategory={handleAddContentCategory}
                onEditContentCategory={handleEditContentCategory}
                onDeleteContentCategory={handleDeleteContentCategory}
                onAddArticle={handleAddArticle}
                onRequestVerification={handleRequestVerification}
                onEditArticle={handleEditArticle}
                onDeleteArticle={handleDeleteArticle}
                globalSearch={globalSearch}
                currentUserRole={currentUser.role}
                currentUserName={currentUser.name}
                currentUserDivision={currentUser.division}
              />
            )}

            {activeTab === 'verifikasi-konten' && (
              <VerifikasiKontenView
                pendingDocs={pendingDocs}
                onApproveDoc={handleApproveDoc}
                onRejectDoc={handleRejectDoc}
                globalSearch={globalSearch}
                currentUserRole={currentUser.role}
                currentUserName={currentUser.name}
                currentUserDivision={currentUser.division}
              />
            )}

            {activeTab === 'handover-rotasi' && (
              <HandoverRotasiView
                handoverDocs={handoverDocs}
                onAddHandover={handleAddHandover}
                onEditHandoverDoc={handleEditHandoverDoc}
                onDeleteHandover={handleDeleteHandover}
                globalSearch={globalSearch}
                currentUserRole={currentUser.role}
                currentUserName={currentUser.name}
                currentUserDivision={currentUser.division}
              />
            )}

            {activeTab === 'forum-diskusi' && (
              <ForumDiskusiView
                topics={forumTopics}
                categories={categories}
                onAddTopic={handleAddTopic}
                onAddComment={handleAddComment}
                onTogglePinComment={handleTogglePinComment}
                onDeleteComment={handleDeleteComment}
                onDeleteTopic={handleDeleteTopic}
                globalSearch={globalSearch}
                currentUserRole={currentUser.role}
                currentUserName={currentUser.name}
                currentUserId={currentUser.id}
                targetTopicId={targetForumTopicId}
                targetHighlightCommentId={targetHighlightCommentId}
              />
            )}

            {activeTab === 'laporan-penggunaan' && (
              <LaporanPenggunaanView
                globalSearch={globalSearch}
                users={users}
                articles={articles}
                handoverDocs={handoverDocs}
                categories={categories}
              />
            )}

            {activeTab === 'profil-pengguna' && (
              <ProfilPenggunaView
                currentUser={currentUser}
                onUpdateUser={handleUpdateCurrentUser}
              />
            )}
          </>
        )}
        </div>
      </main>

      {/* Realtime Instant Reply Notification Popup Alert (Mobile & Desktop Safe z-[9999]) */}
      {replyNotificationPopup && (
        <div
          onClick={handleNotificationPopupClick}
          className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[9999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl dark:shadow-cyan-950/40 p-4 space-y-3 animate-in slide-in-from-top-5 duration-200 cursor-pointer hover:border-[#006194] dark:hover:border-cyan-400 transition-all"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-[#006194] dark:text-cyan-400 font-extrabold text-xs">
              <span className="material-symbols-outlined text-lg">question_answer</span>
              <span className="text-slate-900 dark:text-white font-bold">Pemberitahuan Balasan Komentar</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setReplyNotificationPopup(null);
              }}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg transition-colors cursor-pointer"
              title="Tutup Notifikasi"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              <strong className="text-[#006194] dark:text-cyan-400 font-bold">{replyNotificationPopup.senderName}</strong> membalas komentar <strong className="text-[#006194] dark:text-cyan-400 font-bold">{replyNotificationPopup.targetAuthor}</strong>:
            </p>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed shadow-sm">
              {replyNotificationPopup.message}
            </div>
            <p className="text-[10px] text-[#006194] dark:text-cyan-400 font-bold text-right hover:underline pt-1 flex items-center justify-end gap-1">
              <span>Klik untuk melihat balasan</span>
              <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
            </p>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          setShowLogoutModal(false);
          setIsLoggedIn(false);
          sessionStorage.removeItem('kms_is_logged_in');
          sessionStorage.removeItem('kms_active_tab');
          sessionStorage.removeItem('kms_active_role');
          sessionStorage.removeItem('kms_current_user_id');
          setActiveTab('login');
        }}
      />
    </div>
  );
}
