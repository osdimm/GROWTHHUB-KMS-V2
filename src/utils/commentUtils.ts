import { ForumComment } from '../types';

export interface CommentTreeNode extends ForumComment {
  children: CommentTreeNode[];
}

/**
 * Helper: Convert flat comments array into hierarchical nested tree
 */
export const buildCommentTree = (comments: ForumComment[]): CommentTreeNode[] => {
  if (!comments || comments.length === 0) return [];

  // 1. Deduplicate comments by ID and by author+content (excluding soft-deleted comments)
  const dedupMap = new Map<string, ForumComment>();
  comments.forEach((c) => {
    if (!c.id) return;
    const isDeleted = c.author === '[Dihapus]' || c.content === '[Komentar telah dihapus]' || c.content === '[Pesan telah dihapus]';

    if (isDeleted) {
      dedupMap.set(c.id, c);
      return;
    }

    const contentKey = `${c.author.trim().toLowerCase()}:::${c.content.trim().toLowerCase()}`;
    const existingById = dedupMap.get(c.id);
    const existingByContent = dedupMap.get(contentKey);

    const existing = existingById || existingByContent;
    if (existing) {
      if (!existing.parentId && c.parentId) {
        dedupMap.set(c.id, c);
        dedupMap.set(contentKey, c);
      }
    } else {
      dedupMap.set(c.id, c);
      dedupMap.set(contentKey, c);
    }
  });

  const uniqueComments = Array.from(new Set(dedupMap.values()));

  // 2. Initialize node map
  const map = new Map<string, CommentTreeNode>();
  uniqueComments.forEach((c) => {
    map.set(c.id, { ...c, children: [] });
  });

  // 3. Attach children and track child IDs to prevent duplicate root rendering
  const childNodeIds = new Set<string>();
  const roots: CommentTreeNode[] = [];

  uniqueComments.forEach((c) => {
    const node = map.get(c.id)!;
    let parentFound = false;

    // Direct parentId match
    if (c.parentId && map.has(c.parentId) && c.parentId !== c.id) {
      map.get(c.parentId)!.children.push(node);
      childNodeIds.add(c.id);
      parentFound = true;
    } else {
      // Mention match: check if content starts with @[AuthorName] of any comment
      const parentCandidate = uniqueComments.find((p) => {
        if (p.id === c.id) return false;
        const authorNameLower = p.author.trim().toLowerCase();
        const contentLower = c.content.trim().toLowerCase();
        return (
          contentLower.startsWith(`@${authorNameLower} `) ||
          contentLower.startsWith(`@${authorNameLower}:`) ||
          contentLower.startsWith(`@${authorNameLower}\n`) ||
          contentLower === `@${authorNameLower}`
        );
      });

      if (parentCandidate && map.has(parentCandidate.id)) {
        map.get(parentCandidate.id)!.children.push(node);
        childNodeIds.add(c.id);
        parentFound = true;
      }
    }

    if (!parentFound && !childNodeIds.has(c.id)) {
      roots.push(node);
    }
  });

  // Filter out any roots that are actually children
  return roots.filter((r) => !childNodeIds.has(r.id));
};
