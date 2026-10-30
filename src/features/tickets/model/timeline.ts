import type { TimelineItemDto } from './ticket.types';

const roleLabels: Record<string, string> = {
  Requester: 'Người yêu cầu',
  Agent: 'Kỹ thuật viên',
  Admin: 'Quản trị viên',
};

export function timelineRoleLabel(role: string) {
  return roleLabels[role] ?? role;
}

/**
 * The backend currently fills authorName with the author's user id, so an id-like name
 * falls back to the role label instead of showing a raw GUID.
 */
export function timelineAuthorLabel(item: TimelineItemDto, currentUserId: string | undefined) {
  if (currentUserId && item.authorId === currentUserId) return 'Bạn';
  const name = item.authorName.trim();
  if (!name || name === item.authorId) return timelineRoleLabel(item.authorRole);
  return name;
}

/** Defence in depth: the server already filters internal notes for requesters. */
export function visibleTimelineItems(items: readonly TimelineItemDto[], canSeeInternal: boolean) {
  return canSeeInternal ? [...items] : items.filter((item) => !item.isInternal);
}
