import { hasAnyRole } from '@/features/auth';
import type { User } from '@/features/auth';
import { TicketStatus } from './ticket.types';
import type { TicketDto } from './ticket.types';

// These are UI eligibility checks only. The server still authorizes each request.
// Role rules mirror the backend use cases pinned on `dev` (ServiceDesk.Application/Ticketing).

type TicketFacts = Pick<TicketDto, 'status' | 'requesterId'>;

function isStaff(user: User | null) {
  return !!user && hasAnyRole(user.roles, ['Agent', 'Admin']);
}

/** Close/reopen/cancel use cases accept the ticket's requester, whatever their role, or an Admin. */
function isOwnerOrAdmin(user: User | null, ticket: TicketFacts) {
  if (!user) return false;
  return hasAnyRole(user.roles, ['Admin']) || ticket.requesterId === user.userId;
}

export function canOpenWorkspace(user: User | null) {
  return isStaff(user);
}

export function canAddInternalNote(user: User | null) {
  return isStaff(user);
}

/** ClaimTicketUseCase accepts Agent or Admin on Submitted and Assigned tickets. */
export function canClaimTicket(user: User | null, ticket: TicketFacts) {
  return isStaff(user) && (ticket.status === TicketStatus.Submitted || ticket.status === TicketStatus.Assigned);
}

export function canResolveTicket(user: User | null, ticket: TicketFacts) {
  return isStaff(user) && ticket.status === TicketStatus.InProgress;
}

export function canCloseTicket(user: User | null, ticket: TicketFacts) {
  return isOwnerOrAdmin(user, ticket) && ticket.status === TicketStatus.Resolved;
}

export function canReopenTicket(user: User | null, ticket: TicketFacts) {
  return isOwnerOrAdmin(user, ticket) && ticket.status === TicketStatus.Resolved;
}

export function canCancelTicket(user: User | null, ticket: TicketFacts) {
  return isOwnerOrAdmin(user, ticket) && ticket.status === TicketStatus.Submitted;
}

/** Self-assign only takes a ticket nobody holds (Submitted); the backend accepts Agent or Admin as assignee. */
export function canSelfAssignTicket(user: User | null, ticket: TicketFacts) {
  return isStaff(user) && ticket.status === TicketStatus.Submitted;
}

/**
 * UnassignTicketUseCase accepts any Agent or Admin. It is offered only on Assigned: unassigning an
 * InProgress ticket would leave it in progress with nobody holding it.
 */
export function canUnassignTicket(user: User | null, ticket: TicketFacts) {
  return isStaff(user) && ticket.status === TicketStatus.Assigned;
}
