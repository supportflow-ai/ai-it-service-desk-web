import { hasAnyRole } from '@/features/auth';
import type { User } from '@/features/auth';
import type { SupportTeamDto } from './supportTeam.types';

export function canViewSupportTeams(user: User | null): boolean {
  return !!user && hasAnyRole(user.roles, ['Agent', 'Admin']);
}

export function canManageAllTeams(user: User | null): boolean {
  return !!user && hasAnyRole(user.roles, ['Admin']);
}

export function canManageTeamMembers(user: User | null, team: Pick<SupportTeamDto, 'leadId'>): boolean {
  if (!user) return false;
  if (hasAnyRole(user.roles, ['Admin'])) return true;
  return team.leadId === user.userId;
}
