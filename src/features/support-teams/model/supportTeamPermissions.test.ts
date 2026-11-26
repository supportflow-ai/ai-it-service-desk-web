import { describe, expect, it } from 'vitest';
import type { User } from '@/features/auth';
import {
  canManageAllTeams,
  canManageTeamMembers,
  canViewSupportTeams,
} from './supportTeamPermissions';

function userWith(roles: User['roles'], userId = 'test-user'): User {
  return { userId, email: 'test@example.com', fullName: null, roles };
}

describe('supportTeamPermissions', () => {
  it('allows Agent and Admin to view support teams, forbids Requester and anonymous', () => {
    expect(canViewSupportTeams(userWith(['Agent']))).toBe(true);
    expect(canViewSupportTeams(userWith(['Admin']))).toBe(true);
    expect(canViewSupportTeams(userWith(['Requester']))).toBe(false);
    expect(canViewSupportTeams(null)).toBe(false);
  });

  it('allows only Admin to manage all teams', () => {
    expect(canManageAllTeams(userWith(['Admin']))).toBe(true);
    expect(canManageAllTeams(userWith(['Agent']))).toBe(false);
    expect(canManageAllTeams(userWith(['Requester']))).toBe(false);
    expect(canManageAllTeams(null)).toBe(false);
  });

  it('allows Admin or the assigned team Lead to manage members', () => {
    const team = { leadId: 'lead-123' };
    const leadUser = userWith(['Agent'], 'lead-123');
    const otherAgent = userWith(['Agent'], 'agent-456');
    const adminUser = userWith(['Admin'], 'admin-999');

    expect(canManageTeamMembers(leadUser, team)).toBe(true);
    expect(canManageTeamMembers(adminUser, team)).toBe(true);
    expect(canManageTeamMembers(otherAgent, team)).toBe(false);
    expect(canManageTeamMembers(null, team)).toBe(false);
  });
});
