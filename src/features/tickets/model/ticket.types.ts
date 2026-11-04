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

/** Computed by the backend from impact × urgency (ITIL); the client never sets it. */
export const TicketPriority = {
  P1: 'P1',
  P2: 'P2',
  P3: 'P3',
  P4: 'P4',
} as const;
export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority];

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
  /** The owner: close, reopen and cancel are allowed to them and to Admin. */
  requesterId: string;
  /** Null while nobody is assigned. The backend sends no assignee name. */
  assignedToId: string | null;
  /** Sent back as expectedRevision, so a write based on an outdated copy is rejected with 409. */
  revision: number;
  /** Null (or absent) while the backend has not set one. */
  priority?: TicketPriority | null;
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
  priority: TicketPriority | null;
  /** Highest priority first (P1 → P4), then newest; otherwise newest first. */
  sortByPriority: boolean;
  page: number;
  pageSize: number;
}

/** GET /api/users?role=Agent returns only the id and the name, never the email. */
export interface AgentDirectoryEntry {
  userId: string;
  fullName: string | null;
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

export interface UploadUrlResult {
  uploadUrl: string;
  storageKey: string;
  expirySeconds: number;
  /** Fields of a presigned POST policy; absent or null means a raw PUT to uploadUrl. */
  formData?: Record<string, string> | null;
}

export interface ConfirmAttachmentPayload extends GenerateUploadUrlPayload {
  storageKey: string;
}

export interface TicketAttachmentDto {
  id: string;
  ticketId: string;
  fileName: string;
  fileSizeBytes: number;
  contentType: string;
  storageKey: string;
  uploadedBy: string;
  createdAt: string;
}

export interface DownloadUrlResult {
  downloadUrl: string;
}
