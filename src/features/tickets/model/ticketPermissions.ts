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

export function canResolveTicket(user: User | null, ticket: TicketFacts, view: TicketView) {
  return view === 'workspace' && isStaff(user) && ticket.status === TicketStatus.InProgress;
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

/** AssignTicketUseCase accepts any Agent or Admin on every ticket that has not ended. */
export function canAssignTicket(user: User | null, ticket: Pick<TicketDto, 'status'>) {
  return isStaff(user) && !isTerminalStatus(ticket.status);
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

/** Self-assign only takes a ticket nobody holds (Submitted); the backend accepts Agent or Admin as assignee. */
export function canSelfAssignTicket(user: User | null, ticket: TicketFacts) {
  return isStaff(user) && ticket.status === TicketStatus.Submitted;
}

/** UnassignTicketUseCase accepts any Agent or Admin, and only on an Assigned ticket. */
export function canUnassignTicket(user: User | null, ticket: TicketFacts) {
  return isStaff(user) && ticket.status === TicketStatus.Assigned;
}
