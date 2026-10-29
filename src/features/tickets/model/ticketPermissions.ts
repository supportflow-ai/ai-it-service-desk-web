import { hasAnyRole } from '@/features/auth';
import type { User } from '@/features/auth';
import { TicketStatus } from './ticket.types';

// These are UI eligibility checks only. The server still authorizes each request.
export function canOpenWorkspace(user: User | null) {
  return !!user && hasAnyRole(user.roles, ['Agent', 'Admin']);
}

export function canAddInternalNote(user: User | null) {
  return !!user && hasAnyRole(user.roles, ['Agent', 'Admin']);
}

export function canClaimTicket(status: TicketStatus) {
  return status === TicketStatus.Submitted || status === TicketStatus.Assigned;
}

export function canResolveTicket(status: TicketStatus) {
  return status === TicketStatus.InProgress;
}

export function canCloseTicket(status: TicketStatus) {
  return status === TicketStatus.Resolved;
}

export function canReopenTicket(status: TicketStatus) {
  return status === TicketStatus.Resolved;
}

export function canCancelTicket(status: TicketStatus) {
  return status === TicketStatus.Submitted;
}

export const ticketCapabilities = {
  timeline: true,
  comments: true,
  internalNotes: true,
  triage: false,
  assign: true,
  claim: true,
  start: false,
  requestInformation: false,
  resolve: true,
  close: true,
  reopen: true,
  cancel: true,
  attachments: true,
} as const;
