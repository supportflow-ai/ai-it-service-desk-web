export const TicketCategory = {
  ACC: 'ACC', NET: 'NET', VPN: 'VPN', MAIL: 'MAIL', SW: 'SW', HW: 'HW',
  PRINT: 'PRINT', ACCESS: 'ACCESS', EQUIP: 'EQUIP', SEC: 'SEC', OTHER: 'OTHER',
} as const;
export type TicketCategory = (typeof TicketCategory)[keyof typeof TicketCategory];

export enum TicketStatus {
  Draft = 0, Submitted = 1, InProgress = 2, PendingUser = 3, Resolved = 4,
  Closed = 5, Cancelled = 6, Triaged = 7, Assigned = 8, PendingExternal = 9,
}
export interface CreateTicketPayload { title: string; categoryId: TicketCategory; description: string }
/** The pinned wire DTO already suits the UI, so no identity mapper is needed. */
export interface TicketDto {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  categoryId: TicketCategory;
  status: TicketStatus;
  createdAt: string;
  requesterDepartmentId?: string | null;
}
export interface PagedTicketResult { items: TicketDto[]; page: number; pageSize: number; totalCount: number }
