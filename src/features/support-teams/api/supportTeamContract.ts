import { AppError } from '@/shared/api/httpError';
import { isRecord } from '@/shared/lib/guards';
import { TicketCategory } from '@/features/tickets';
import type { SupportTeamDto, SupportTeamMemberDto } from '../model/supportTeam.types';

function isTeamMember(value: unknown): value is SupportTeamMemberDto {
  return isRecord(value)
    && typeof value.userId === 'string'
    && (value.fullName === null || typeof value.fullName === 'string')
    && (value.role === 'Lead' || value.role === 'Agent')
    && typeof value.joinedAt === 'string';
}

function isSupportTeam(value: unknown): value is SupportTeamDto {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.code === 'string'
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && (value.leadId === null || typeof value.leadId === 'string')
    && (value.leadName === null || typeof value.leadName === 'string')
    && Array.isArray(value.categories)
    && value.categories.every((cat) => Object.values(TicketCategory).some((valid) => valid === cat))
    && typeof value.memberCount === 'number'
    && typeof value.isDefaultTriage === 'boolean'
    && (value.status === 'active' || value.status === 'inactive')
    && typeof value.createdAt === 'string'
    && (value.members === undefined || (Array.isArray(value.members) && value.members.every(isTeamMember)));
}

export function readSupportTeam(value: unknown): SupportTeamDto {
  if (!isSupportTeam(value)) {
    throw new AppError('Phản hồi đội hỗ trợ không hợp lệ.', 'invalid-response');
  }
  return value;
}

export function readSupportTeams(value: unknown): SupportTeamDto[] {
  if (!Array.isArray(value) || !value.every(isSupportTeam)) {
    throw new AppError('Phản hồi danh sách đội hỗ trợ không hợp lệ.', 'invalid-response');
  }
  return value;
}

export function readTeamMembers(value: unknown): SupportTeamMemberDto[] {
  if (!Array.isArray(value) || !value.every(isTeamMember)) {
    throw new AppError('Phản hồi danh sách thành viên không hợp lệ.', 'invalid-response');
  }
  return value;
}
