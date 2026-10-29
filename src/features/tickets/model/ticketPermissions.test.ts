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
} from './ticketPermissions';

const agentUser: User = {
  userId: 'agent-1',
  email: 'agent@supportflow.vn',
  fullName: 'Agent User',
  roles: ['Agent'],
};

const requesterUser: User = {
  userId: 'req-1',
  email: 'user@supportflow.vn',
  fullName: 'Requester User',
  roles: ['Requester'],
};

describe('ticketPermissions', () => {
  it('allows agent and admin to open workspace and add internal notes', () => {
    expect(canOpenWorkspace(agentUser)).toBe(true);
    expect(canAddInternalNote(agentUser)).toBe(true);
    expect(canOpenWorkspace(requesterUser)).toBe(false);
    expect(canAddInternalNote(requesterUser)).toBe(false);
    expect(canOpenWorkspace(null)).toBe(false);
    expect(canAddInternalNote(null)).toBe(false);
  });

  it('checks ticket claim eligibility based on status', () => {
    expect(canClaimTicket(TicketStatus.Submitted)).toBe(true);
    expect(canClaimTicket(TicketStatus.Assigned)).toBe(true);
    expect(canClaimTicket(TicketStatus.InProgress)).toBe(false);
    expect(canClaimTicket(TicketStatus.Resolved)).toBe(false);
  });

  it('checks resolve, close, reopen, cancel lifecycle transitions', () => {
    expect(canResolveTicket(TicketStatus.InProgress)).toBe(true);
    expect(canResolveTicket(TicketStatus.Submitted)).toBe(false);

    expect(canCloseTicket(TicketStatus.Resolved)).toBe(true);
    expect(canCloseTicket(TicketStatus.InProgress)).toBe(false);

    expect(canReopenTicket(TicketStatus.Resolved)).toBe(true);
    expect(canReopenTicket(TicketStatus.Closed)).toBe(false);

    expect(canCancelTicket(TicketStatus.Submitted)).toBe(true);
    expect(canCancelTicket(TicketStatus.InProgress)).toBe(false);
  });
});
