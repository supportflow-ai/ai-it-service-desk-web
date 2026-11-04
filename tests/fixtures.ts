export const user = { userId: '00000000-0000-0000-0000-000000000001', email: 'synthetic@example.invalid', fullName: null, roles: ['Requester'] };
export const ticketA = {
  id: '10000000-0000-0000-0000-000000000001', ticketNumber: 'IT-2026-0001',
  title: 'Ticket A', description: 'Mô tả sự cố A đầy đủ.', categoryId: 'NET', status: 1,
  createdAt: '2026-10-19T00:00:00Z', requesterDepartmentId: null, revision: 7,
  // Owned by another account; tests that act as the owner set requesterId: user.userId.
  requesterId: '00000000-0000-0000-0000-000000000009', assignedToId: null as string | null,
  priority: 'P3' as 'P1' | 'P2' | 'P3' | 'P4' | null,
};
/** GET /api/users?role=Agent: id and name only, never an email. */
export const namedAgent = { userId: '00000000-0000-0000-0000-000000000005', fullName: 'Trần Thị Bình' };
export const agentDirectory = [namedAgent, { userId: '00000000-0000-0000-0000-000000000006', fullName: null }];
export const ticketB = { ...ticketA, id: '10000000-0000-0000-0000-000000000002', ticketNumber: 'IT-2026-0002', title: 'Ticket B' };
export const timelineItemA = {
  id: '20000000-0000-0000-0000-000000000001',
  ticketId: ticketA.id,
  authorId: user.userId,
  authorName: 'Nguyễn Văn An',
  authorRole: 'Requester',
  content: 'Nội dung phản hồi mẫu.',
  isInternal: false,
  createdAt: '2026-10-20T10:00:00Z',
};
/** ArticleDto at backend dev 1506a5b: the test user's draft and another author's articles. */
export const ownDraft = {
  id: '40000000-0000-0000-0000-000000000001', title: 'Kết nối VPN khi làm việc từ xa',
  content: '## Bước 1\n\nMở ứng dụng VPN và đăng nhập bằng tài khoản công ty.', status: 0, authorId: user.userId,
  version: 1, revision: 21, tags: ['vpn'], createdAt: '2026-11-04T08:00:00Z', updatedAt: '2026-11-04T09:00:00Z',
  publishedAt: null as string | null, archivedAt: null as string | null,
};
export const othersPublished = {
  ...ownDraft, id: '40000000-0000-0000-0000-000000000002', title: 'Đổi mật khẩu email', status: 1,
  authorId: namedAgent.userId, tags: ['mail', 'password'], publishedAt: '2026-11-03T08:00:00Z',
};
export const othersDraft = { ...ownDraft, id: '40000000-0000-0000-0000-000000000003', title: 'Nháp của tác giả khác', authorId: namedAgent.userId, tags: [] };
export function articlePage(items: object[], totalCount = items.length) {
  return { items, page: 1, pageSize: 10, totalCount, totalPages: Math.ceil(totalCount / 10) };
}
