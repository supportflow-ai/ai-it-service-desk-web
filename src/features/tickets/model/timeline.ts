import type { TimelineItemDto } from './ticket.types';

const roleLabels: Record<string, string> = {
  Requester: 'Người yêu cầu',
  Agent: 'Kỹ thuật viên',
  Admin: 'Quản trị viên',
  System: 'Hệ thống',
};

export function timelineRoleLabel(role: string) {
  return roleLabels[role] ?? role;
}

/**
 * Status and assignment changes are recorded as System entries under the acting user's id, so
 * they read as "Hệ thống" even for the viewer who made the change. An empty or id-like name falls
 * back to the role label instead of showing a raw GUID.
 */
export function timelineAuthorLabel(item: TimelineItemDto, currentUserId: string | undefined) {
  if (item.authorRole === 'System') return timelineRoleLabel(item.authorRole);
  if (currentUserId && item.authorId === currentUserId) return 'Bạn';
  const name = item.authorName.trim();
  if (!name || name === item.authorId) return timelineRoleLabel(item.authorRole);
  return name;
}

/** Defence in depth: the server already filters internal notes for requesters. */
export function visibleTimelineItems(items: readonly TimelineItemDto[], canSeeInternal: boolean) {
  return canSeeInternal ? [...items] : items.filter((item) => !item.isInternal);
}
