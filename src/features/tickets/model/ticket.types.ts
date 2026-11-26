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

/**
 * SLA as the backend evaluates it (SlaSummaryDto, backend branch feat/ticketing-hoan-thien-backend).
 * The client only renders it; it never computes deadlines, remaining time or the state itself.
 */
export interface SlaClockDto {
  targetMinutes: number | null;
  elapsedMinutes: number | null;
  /** Negative once the target has been passed. */
  remainingMinutes: number | null;
  /** UTC ISO time; null while the clock is paused or finished. */
  deadline: string | null;
  isBreached: boolean;
  /** E.g. RunningAtRisk, PausedOnTrack, ResolvedBreached; see slaClockStateLabels. */
  state: string;
}

export interface SlaSummaryDto {
  /** False for a ticket the backend does not put under an SLA. */
  isApplicable: boolean;
  evaluatedAt: string;
  /** OnTrack, AtRisk, Breached, Completed or NotApplicable; read leniently so a new value does not break the page. */
  overallStatus: string;
  firstResponse: SlaClockDto | null;
  resolution: SlaClockDto | null;
}

/** The values GET /tickets/queue accepts as slaStatus (besides All, which is sent as no filter). */
export const SlaQueueStatus = {
  OnTrack: 'OnTrack',
  AtRisk: 'AtRisk',
  Breached: 'Breached',
} as const;
export type SlaQueueStatus = (typeof SlaQueueStatus)[keyof typeof SlaQueueStatus];

export interface CreateTicketPayload {
  title: string;
  categoryId: TicketCategory;
  description: string;
}

/** POST /tickets/{id}/update takes the same three fields, plus the revision on screen. */
export type UpdateTicketPayload = CreateTicketPayload;

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
  /** Support Team assigned to handle the ticket (ADR-016). Null/absent means default triage queue. */
  supportTeamId?: string | null;
  supportTeamName?: string | null;
  /** The owner: close, reopen and cancel are allowed to them and to Admin. */
  requesterId: string;
  /** Null while nobody is assigned. The backend sends no assignee name. */
  assignedToId: string | null;
  /** Sent back as expectedRevision, so a write based on an outdated copy is rejected with 409. */
  revision: number;
  /** Null (or absent) while the backend has not set one. */
  priority?: TicketPriority | null;
  /** Absent (or null) while the backend does not send SLA data; never filled in by the client. */
  sla?: SlaSummaryDto | null;
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
  /** Null shows every ticket; otherwise the backend filters on its own SLA evaluation. */
  slaStatus: SlaQueueStatus | null;
  /** Highest priority first (P1 → P4), then newest; otherwise newest first. */
  sortByPriority: boolean;
  page: number;
  pageSize: number;
}

/** GET /api/users?role=Agent (or Admin) returns only the id and the name, never the email. */
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

export interface TransferTicketTeamPayload {
  targetTeamId: string;
  reason: string;
  newAssigneeId?: string | null;
  expectedRevision: number;
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
