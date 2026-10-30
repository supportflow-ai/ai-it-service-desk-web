import { describe, expect, it } from 'vitest';
import type { User } from '@/features/auth';
import { TicketStatus } from './ticket.types';
import {
  canAddInternalNote,
  canCancelTicket,
  canClaimTicket,
  canCloseTicket,
  canOpenWorkspace,
  canReopenTicket,
  canResolveTicket,
  canSelfAssignTicket,
  canUnassignTicket,
} from './ticketPermissions';

function userWith(roles: User['roles']): User {
  return { userId: `user-${roles.join('-')}`, email: 'synthetic@example.invalid', fullName: null, roles };
}

const requester = userWith(['Requester']);
const agent = userWith(['Agent']);
const admin = userWith(['Admin']);
const unknownRole = userWith([]);

describe('ticketPermissions', () => {
  it('allows agent and admin to open workspace and add internal notes', () => {
    expect(canOpenWorkspace(agent)).toBe(true);
    expect(canAddInternalNote(admin)).toBe(true);
    expect(canOpenWorkspace(requester)).toBe(false);
    expect(canAddInternalNote(requester)).toBe(false);
    expect(canOpenWorkspace(null)).toBe(false);
    expect(canAddInternalNote(null)).toBe(false);
  });

  it('lets only agents claim submitted or assigned tickets', () => {
    expect(canClaimTicket(agent, TicketStatus.Submitted)).toBe(true);
    expect(canClaimTicket(agent, TicketStatus.Assigned)).toBe(true);
    expect(canClaimTicket(agent, TicketStatus.InProgress)).toBe(false);
    expect(canClaimTicket(admin, TicketStatus.Submitted)).toBe(false);
    expect(canClaimTicket(requester, TicketStatus.Submitted)).toBe(false);
  });

  it('lets staff resolve in-progress tickets', () => {
    expect(canResolveTicket(agent, TicketStatus.InProgress)).toBe(true);
    expect(canResolveTicket(admin, TicketStatus.InProgress)).toBe(true);
    expect(canResolveTicket(agent, TicketStatus.Submitted)).toBe(false);
    expect(canResolveTicket(requester, TicketStatus.InProgress)).toBe(false);
  });

  it('keeps close, reopen and cancel for the owner or admin, never a plain agent', () => {
    for (const user of [requester, admin]) {
      expect(canCloseTicket(user, TicketStatus.Resolved)).toBe(true);
      expect(canReopenTicket(user, TicketStatus.Resolved)).toBe(true);
      expect(canCancelTicket(user, TicketStatus.Submitted)).toBe(true);
    }
    expect(canCloseTicket(agent, TicketStatus.Resolved)).toBe(false);
    expect(canReopenTicket(agent, TicketStatus.Resolved)).toBe(false);
    expect(canCancelTicket(agent, TicketStatus.Submitted)).toBe(false);
    expect(canCancelTicket(userWith(['Requester', 'Agent']), TicketStatus.Submitted)).toBe(false);
  });

  it('rejects transitions from the wrong status', () => {
    expect(canCloseTicket(requester, TicketStatus.InProgress)).toBe(false);
    expect(canReopenTicket(requester, TicketStatus.Closed)).toBe(false);
    expect(canCancelTicket(requester, TicketStatus.Assigned)).toBe(false);
  });

  it('offers self-assign only to agents on tickets nobody holds', () => {
    expect(canSelfAssignTicket(agent, TicketStatus.Submitted)).toBe(true);
    expect(canSelfAssignTicket(agent, TicketStatus.Assigned)).toBe(false);
    expect(canSelfAssignTicket(admin, TicketStatus.Submitted)).toBe(false);
    expect(canSelfAssignTicket(requester, TicketStatus.Submitted)).toBe(false);
  });

  it('offers unassign to staff only when the ticket is known to be assigned', () => {
    expect(canUnassignTicket(agent, TicketStatus.Assigned)).toBe(true);
    expect(canUnassignTicket(admin, TicketStatus.Assigned)).toBe(true);
    expect(canUnassignTicket(agent, TicketStatus.InProgress)).toBe(false);
    expect(canUnassignTicket(requester, TicketStatus.Assigned)).toBe(false);
  });

  it('grants nothing to unknown roles or anonymous users', () => {
    for (const user of [unknownRole, null]) {
      expect(canClaimTicket(user, TicketStatus.Submitted)).toBe(false);
      expect(canResolveTicket(user, TicketStatus.InProgress)).toBe(false);
      expect(canCloseTicket(user, TicketStatus.Resolved)).toBe(false);
      expect(canCancelTicket(user, TicketStatus.Submitted)).toBe(false);
      expect(canSelfAssignTicket(user, TicketStatus.Submitted)).toBe(false);
      expect(canUnassignTicket(user, TicketStatus.Assigned)).toBe(false);
    }
  });
});
