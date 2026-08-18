import React, { useState } from 'react';
import { ForumTopic, ForumComment, CategoryItem } from '../../types';
import { CustomSelect } from '../CustomSelect';
import { buildCommentTree, CommentTreeNode } from '../../utils/commentUtils';
import { logUserActivitySilent } from '../../services/supabaseService';

interface ForumDiskusiViewProps {
  topics: ForumTopic[];
  categories?: CategoryItem[];
  onAddTopic: (topic: ForumTopic) => void;
  onAddComment: (topicId: string, comment: ForumComment) => void;
  onTogglePinComment?: (topicId: string, commentId: string) => void;
  onDeleteComment?: (topicId: string, commentId: string) => void;
  onDeleteTopic?: (topicId: string) => void;
  globalSearch: string;
  currentUserRole?: string;
  currentUserName?: string;
  currentUserId?: string;
  targetTopicId?: string | null;
  targetHighlightCommentId?: string | null;
}

interface CommentNodeItemProps {
  node: CommentTreeNode;
  depth: number;
  activeTopicId: string;
  currentUserRole: string;
  currentUserName: string;
  activeReplyId: string | null;
  inlineReplyText: string;
  collapsedSet: Set<string>;
  targetHighlightCommentId?: string | null;
  onToggleReply: (commentId: string, authorName: string) => void;
  onCancelReply: () => void;
  onChangeInlineText: (text: string) => void;
  onSubmitInlineReply: (parentId: string) => void;
  onToggleCollapse: (commentId: string) => void;
  onTogglePin?: (topicId: string, commentId: string) => void;
  onDeleteComment?: (topicId: string, commentId: string) => void;
}

