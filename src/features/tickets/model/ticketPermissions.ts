import { hasAnyRole } from '@/features/auth';
import type { User } from '@/features/auth';
import { TicketStatus } from './ticket.types';
import type { TicketDto } from './ticket.types';
import { isTerminalStatus } from './ticketStatus';

// These are UI eligibility checks only. The server still authorizes each request.
// Role rules mirror the backend use cases pinned on `dev` (ServiceDesk.Application/Ticketing).

type TicketFacts = Pick<TicketDto, 'status' | 'requesterId' | 'assignedToId'>;

/**
 * Which screen a ticket is shown on. The requester screen offers only what the ticket's owner
 * may do and shows only public data (PRD US-021), even to a staff member viewing their own
 * request; staff actions and internal notes belong to the workspace.
 */
export type TicketView = 'requester' | 'workspace';

function isStaff(user: User | null) {
  return !!user && hasAnyRole(user.roles, ['Agent', 'Admin']);
}

function isAdmin(user: User | null) {
  return !!user && hasAnyRole(user.roles, ['Admin']);
}

/**
 * Pause and resume (backend `dev` 3b20de5) accept the agent the ticket is assigned to, a Lead of the
 * team that holds it, or an Admin. A Lead is a team membership the web cannot read, so only the
 * assignee and an Admin are offered the command; the server still rejects anyone else.
 */
function mayDriveTicket(user: User | null, ticket: TicketFacts) {
  if (!user) return false;
  return isAdmin(user) || (hasAnyRole(user.roles, ['Agent']) && ticket.assignedToId === user.userId);
}

/**
 * Close/reopen/cancel use cases accept the ticket's requester or an Admin. The owner does it from
 * their own screen; on the workspace only an Admin may do it on their behalf.
 */
function mayActForOwner(user: User | null, ticket: TicketFacts, view: TicketView) {
  if (!user) return false;
  return view === 'requester' ? ticket.requesterId === user.userId : hasAnyRole(user.roles, ['Admin']);
}

export function canOpenWorkspace(user: User | null) {
  return isStaff(user);
}

export function canAddInternalNote(user: User | null) {
  return isStaff(user);
}

/** Internal notes are shown and written only on the workspace, never on the requester screen. */
export function canSeeInternalNotes(user: User | null, view: TicketView) {
  return view === 'workspace' && canAddInternalNote(user);
}

/**
 * ClaimTicketUseCase accepts Agent or Admin on Submitted and Assigned tickets, but a ticket assigned
 * to another agent only from an Admin (403 otherwise).
 */
export function canClaimTicket(user: User | null, ticket: TicketFacts, view: TicketView) {
  if (view !== 'workspace' || !user || !isStaff(user)) return false;
  if (ticket.status === TicketStatus.Submitted) return true;
  return ticket.status === TicketStatus.Assigned
    && (ticket.assignedToId === user.userId || hasAnyRole(user.roles, ['Admin']));
}

/** Resolve accepts InProgress and, since DEC-04, PendingExternal; never PendingUser. */
export function canResolveTicket(user: User | null, ticket: TicketFacts, view: TicketView) {
  return view === 'workspace' && isStaff(user)
    && (ticket.status === TicketStatus.InProgress || ticket.status === TicketStatus.PendingExternal);
}

/** InProgress → PendingUser or PendingExternal; pauses the resolution clock. */
export function canPauseTicket(user: User | null, ticket: TicketFacts, view: TicketView) {
  return view === 'workspace' && mayDriveTicket(user, ticket) && ticket.status === TicketStatus.InProgress;
}

/** PendingUser or PendingExternal → InProgress. A requester's public comment resumes PendingUser by itself. */
export function canResumeTicket(user: User | null, ticket: TicketFacts, view: TicketView) {
  return view === 'workspace' && mayDriveTicket(user, ticket)
    && (ticket.status === TicketStatus.PendingUser || ticket.status === TicketStatus.PendingExternal);
}

export function canCloseTicket(user: User | null, ticket: TicketFacts, view: TicketView) {
  return mayActForOwner(user, ticket, view) && ticket.status === TicketStatus.Resolved;
}

export function canReopenTicket(user: User | null, ticket: TicketFacts, view: TicketView) {
  return mayActForOwner(user, ticket, view) && ticket.status === TicketStatus.Resolved;
}

export function canCancelTicket(user: User | null, ticket: TicketFacts, view: TicketView) {
  return mayActForOwner(user, ticket, view) && ticket.status === TicketStatus.Submitted;
}

/** UpdateTicketUseCase: the requester or an Admin, and only while nobody has taken it (Submitted). */
export function canEditTicket(user: User | null, ticket: TicketFacts, view: TicketView) {
  return mayActForOwner(user, ticket, view) && ticket.status === TicketStatus.Submitted;
}

/**
 * AssignTicketUseCase (backend `dev` 3b20de5) accepts a Lead of the team that holds the ticket, who
 * may only pick an agent of that team, or an Admin, who may pick any agent; an ordinary Agent gets 403.
 * It refuses Closed, Cancelled and Resolved tickets (400). A Lead is a team membership the web cannot
 * read, so only an Admin is offered the command; the server still rejects anyone else.
 */
export function canAssignTicket(user: User | null, ticket: Pick<TicketDto, 'status'>) {
  return isAdmin(user) && !isTerminalStatus(ticket.status) && ticket.status !== TicketStatus.Resolved;
}

/**
 * Public comments and uploads (upload-url and confirm) are rejected on Closed and Cancelled
 * tickets (400). Internal notes and downloads are still accepted there.
 */
export function canAddPublicComment(ticket: Pick<TicketDto, 'status'>) {
  return !isTerminalStatus(ticket.status);
}

export function canAttachFiles(ticket: Pick<TicketDto, 'status'>) {
  return !isTerminalStatus(ticket.status);
}

/**
 * Self-assign goes through the assign command, so it is an Admin's too; an Agent takes a ticket nobody
 * holds (Submitted) with claim instead. Only a Submitted ticket qualifies.
 */
export function canSelfAssignTicket(user: User | null, ticket: TicketFacts) {
  return isAdmin(user) && ticket.status === TicketStatus.Submitted;
}

/** UnassignTicketUseCase accepts a Lead of the holding team or an Admin (an Agent gets 403), and only on an Assigned ticket. */
export function canUnassignTicket(user: User | null, ticket: TicketFacts) {
  return isAdmin(user) && ticket.status === TicketStatus.Assigned;
}
