import { describe, expect, it } from 'vitest';
import type { User } from '@/features/auth';
import { TicketStatus } from './ticket.types';
import {
  canAddInternalNote,
  canAddPublicComment,
  canAssignTicket,
  canAttachFiles,
  canCancelTicket,
  canClaimTicket,
  canCloseTicket,
  canOpenWorkspace,
  canReopenTicket,
  canResolveTicket,
  canSeeInternalNotes,
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

/** A ticket owned by someone other than every user above, and by default assigned to nobody. */
function ticket(status: TicketStatus, requesterId = 'someone-else', assignedToId: string | null = null) {
  return { status, requesterId, assignedToId };
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

  it('shows internal notes on the workspace only, never on the requester screen', () => {
    expect(canSeeInternalNotes(agent, 'workspace')).toBe(true);
    expect(canSeeInternalNotes(agent, 'requester')).toBe(false);
    expect(canSeeInternalNotes(admin, 'requester')).toBe(false);
    expect(canSeeInternalNotes(requester, 'workspace')).toBe(false);
  });

  it('offers claim and resolve to agents and admins on the workspace only', () => {
    for (const user of [agent, admin]) {
      expect(canClaimTicket(user, ticket(TicketStatus.Submitted), 'workspace')).toBe(true);
      expect(canClaimTicket(user, ticket(TicketStatus.Assigned, 'someone-else', user.userId), 'workspace')).toBe(true);
      expect(canClaimTicket(user, ticket(TicketStatus.InProgress), 'workspace')).toBe(false);
      expect(canResolveTicket(user, ticket(TicketStatus.InProgress), 'workspace')).toBe(true);
      expect(canResolveTicket(user, ticket(TicketStatus.Submitted), 'workspace')).toBe(false);
      // A staff member viewing their own request is a requester there.
      expect(canClaimTicket(user, ticket(TicketStatus.Submitted, user.userId), 'requester')).toBe(false);
      expect(canResolveTicket(user, ticket(TicketStatus.InProgress, user.userId), 'requester')).toBe(false);
    }
    expect(canClaimTicket(requester, ticket(TicketStatus.Submitted), 'workspace')).toBe(false);
    expect(canResolveTicket(requester, ticket(TicketStatus.InProgress), 'workspace')).toBe(false);
  });

  it('lets only an admin claim a ticket assigned to another agent', () => {
    expect(canClaimTicket(agent, ticket(TicketStatus.Assigned, 'someone-else', 'other-agent'), 'workspace')).toBe(false);
    expect(canClaimTicket(admin, ticket(TicketStatus.Assigned, 'someone-else', 'other-agent'), 'workspace')).toBe(true);
  });

  it('lets staff assign any ticket that has not ended', () => {
    for (const status of [TicketStatus.Submitted, TicketStatus.Assigned, TicketStatus.InProgress, TicketStatus.Resolved]) {
      expect(canAssignTicket(agent, ticket(status))).toBe(true);
      expect(canAssignTicket(admin, ticket(status))).toBe(true);
      expect(canAssignTicket(requester, ticket(status))).toBe(false);
    }
    expect(canAssignTicket(agent, ticket(TicketStatus.Closed))).toBe(false);
    expect(canAssignTicket(admin, ticket(TicketStatus.Cancelled))).toBe(false);
  });

  it('takes no public comment or new file on a closed or cancelled ticket', () => {
    for (const status of [TicketStatus.Closed, TicketStatus.Cancelled]) {
      expect(canAddPublicComment(ticket(status))).toBe(false);
      expect(canAttachFiles(ticket(status))).toBe(false);
    }
    for (const status of [TicketStatus.Submitted, TicketStatus.InProgress, TicketStatus.Resolved]) {
      expect(canAddPublicComment(ticket(status))).toBe(true);
      expect(canAttachFiles(ticket(status))).toBe(true);
    }
  });

  it('gives the owner close, reopen and cancel on their own screen, whatever their role', () => {
    for (const user of [requester, agent, admin, userWith(['Requester', 'Agent'])]) {
      expect(canCloseTicket(user, ticket(TicketStatus.Resolved, user.userId), 'requester')).toBe(true);
      expect(canReopenTicket(user, ticket(TicketStatus.Resolved, user.userId), 'requester')).toBe(true);
      expect(canCancelTicket(user, ticket(TicketStatus.Submitted, user.userId), 'requester')).toBe(true);
      expect(canCloseTicket(user, ticket(TicketStatus.Resolved), 'requester')).toBe(false);
      expect(canCancelTicket(user, ticket(TicketStatus.Submitted), 'requester')).toBe(false);
    }
  });

  it('lets only an admin close, reopen or cancel from the workspace, as the backend allows', () => {
    expect(canCloseTicket(admin, ticket(TicketStatus.Resolved), 'workspace')).toBe(true);
    expect(canReopenTicket(admin, ticket(TicketStatus.Resolved), 'workspace')).toBe(true);
    expect(canCancelTicket(admin, ticket(TicketStatus.Submitted), 'workspace')).toBe(true);
    expect(canCloseTicket(agent, ticket(TicketStatus.Resolved, agent.userId), 'workspace')).toBe(false);
    expect(canCancelTicket(agent, ticket(TicketStatus.Submitted, agent.userId), 'workspace')).toBe(false);
  });

  it('rejects transitions from the wrong status', () => {
    expect(canCloseTicket(requester, ticket(TicketStatus.InProgress, requester.userId), 'requester')).toBe(false);
    expect(canReopenTicket(requester, ticket(TicketStatus.Closed, requester.userId), 'requester')).toBe(false);
    expect(canCancelTicket(requester, ticket(TicketStatus.Assigned, requester.userId), 'requester')).toBe(false);
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
      expect(canClaimTicket(user, ticket(TicketStatus.Submitted), 'workspace')).toBe(false);
      expect(canResolveTicket(user, ticket(TicketStatus.InProgress), 'workspace')).toBe(false);
      expect(canCloseTicket(user, ticket(TicketStatus.Resolved), 'workspace')).toBe(false);
      expect(canCancelTicket(user, ticket(TicketStatus.Submitted), 'requester')).toBe(false);
      expect(canSelfAssignTicket(user, ticket(TicketStatus.Submitted))).toBe(false);
      expect(canUnassignTicket(user, ticket(TicketStatus.Assigned))).toBe(false);
      expect(canAssignTicket(user, ticket(TicketStatus.Submitted))).toBe(false);
    }
  });
});
