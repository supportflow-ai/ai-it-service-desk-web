import { hasAnyRole } from '@/features/auth';
import type { User } from '@/features/auth';
import { TicketStatus } from './ticket.types';

// These are UI eligibility checks only. The server still authorizes each request.
// Role rules mirror the backend use cases pinned on `dev` (ServiceDesk.Application/Ticketing).

function isStaff(user: User | null) {
  return !!user && hasAnyRole(user.roles, ['Agent', 'Admin']);
}

/**
 * Close/reopen/cancel use requesterId when supplied; legacy non-staff reads are scoped
 * to the caller by the backend. Backend authorization remains authoritative.
 */
function isOwnerOrAdmin(user: User | null, requesterId?: string) {
  if (!user) return false;
  if (hasAnyRole(user.roles, ['Admin'])) return true;
  if (requesterId !== undefined) return user.userId === requesterId;
  return hasAnyRole(user.roles, ['Requester']) && !isStaff(user);
}

export function canOpenWorkspace(user: User | null) {
  return isStaff(user);
}

export function canAddInternalNote(user: User | null) {
  return isStaff(user);
}

/** ClaimTicketUseCase requires the Agent role; Admin alone is rejected. */
export function canClaimTicket(user: User | null, status: TicketStatus) {
  return !!user && hasAnyRole(user.roles, ['Agent'])
    && (status === TicketStatus.Submitted || status === TicketStatus.Assigned);
}

export function canResolveTicket(user: User | null, status: TicketStatus) {
  return isStaff(user) && status === TicketStatus.InProgress;
}

export function canCloseTicket(user: User | null, status: TicketStatus, requesterId?: string) {
  return isOwnerOrAdmin(user, requesterId) && status === TicketStatus.Resolved;
}

export function canReopenTicket(user: User | null, status: TicketStatus, requesterId?: string) {
  return isOwnerOrAdmin(user, requesterId) && status === TicketStatus.Resolved;
}

export function canCancelTicket(user: User | null, status: TicketStatus, requesterId?: string) {
  return isOwnerOrAdmin(user, requesterId) && status === TicketStatus.Submitted;
}

/**
 * Self-assign is offered on Submitted. Staff can choose a different agent explicitly;
 * both commands carry the ticket revision.
 */
export function canSelfAssignTicket(user: User | null, status: TicketStatus) {
  return !!user && hasAnyRole(user.roles, ['Agent']) && status === TicketStatus.Submitted;
}

/** UnassignTicketUseCase accepts any Agent or Admin; Assigned is the only status known to have an assignee. */
export function canUnassignTicket(user: User | null, status: TicketStatus, assignedToId?: string | null) {
  return isStaff(user) && (assignedToId === undefined ? status === TicketStatus.Assigned
    : !!assignedToId && status !== TicketStatus.Closed && status !== TicketStatus.Cancelled);
}