const CommentNodeItem: React.FC<CommentNodeItemProps> = ({
  node,
  depth,
  activeTopicId,
  currentUserRole,
  currentUserName,
  activeReplyId,
  inlineReplyText,
  collapsedSet,
  targetHighlightCommentId,
  onToggleReply,
  onCancelReply,
  onChangeInlineText,
  onSubmitInlineReply,
  onToggleCollapse,
  onTogglePin,
  onDeleteComment
}) => {
  const isCollapsed = collapsedSet.has(node.id);
  const isReplyingThis = activeReplyId === node.id;
  const isDeleted = node.content === '[Komentar telah dihapus]' || node.author === '[Dihapus]';
  const isHighlighted = targetHighlightCommentId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  const canDelete =
    !isDeleted &&
    (currentUserRole === 'Admin' ||
      (node.author && node.author.toLowerCase() === currentUserName.toLowerCase()));

  return (
    <div id={`comment-${node.id}`} className={`relative ${depth > 0 ? 'mt-1.5' : 'mt-2.5'}`}>
      {/* Main Comment Card */}
      <div
        className={`rounded-xl border transition-all space-y-1 h-auto ${
          depth > 0 ? 'p-2 sm:p-2.5' : 'p-2.5 sm:p-3'
        } ${
          isHighlighted
            ? 'bg-sky-100/90 dark:bg-slate-800 border-cyan-400 dark:border-cyan-400 ring-2 ring-cyan-400 shadow-md'
            : isDeleted
            ? 'bg-slate-100/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
            : node.isPinned
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-300/50'
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80'
        }`}
      >
        {/* Top Header Row: Author Info + Badges & Timestamp */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {node.avatar ? (
              <img
                src={node.avatar}
                alt={node.author}
                className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950/80 text-[#006194] dark:text-cyan-300 font-bold text-[10px] flex items-center justify-center border border-sky-200 dark:border-sky-800 shrink-0">
                {node.initials || 'U'}
              </div>
            )}
            <div className="flex items-baseline gap-1 min-w-0 truncate">
              <span className="font-bold text-slate-900 dark:text-white text-[11px] truncate">
                {node.author}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                • {node.authorRole}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {node.isPinned && !isDeleted && (
              <span className="flex items-center gap-0.5 text-[9px] font-extrabold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 rounded">
                <span className="material-symbols-outlined text-[10px]">push_pin</span>
                <span>Disematkan</span>
              </span>
            )}
            {hasChildren && (
              <button
                type="button"
                onClick={() => onToggleCollapse(node.id)}
                className="text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#006194] dark:hover:text-cyan-400 bg-slate-200/70 dark:bg-slate-700/70 px-1.5 py-0.5 rounded transition-colors flex items-center gap-0.5"
                title={isCollapsed ? 'Tampilkan Balasan' : 'Sembunyikan Balasan'}
              >
                <span className="material-symbols-outlined text-[10px]">
                  {isCollapsed ? 'add' : 'remove'}
                </span>
                <span>{isCollapsed ? `+${node.children.length}` : 'Collapse'}</span>
              </button>
            )}
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium ml-1">
              {node.timestamp}
            </span>
          </div>
        </div>

        {/* Comment Body Content */}
        <div className="pl-8">
          {isDeleted ? (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
              [Komentar telah dihapus]
            </p>
          ) : (
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug whitespace-pre-line">
              {node.content}
            </p>
          )}
        </div>

        {/* Action Controls (Reply, Pin, Delete) */}
        {!isDeleted && (
          <div className="flex items-center justify-end gap-0.5 pt-0.5 text-[10px]">
            {/* Inline Reply Trigger */}
            <button
              type="button"
              onClick={() => onToggleReply(node.id, node.author)}
              className={`p-0.5 rounded transition-all flex items-center justify-center ${
                isReplyingThis
                  ? 'bg-sky-100 dark:bg-slate-700 text-[#006194] dark:text-cyan-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-[#006194] dark:hover:text-cyan-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/60'
              }`}
              title="Balas Diskusi (Inline)"
            >
              <span className="material-symbols-outlined !text-[13px]" style={{ fontSize: '13px' }}>reply</span>
            </button>

            {/* Pin / Unpin Toggle */}
            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(activeTopicId, node.id)}
                className={`p-0.5 rounded transition-all flex items-center justify-center ${
                  node.isPinned
                    ? 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900/80'
                    : 'text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`}
                title={node.isPinned ? 'Lepas Sematan' : 'Sematkan Pesan'}
              >
                <span className="material-symbols-outlined !text-[13px]" style={{ fontSize: '13px' }}>push_pin</span>
              </button>
            )}

            {/* Delete Trigger */}
            {canDelete && onDeleteComment && (
              <button
                type="button"
                onClick={() => onDeleteComment(activeTopicId, node.id)}
                className="p-0.5 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-all flex items-center justify-center"
                title="Hapus Balasan"
              >
                <span className="material-symbols-outlined !text-[13px]" style={{ fontSize: '13px' }}>delete</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inline Reply Form */}
      {isReplyingThis && (
        <div className="ml-2 sm:ml-3.5 mt-1.5 p-2 bg-sky-50/70 dark:bg-slate-800/80 border border-sky-200 dark:border-slate-700 rounded-xl space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[10px] text-[#006194] dark:text-cyan-400 font-bold">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">reply</span>
              <span>Membalas @{node.author}</span>
            </span>
            <button
              type="button"
              onClick={onCancelReply}
              className="text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 text-[10px] font-semibold"
            >
              Batal
            </button>
          </div>
          <textarea
            value={inlineReplyText}
            onChange={(e) => onChangeInlineText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inlineReplyText.trim().length > 0) {
                  onSubmitInlineReply(node.id);
                }
              }
            }}
            placeholder={`Tulis balasan Anda untuk @${node.author}... (Enter untuk kirim, Shift+Enter untuk baris baru)`}
            rows={2}
            className="w-full p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-[#006194] dark:focus:ring-cyan-400 resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={onCancelReply}
              className="px-2.5 py-0.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg text-[10px] font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => onSubmitInlineReply(node.id)}
              disabled={!inlineReplyText.trim()}
              className="px-3 py-0.5 bg-[#006194] text-white rounded-lg text-[10px] font-bold hover:bg-[#004b73] transition-all disabled:opacity-50"
            >
              Kirim Balasan
            </button>
          </div>
        </div>
      )}

      {/* Children Replies (Nested Branching Tree) */}
      {hasChildren && !isCollapsed && (
        <div className="ml-2 sm:ml-3.5 pl-2 sm:pl-3 border-l-2 border-[#006194]/30 dark:border-cyan-500/30 space-y-1.5 mt-1.5">
          {node.children.map((child) => (
            <CommentNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              activeTopicId={activeTopicId}
              currentUserRole={currentUserRole}
              currentUserName={currentUserName}
              activeReplyId={activeReplyId}
              inlineReplyText={inlineReplyText}
              collapsedSet={collapsedSet}
              targetHighlightCommentId={targetHighlightCommentId}
              onToggleReply={onToggleReply}
              onCancelReply={onCancelReply}
              onChangeInlineText={onChangeInlineText}
              onSubmitInlineReply={onSubmitInlineReply}
              onToggleCollapse={onToggleCollapse}
              onTogglePin={onTogglePin}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      )}

      {/* Collapsed Indicator Banner */}
      {hasChildren && isCollapsed && (
        <div className="ml-2 sm:ml-3.5 pl-2 sm:pl-3 border-l-2 border-slate-200/80 dark:border-slate-800 mt-1.5">
          <button
            type="button"
            onClick={() => onToggleCollapse(node.id)}
            className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-[#006194] bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full transition-all inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[12px]">unfold_more</span>
            <span>{node.children.length} balasan disembunyikan. Klik untuk menampilkan.</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const ALL_DIVISIONS = [
  'Talent Acquisition',
  'Talent Development',
  'Organizational Development',
  'Employee Benefit',
  'Administration',
  'Graphic Design',
  'Copywriting',
  'Content Coordinator',
  'Video Editor',
  'Public Relation',
  'Social Media Officer',
  'Key Opinion Leader Coordinator',
  'Representative',
  'Program Specialist',
  'Project Representative',
  'Community & Digital Marketing'
];

export const ForumDiskusiView: React.FC<ForumDiskusiViewProps> = ({
  topics,
  categories,
  onAddTopic,
  onAddComment,
  onTogglePinComment,
  onDeleteComment,
  onDeleteTopic,
  globalSearch,
  currentUserRole = 'Karyawan',
  currentUserName = 'Ananda Reva',
  currentUserId = 'u-karyawan',
  targetTopicId,
  targetHighlightCommentId
}) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topics[0]?.id || '');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('Semua Divisi');
  const [mainCommentText, setMainCommentText] = useState('');

  // Inline Reply & Thread Collapse State
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [inlineReplyText, setInlineReplyText] = useState('');
  const [collapsedComments, setCollapsedComments] = useState<Set<string>>(new Set());
  const [highlightCommentId, setHighlightCommentId] = useState<string | null>(null);

  React.useEffect(() => {
    if (targetTopicId) {
      setSelectedTopicId(targetTopicId);
    }
  }, [targetTopicId]);

  React.useEffect(() => {
    if (targetHighlightCommentId) {
      setHighlightCommentId(targetHighlightCommentId);
      const scrollTimer = setTimeout(() => {
        const element = document.getElementById(`comment-${targetHighlightCommentId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);

      const clearTimer = setTimeout(() => {
        setHighlightCommentId(null);
      }, 3500);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [targetHighlightCommentId, selectedTopicId]);

  const divisionsList = ALL_DIVISIONS;

  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirmTopic, setDeleteConfirmTopic] = useState<ForumTopic | null>(null);

  const handleConfirmDeleteTopic = () => {
    if (!deleteConfirmTopic || !onDeleteTopic) return;
    const title = deleteConfirmTopic.title;
    onDeleteTopic(deleteConfirmTopic.id);
    setDeleteConfirmTopic(null);
  };

  const query = globalSearch.toLowerCase();

  // Helper: Deep full-text search across Topic Title, Body Content, Author, Tags, Parent Comments, and Child Replies
  const checkTopicMatchesSearch = (t: ForumTopic, searchStr: string): boolean => {
    if (!searchStr) return true;

    // 1. Check Topic Title, Body Content, Author, Category, and Tags
    if (
      t.title.toLowerCase().includes(searchStr) ||
      (t.content && t.content.toLowerCase().includes(searchStr)) ||
      t.author.toLowerCase().includes(searchStr) ||
      t.category.toLowerCase().includes(searchStr) ||
      (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(searchStr)))
    ) {
      return true;
    }

    // 2. Check Parent Comments and Child Replies recursively
    const checkCommentMatch = (c: ForumComment): boolean => {
      if (
        c.content.toLowerCase().includes(searchStr) ||
        c.author.toLowerCase().includes(searchStr) ||
        (c.authorRole && c.authorRole.toLowerCase().includes(searchStr))
      ) {
        return true;
      }
      if (c.replies && c.replies.length > 0) {
        return c.replies.some(checkCommentMatch);
      }
      return false;
    };

    if (t.comments && t.comments.length > 0) {
      return t.comments.some(checkCommentMatch);
    }

    return false;
  };

  const filteredTopics = topics.filter((t) => {
    const matchesSearch = checkTopicMatchesSearch(t, query);

    const matchesDivision =
      selectedDivisionFilter === 'Semua Divisi' || t.category === selectedDivisionFilter;

    return matchesSearch && matchesDivision;
  });

  // Pick active topic dynamically from filteredTopics so eliminated topics update the detail view immediately
  const activeTopic =
    filteredTopics.find((t) => t.id === selectedTopicId) ||
    filteredTopics[0] ||
    null;

// Helper: Cleanly format tagged messages to ensure single @TargetAuthor at front without duplicated author name words
const formatCleanTaggedMessage = (rawText: string, targetAuthor: string): string => {
  let body = rawText.trim();
  if (!targetAuthor) return body;

  // 1. Strip exact `@Target Author Name` at start (case-insensitive)
  const escapedTarget = targetAuthor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  body = body.replace(new RegExp(`^@${escapedTarget}\\s*`, 'i'), '');

  // 2. Strip single-word `@FirstName` at start
  body = body.replace(/^@[^\s:]+\s*/, '');

  // 3. Strip any orphaned author name words at start (e.g. "Pangestu mantaap" -> "mantaap")
  const authorWords = targetAuthor.trim().split(/\s+/);
  if (authorWords.length > 1) {
    authorWords.forEach((word) => {
      if (word.length > 1) {
        const wordPattern = new RegExp(`^${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
        body = body.replace(wordPattern, '');
      }
    });
  }

  // 4. Strip any extra @mentions typed anywhere else in the body
  body = body.replace(/@[^\s:]+\s*/g, '').trim();

  // 5. Return clean single tag `@Target Author Name [body]`
  return body.length > 0 ? `@${targetAuthor} ${body}` : `@${targetAuthor}`;
};

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Submit Top-Level Comment (parentId: null)
  const handleSendMainComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainCommentText.trim() || !activeTopic) return;

    const initials = currentUserName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const rawMainText = mainCommentText.trim();
    const mentionMatch = rawMainText.match(/@([^\s:]+)/);

    let finalMainContent = rawMainText;
    if (mentionMatch) {
      const taggedName = mentionMatch[1];
      const parentCandidate = activeTopic.comments.find(
        (p) => p.author.toLowerCase().replace(/\s+/g, '') === taggedName.toLowerCase().replace(/\s+/g, '')
      );
      const targetAuthor = parentCandidate ? parentCandidate.author : taggedName;

      finalMainContent = formatCleanTaggedMessage(rawMainText, targetAuthor);
    }

    const newComment: ForumComment = {
      id: `comment-${Date.now()}`,
      author: currentUserName,
      authorRole: currentUserRole,
      avatar: undefined,
      initials: initials,
      content: finalMainContent,
      timestamp: 'Baru saja',
      isPinned: false,
      parentId: null
    };

    onAddComment(activeTopic.id, newComment);
    setMainCommentText('');
  };

  // Submit Inline Reply (parentId: specific comment ID)
  const handleSubmitInlineReply = (parentId: string) => {
    if (!inlineReplyText.trim() || !activeTopic) return;

    const parentComment = activeTopic.comments.find((c) => c.id === parentId);
    const targetAuthor = parentComment ? parentComment.author : 'Pengguna';

    const initials = currentUserName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const formattedText = formatCleanTaggedMessage(inlineReplyText, targetAuthor);

    const newReply: ForumComment = {
      id: `comment-${Date.now()}`,
      author: currentUserName,
      authorRole: currentUserRole,
      avatar: undefined,
      initials: initials,
      content: formattedText,
      timestamp: 'Baru saja',
      isPinned: false,
      parentId: parentId
    };

    onAddComment(activeTopic.id, newReply);

    setInlineReplyText('');
    setActiveReplyId(null);
  };

  const handleToggleReply = (commentId: string, authorName: string) => {
    if (activeReplyId === commentId) {
      setActiveReplyId(null);
      setInlineReplyText('');
    } else {
      setActiveReplyId(commentId);
      setInlineReplyText('');
    }
  };

  const handleToggleCollapse = (commentId: string) => {
    setCollapsedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleCreateTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !newTopicContent.trim()) return;
    if (!newTopicCategory) {
      alert('Harap pilih Kategori Divisi terlebih dahulu.');
      return;
    }

    const newTopic: ForumTopic = {
      id: `ft-${Date.now()}`,
      title: newTopicTitle,
      category: newTopicCategory,
      author: currentUserName,
      authorRole: currentUserRole,
      date: new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      time: `${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
      views: 1,
      commentCount: 0,
      content: newTopicContent,
      tags: [newTopicCategory.toUpperCase(), 'DISKUSI'],
      comments: []
    };

    onAddTopic(newTopic);
    logUserActivitySilent({
      userName: currentUserName,
      department: newTopicCategory,
      action: `Membuat topik forum diskusi baru "${newTopic.title}" (${newTopicCategory})`
    });
    setSelectedTopicId(newTopic.id);
    setShowNewTopicModal(false);
    setNewTopicTitle('');
    setNewTopicContent('');
  };

  const rawCommentTree = activeTopic ? buildCommentTree(activeTopic.comments) : [];

  // Filter comment tree nodes when search is active so non-matching messages are excluded
  const filterCommentNodes = (nodes: CommentTreeNode[], searchStr: string): CommentTreeNode[] => {
    if (!searchStr) return nodes;

    return nodes
      .filter((node) => {
        const textMatch =
          node.content.toLowerCase().includes(searchStr) ||
          node.author.toLowerCase().includes(searchStr) ||
          (node.authorRole && node.authorRole.toLowerCase().includes(searchStr));

        const hasMatchingChild = node.children && filterCommentNodes(node.children, searchStr).length > 0;
        return textMatch || hasMatchingChild;
      })
      .map((node) => ({
        ...node,
        children: node.children ? filterCommentNodes(node.children, searchStr) : []
      }));
  };

  const topicHeaderMatches = activeTopic ? (
    activeTopic.title.toLowerCase().includes(query) ||
    (activeTopic.content && activeTopic.content.toLowerCase().includes(query)) ||
    activeTopic.author.toLowerCase().includes(query) ||
    (activeTopic.tags && activeTopic.tags.some((tag) => tag.toLowerCase().includes(query)))
  ) : false;

  const commentTree = query
    ? (filterCommentNodes(rawCommentTree, query).length > 0
        ? filterCommentNodes(rawCommentTree, query)
        : (topicHeaderMatches ? rawCommentTree : []))
    : rawCommentTree;

  return (
    <div className="space-y-3 lg:h-[calc(100vh-115px)] lg:flex lg:flex-col lg:overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Forum Diskusi</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Wadah kolaborasi, tanya jawab operasional, dan pertukaran ide antar tim.
          </p>
        </div>

        {currentUserRole !== 'Associate' && (
          <button
            onClick={() => setShowNewTopicModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#006194] text-white rounded-xl text-xs font-bold hover:bg-[#004b73] transition-all shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add_comment</span>
            <span>Buat Topik Baru</span>
          </button>
        )}
      </div>

      {/* Main Forum Split Container */}
      <div className="grid grid-cols-12 gap-5 items-start lg:items-stretch lg:flex-1 lg:overflow-hidden min-h-0">
        {/* Left Topic List Panel */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm flex flex-col lg:h-full lg:overflow-hidden space-y-2.5">
          {/* Division Filter Controls (Fixed Top) */}
          <div className="shrink-0 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  filter_alt
                </span>
                <select
                  value={selectedDivisionFilter}
                  onChange={(e) => setSelectedDivisionFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-[#006194] outline-none cursor-pointer"
                >
                  <option value="Semua Divisi">Semua Divisi</option>
                  {divisionsList.map((d, idx) => (
                    <option key={`div-opt-${d}-${idx}`} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDivisionFilter !== 'Semua Divisi' && (
                <button
                  type="button"
                  onClick={() => setSelectedDivisionFilter('Semua Divisi')}
                  className="px-2.5 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center shrink-0"
                  title="Reset Filter Divisi"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Topic Cards List (Internal Independent Scroll) */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 max-h-[600px] lg:max-h-none">
            {filteredTopics.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                Tidak ada diskusi ditemukan.
              </div>
            ) : (
              filteredTopics.map((topic) => {
                const isSelected = topic.id === activeTopic?.id;
                return (
                  <div
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50/80 dark:bg-slate-800 border-[#006194] dark:border-cyan-400 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-[#006194] dark:text-cyan-300 bg-sky-100 dark:bg-cyan-950 px-2 py-0.5 rounded">
                        {topic.category}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {topic.date}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm line-clamp-2 leading-snug">
                      {topic.title}
                    </h4>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-400 truncate max-w-[140px] text-[11px]">
                        {topic.author}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-[#006194] dark:text-cyan-400 text-[11px]">
                        <span className="material-symbols-outlined text-[15px]">chat_bubble</span>
                        <span>{topic.comments ? topic.comments.length : 0} Balasan</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Topic Thread Panel (WhatsApp/Discord Style 3-Zone Layout) */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col lg:h-full lg:overflow-hidden min-h-0">
          {activeTopic ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* ZONA A: HEADER TOPIK (Ultra-Compact Inline Header) */}
              <div className="shrink-0 p-3 sm:p-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 space-y-2">
                {/* Top Badge & Action Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 bg-sky-100 dark:bg-sky-950/80 text-[#006194] dark:text-sky-300 text-[10px] font-bold rounded-md flex items-center gap-1 border border-sky-200 dark:border-sky-800">
                    <span className="material-symbols-outlined text-[13px]">corporate_fare</span>
                    <span>Divisi Topik: {activeTopic.category}</span>
                  </span>

                  {currentUserRole === 'Admin' && onDeleteTopic && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmTopic(activeTopic)}
                      className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-all flex items-center gap-1 shadow-2xs"
                      title="Hapus Topik Diskusi (Khusus Admin)"
                    >
                      <span className="material-symbols-outlined text-[13px]">delete</span>
                      <span>Hapus Topik</span>
                    </button>
                  )}
                </div>

                {/* Topic Title */}
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {activeTopic.title}
                </h3>

                {/* Inline Author Info & Date/Time Bar (Merged 1 Line, No Outer Card Box) */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {activeTopic.authorAvatar ? (
                    <img
                      src={activeTopic.authorAvatar}
                      alt={activeTopic.author}
                      className="w-5 h-5 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-[#006194] text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                      {activeTopic.authorInitials || 'U'}
                    </div>
                  )}
                  <span className="font-bold text-slate-900 dark:text-white">{activeTopic.author}</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span>{activeTopic.authorRole}</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-slate-400 dark:text-slate-500">{activeTopic.date} • {activeTopic.time}</span>
                </div>

                {/* Post Content Body */}
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-snug whitespace-pre-line max-h-24 sm:max-h-28 overflow-y-auto custom-scrollbar pr-1">
                  {activeTopic.content}
                </div>

                {/* Tags */}
                {activeTopic.tags && activeTopic.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {activeTopic.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-semibold rounded-md border border-slate-200/60 dark:border-slate-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ZONA B: AREA KOMENTAR (Internal Independent Scroll - Full Flex-1 with min-h-[350px]) */}
              <div className="flex-1 min-h-[350px] overflow-y-auto custom-scrollbar p-3.5 sm:p-4 pr-2 space-y-2.5 bg-slate-50/30 dark:bg-slate-950/20">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#006194] dark:text-cyan-400 text-[16px]">question_answer</span>
                    <span>Diskusi Balasan ({activeTopic.comments ? activeTopic.comments.length : 0})</span>
                  </h4>
                  {collapsedComments.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setCollapsedComments(new Set())}
                      className="text-[10px] font-semibold text-[#006194] dark:text-cyan-400 hover:underline"
                    >
                      Buka Semua Thread
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {commentTree.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 italic text-center">
                      Belum ada balasan. Jadilah yang pertama memberikan masukan!
                    </p>
                  ) : (
                    commentTree.map((rootNode) => (
                      <CommentNodeItem
                        key={rootNode.id}
                        node={rootNode}
                        depth={0}
                        activeTopicId={activeTopic.id}
                        currentUserRole={currentUserRole}
                        currentUserName={currentUserName}
                        activeReplyId={activeReplyId}
                        inlineReplyText={inlineReplyText}
                        collapsedSet={collapsedComments}
                        targetHighlightCommentId={highlightCommentId}
                        onToggleReply={handleToggleReply}
                        onCancelReply={() => {
                          setActiveReplyId(null);
                          setInlineReplyText('');
                        }}
                        onChangeInlineText={setInlineReplyText}
                        onSubmitInlineReply={handleSubmitInlineReply}
                        onToggleCollapse={handleToggleCollapse}
                        onTogglePin={onTogglePinComment}
                        onDeleteComment={onDeleteComment}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* ZONA C: FORM INPUT KOMENTAR (Permanen Terbuka di Bawah) */}
              <form onSubmit={handleSendMainComment} className="shrink-0 p-3 sm:p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 space-y-1.5 shadow-xs">
                <label className="text-[10px] font-extrabold text-slate-900 dark:text-white block">Tulis Balasan Utama</label>
                <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#006194]/20 dark:focus-within:ring-cyan-500/20 focus-within:border-[#006194] dark:focus-within:border-cyan-400 bg-white dark:bg-slate-900">
                  <textarea
                    value={mainCommentText}
                    onChange={(e) => setMainCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (mainCommentText.trim().length > 0) {
                          handleSendMainComment(e);
                        }
                      }
                    }}
                    placeholder="Ketik tanggapan Anda untuk topik ini... (Enter untuk kirim, Shift+Enter untuk baris baru)"
                    rows={2}
                    className="w-full p-2 text-xs text-slate-900 dark:text-slate-100 font-medium placeholder-slate-500 dark:placeholder-slate-400 bg-white dark:bg-slate-900 outline-none resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#006194] text-white rounded-xl text-xs font-bold hover:bg-[#004b73] transition-all flex items-center gap-1 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[15px]">send</span>
                    <span>Kirim Tanggapan Utama</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs sm:text-sm my-auto flex flex-col items-center justify-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">search_off</span>
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Tidak ada diskusi ditemukan</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 max-w-xs">
                  {globalSearch
                    ? `Tidak ada topik atau balasan pesan yang cocok dengan kata kunci "${globalSearch}".`
                    : 'Pilih topik di sebelah kiri untuk melihat thread diskusi.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Topic Modal */}
      {showNewTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Buat Topik Diskusi Baru</h3>
              <button
                onClick={() => setShowNewTopicModal(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTopicSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Judul Topik
                </label>
                <input
                  type="text"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="Contoh: Evaluasi Alur Kerja Editorial Q1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-1 focus:ring-[#006194]"
                  required
                />
              </div>

              <CustomSelect
                label="Kategori Divisi"
                required
                options={divisionsList}
                value={newTopicCategory}
                onChange={setNewTopicCategory}
                placeholder="Pilih Kategori Divisi"
              />

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase block mb-1">
                  Isi Pertanyaan / Topik
                </label>
                <textarea
                  value={newTopicContent}
                  onChange={(e) => setNewTopicContent(e.target.value)}
                  placeholder="Jelaskan secara mendalam poin diskusi atau kendala yang dihadapi..."
                  rows={4}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-1 focus:ring-[#006194] resize-none"
                  required
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#006194] text-white hover:bg-[#004b73]"
                >
                  Publikasikan Topik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Topic Modal (Admin) */}
      {deleteConfirmTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">delete_forever</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Hapus Topik Diskusi</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Akses Khusus Admin</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus topik diskusi <strong className="text-slate-900 dark:text-white">"{deleteConfirmTopic.title}"</strong>?
              Seluruh balasan dan histori di dalamnya akan terhapus secara permanen dari sistem KMS.
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmTopic(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTopic}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors flex items-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                <span>Ya, Hapus Topik</span>
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3.5 z-50 border border-slate-700/60 max-w-md animate-in slide-in-from-bottom-5 duration-200">
          {!toastMessage.includes('⚠️') && !toastMessage.includes('❌') && !toastMessage.toLowerCase().includes('salah') && !toastMessage.toLowerCase().includes('gagal') ? (
            <span className="material-symbols-outlined text-emerald-400 text-2xl shrink-0">check_circle</span>
          ) : (
            <span className="material-symbols-outlined text-amber-400 text-2xl shrink-0">info</span>
          )}
          <span className="text-sm font-bold leading-relaxed">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
