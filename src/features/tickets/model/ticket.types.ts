export const TicketCategory = {
  ACC: 'ACC',
  NET: 'NET',
  VPN: 'VPN',
  MAIL: 'MAIL',
  SW: 'SW',
  HW: 'HW',
  PRINT: 'PRINT',
  ACCESS: 'ACCESS',
  EQUIP: 'EQUIP',
  SEC: 'SEC',
  OTHER: 'OTHER',
} as const;
export type TicketCategory = (typeof TicketCategory)[keyof typeof TicketCategory];

export enum TicketStatus {
  Draft = 0,
  Submitted = 1,
  InProgress = 2,
  PendingUser = 3,
  Resolved = 4,
  Closed = 5,
  Cancelled = 6,
  Triaged = 7,
  Assigned = 8,
  PendingExternal = 9,
}

export type TicketPriority = 'P1' | 'P2' | 'P3' | 'P4';

export interface CreateTicketPayload {
  title: string;
  categoryId: TicketCategory;
  description: string;
}

/** The pinned wire DTO already suits the UI, with optional display fields for richer workspace views */
export interface TicketDto {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  categoryId: TicketCategory;
  status: TicketStatus;
  createdAt: string;
  requesterDepartmentId?: string | null;
  // Optional metadata fields for workspace and queue displays
  priority?: TicketPriority;
  requesterName?: string;
  departmentName?: string;
  assignedToName?: string;
  slaText?: string;
  slaStatus?: 'ok' | 'warning' | 'danger';
  updatedAt?: string;
  deviceCode?: string;
  revision?: number;
}

export interface PagedTicketResult {
  items: TicketDto[];
  page: number;
  pageSize: number;
  totalCount: number;
}
