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

export interface CreateTicketPayload {
  title: string;
  categoryId: TicketCategory;
  description: string;
}

/** The pinned backend TicketDto; the UI never adds fields the server does not send. */
export interface TicketDto {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  categoryId: TicketCategory;
  status: TicketStatus;
  createdAt: string;
  requesterDepartmentId?: string | null;
  requesterId?: string;
  assignedToId?: string | null;
  assignedAt?: string | null;
  updatedAt?: string | null;
  revision?: number;
  priority?: string | null;
  impact?: string | null;
  urgency?: string | null;
}

export interface PagedTicketResult {
  items: TicketDto[];
  page: number;
  pageSize: number;
  totalCount: number;
}

/** `all` is sent as no scope; the backend only knows `unassigned` and `my`. */
export type AgentQueueScope = 'unassigned' | 'my' | 'all';

export interface AgentQueueFilters {
  scope: AgentQueueScope;
  status: TicketStatus | null;
  category: TicketCategory | null;
  page: number;
  pageSize: number;
}

export interface TimelineItemDto {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface AddCommentPayload {
  ticketId: string;
  content: string;
}

export interface AddInternalNotePayload {
  ticketId: string;
  content: string;
}

export interface GenerateUploadUrlPayload {
  fileName: string;
  fileSizeBytes: number;
  contentType: string;
}

export interface ConfirmAttachmentPayload extends GenerateUploadUrlPayload {
  storageKey: string;
}

export interface TicketAttachmentDto extends ConfirmAttachmentPayload {
  id: string;
  ticketId: string;
  uploadedBy: string;
  createdAt: string;
}

export interface UploadUrlResult {
  uploadUrl: string;
  storageKey: string;
  expirySeconds: number;
  formData?: Record<string, string> | null;
}

export interface DownloadUrlResult {
  downloadUrl: string;
}

export interface AgentSummary {
  userId: string;
  email: string;
  fullName?: string | null;
}
