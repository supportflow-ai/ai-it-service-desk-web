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

/** A ticket owned by someone other than every user above. */
function ticket(status: TicketStatus, requesterId = 'someone-else') {
  return { status, requesterId };
}

describe('ticketPermissions', () => {
  it('allows agent and admin to open workspace and add internal notes', () => {
    expect(canOpenWorkspace(agent)).toBe(true);
    expect(canAddInternalNote(admin)).toBe(true);
    expect(canOpenWorkspace(requester)).toBe(false);
    expect(canAddInternalNote(requester)).toBe(false);
    expect(canOpenWorkspace(null)).toBe(false);
    expect(canAddInternalNote(null)).toBe(false);
  });

  it('lets agents and admins claim submitted or assigned tickets', () => {
    for (const user of [agent, admin]) {
      expect(canClaimTicket(user, ticket(TicketStatus.Submitted))).toBe(true);
      expect(canClaimTicket(user, ticket(TicketStatus.Assigned))).toBe(true);
      expect(canClaimTicket(user, ticket(TicketStatus.InProgress))).toBe(false);
    }
    expect(canClaimTicket(requester, ticket(TicketStatus.Submitted))).toBe(false);
  });

  it('lets staff resolve in-progress tickets', () => {
    expect(canResolveTicket(agent, ticket(TicketStatus.InProgress))).toBe(true);
    expect(canResolveTicket(admin, ticket(TicketStatus.InProgress))).toBe(true);
    expect(canResolveTicket(agent, ticket(TicketStatus.Submitted))).toBe(false);
    expect(canResolveTicket(requester, ticket(TicketStatus.InProgress))).toBe(false);
  });

  it('keeps close, reopen and cancel for the ticket owner, whatever their role, or an admin', () => {
    for (const user of [requester, agent, userWith(['Requester', 'Agent'])]) {
      expect(canCloseTicket(user, ticket(TicketStatus.Resolved, user.userId))).toBe(true);
      expect(canReopenTicket(user, ticket(TicketStatus.Resolved, user.userId))).toBe(true);
      expect(canCancelTicket(user, ticket(TicketStatus.Submitted, user.userId))).toBe(true);
      expect(canCloseTicket(user, ticket(TicketStatus.Resolved))).toBe(false);
      expect(canReopenTicket(user, ticket(TicketStatus.Resolved))).toBe(false);
      expect(canCancelTicket(user, ticket(TicketStatus.Submitted))).toBe(false);
    }
    expect(canCloseTicket(admin, ticket(TicketStatus.Resolved))).toBe(true);
    expect(canReopenTicket(admin, ticket(TicketStatus.Resolved))).toBe(true);
    expect(canCancelTicket(admin, ticket(TicketStatus.Submitted))).toBe(true);
  });

  it('rejects transitions from the wrong status', () => {
    expect(canCloseTicket(requester, ticket(TicketStatus.InProgress, requester.userId))).toBe(false);
    expect(canReopenTicket(requester, ticket(TicketStatus.Closed, requester.userId))).toBe(false);
    expect(canCancelTicket(requester, ticket(TicketStatus.Assigned, requester.userId))).toBe(false);
  });

  it('offers self-assign to staff only on tickets nobody holds', () => {
    expect(canSelfAssignTicket(agent, ticket(TicketStatus.Submitted))).toBe(true);
    expect(canSelfAssignTicket(admin, ticket(TicketStatus.Submitted))).toBe(true);
    expect(canSelfAssignTicket(agent, ticket(TicketStatus.Assigned))).toBe(false);
    expect(canSelfAssignTicket(requester, ticket(TicketStatus.Submitted))).toBe(false);
  });

  it('offers unassign to staff only on assigned tickets, never on in-progress ones', () => {
    expect(canUnassignTicket(agent, ticket(TicketStatus.Assigned))).toBe(true);
    expect(canUnassignTicket(admin, ticket(TicketStatus.Assigned))).toBe(true);
    expect(canUnassignTicket(agent, ticket(TicketStatus.InProgress))).toBe(false);
    expect(canUnassignTicket(requester, ticket(TicketStatus.Assigned))).toBe(false);
  });

  it('grants nothing to unknown roles or anonymous users', () => {
    for (const user of [unknownRole, null]) {
      expect(canClaimTicket(user, ticket(TicketStatus.Submitted))).toBe(false);
      expect(canResolveTicket(user, ticket(TicketStatus.InProgress))).toBe(false);
      expect(canCloseTicket(user, ticket(TicketStatus.Resolved))).toBe(false);
      expect(canCancelTicket(user, ticket(TicketStatus.Submitted))).toBe(false);
      expect(canSelfAssignTicket(user, ticket(TicketStatus.Submitted))).toBe(false);
      expect(canUnassignTicket(user, ticket(TicketStatus.Assigned))).toBe(false);
    }
  });
});
