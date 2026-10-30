import { hasAnyRole } from '@/features/auth';
import type { User } from '@/features/auth';
import { TicketStatus } from './ticket.types';

// These are UI eligibility checks only. The server still authorizes each request.
// Role rules mirror the backend use cases pinned on `dev` (ServiceDesk.Application/Ticketing).

function isStaff(user: User | null) {
  return !!user && hasAnyRole(user.roles, ['Agent', 'Admin']);
}

/**
 * Close/reopen/cancel are allowed for the ticket owner or Admin. TicketDto carries no
 * requester id, so ownership is only provable for non-staff requesters: the backend
 * scopes their ticket reads to their own tickets.
 */
function isOwnerOrAdmin(user: User | null) {
  if (!user) return false;
  if (hasAnyRole(user.roles, ['Admin'])) return true;
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

export function canCloseTicket(user: User | null, status: TicketStatus) {
  return isOwnerOrAdmin(user) && status === TicketStatus.Resolved;
}

export function canReopenTicket(user: User | null, status: TicketStatus) {
  return isOwnerOrAdmin(user) && status === TicketStatus.Resolved;
}

export function canCancelTicket(user: User | null, status: TicketStatus) {
  return isOwnerOrAdmin(user) && status === TicketStatus.Submitted;
}

/**
 * Self-assign only takes a ticket nobody holds (Submitted). An Assigned ticket already has
 * an assignee the UI cannot see, so taking it over is not offered. Admin-only accounts are
 * excluded because they could not claim the ticket afterwards.
 */
export function canSelfAssignTicket(user: User | null, status: TicketStatus) {
  return !!user && hasAnyRole(user.roles, ['Agent']) && status === TicketStatus.Submitted;
}

/** UnassignTicketUseCase accepts any Agent or Admin; Assigned is the only status known to have an assignee. */
export function canUnassignTicket(user: User | null, status: TicketStatus) {
  return isStaff(user) && status === TicketStatus.Assigned;
}
