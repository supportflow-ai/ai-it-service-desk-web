export const user = { userId: '00000000-0000-0000-0000-000000000001', email: 'synthetic@example.invalid', fullName: null, roles: ['Requester'] };
export const ticketA = {
  id: '10000000-0000-0000-0000-000000000001', ticketNumber: 'IT-2026-0001',
  title: 'Ticket A', description: 'Mô tả sự cố A đầy đủ.', categoryId: 'NET', status: 1,
  createdAt: '2026-10-19T00:00:00Z', requesterDepartmentId: null,
};
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
