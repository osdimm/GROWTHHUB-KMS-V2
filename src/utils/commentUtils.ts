import { ForumComment } from '../types';

export interface CommentTreeNode extends ForumComment {
  children: CommentTreeNode[];
}

/**
 * Helper: Convert flat comments array into hierarchical nested tree
 * Guarantees:
 * 1. Pinned comments appear at the top.
 * 2. New root comments (parentId: null/undefined) stay at the VERY BOTTOM.
 * 3. Soft-deleted comments stay in their exact original position in the tree without dropping or jumping.
 */
export const buildCommentTree = (comments: ForumComment[]): CommentTreeNode[] => {
  if (!comments || comments.length === 0) return [];

  // 1. Record original array index for stable positional order
  const orderMap = new Map<string, number>();
  comments.forEach((c, idx) => {
    if (c.id && !orderMap.has(c.id)) {
      orderMap.set(c.id, idx);
    }
  });

  // 2. Deduplicate comments strictly by ID (Soft-deleted comments MUST preserve unique ID and parentId)
  const dedupMap = new Map<string, ForumComment>();
  comments.forEach((c) => {
    if (!c.id) return;
    const isDeleted =
      c.author === '[Dihapus]' ||
      c.content === '[Komentar telah dihapus]' ||
      c.content === '[Pesan telah dihapus]';

    if (isDeleted) {
      dedupMap.set(c.id, {
        ...c,
        isPinned: false
      });
      return;
    }

    if (!dedupMap.has(c.id)) {
      dedupMap.set(c.id, c);
    }
  });

  const uniqueComments = Array.from(dedupMap.values());

  // 3. Initialize node map (force isPinned to false for soft-deleted comments)
  const map = new Map<string, CommentTreeNode>();
  uniqueComments.forEach((c) => {
    const isDeleted =
      c.author === '[Dihapus]' ||
      c.content === '[Komentar telah dihapus]' ||
      c.content === '[Pesan telah dihapus]';

    map.set(c.id, {
      ...c,
      isPinned: isDeleted ? false : Boolean(c.isPinned),
      children: []
    });
  });

  // 4. Attach children and track root nodes
  const childNodeIds = new Set<string>();
  const roots: CommentTreeNode[] = [];

  uniqueComments.forEach((c) => {
    const node = map.get(c.id)!;
    let parentFound = false;

    // PINNED COMMENTS: Promoted directly to top-level root
    if (node.isPinned) {
      roots.push(node);
      return;
    }

    // Direct parentId match
    if (c.parentId && map.has(c.parentId) && c.parentId !== c.id) {
      map.get(c.parentId)!.children.push(node);
      childNodeIds.add(c.id);
      parentFound = true;
    } else if (c.parentId === null || c.parentId === undefined) {
      // EXPLICIT ROOT COMMENT (No parentId) -> Always a root node
      roots.push(node);
      parentFound = true;
    } else {
      // Mention match fallback ONLY if parentId is not null/undefined string and points to non-deleted author
      const parentCandidate = uniqueComments.find((p) => {
        if (p.id === c.id) return false;
        const authorNameLower = p.author.trim().toLowerCase();
        const contentLower = c.content.trim().toLowerCase();
        return (
          authorNameLower !== '[dihapus]' &&
          (contentLower.startsWith(`@${authorNameLower} `) ||
           contentLower.startsWith(`@${authorNameLower}:`) ||
           contentLower.startsWith(`@${authorNameLower}\n`) ||
           contentLower === `@${authorNameLower}`)
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

  // 5. Sort children of every node by their original position index
  map.forEach((node) => {
    node.children.sort((a, b) => {
      const idxA = orderMap.get(a.id) ?? 0;
      const idxB = orderMap.get(b.id) ?? 0;
      return idxA - idxB;
    });
  });

  // 6. Filter roots & Sort validRoots:
  // - Pinned comments appear at the VERY TOP.
  // - Non-pinned root comments remain in their EXACT original order (oldest top, newest at bottom).
  const validRoots = roots.filter((r) => r.isPinned || !childNodeIds.has(r.id));

  return validRoots.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const idxA = orderMap.get(a.id) ?? 0;
    const idxB = orderMap.get(b.id) ?? 0;
    return idxA - idxB;
  });
};
