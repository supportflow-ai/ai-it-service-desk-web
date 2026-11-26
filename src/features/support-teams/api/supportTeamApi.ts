import { apiClient } from '@/shared/api/apiClient';
import type {
  AddTeamMemberPayload,
  CreateSupportTeamPayload,
  SupportTeamDto,
  SupportTeamMemberDto,
  UpdateSupportTeamPayload,
} from '../model/supportTeam.types';
import { readSupportTeam, readSupportTeams, readTeamMembers } from './supportTeamContract';

export const supportTeamApi = {
  async getTeams(signal?: AbortSignal): Promise<SupportTeamDto[]> {
    const response = await apiClient.get<unknown>('/support-teams', { signal });
    return readSupportTeams(response.data);
  },

  async getTeamById(id: string, signal?: AbortSignal): Promise<SupportTeamDto> {
    const response = await apiClient.get<unknown>(`/support-teams/${encodeURIComponent(id)}`, { signal });
    return readSupportTeam(response.data);
  },

  async createTeam(payload: CreateSupportTeamPayload): Promise<SupportTeamDto> {
    const response = await apiClient.post<unknown>('/support-teams', payload);
    return readSupportTeam(response.data);
  },

  async updateTeam(id: string, payload: UpdateSupportTeamPayload): Promise<SupportTeamDto> {
    const response = await apiClient.put<unknown>(`/support-teams/${encodeURIComponent(id)}`, payload);
    return readSupportTeam(response.data);
  },

  async getTeamMembers(teamId: string, signal?: AbortSignal): Promise<SupportTeamMemberDto[]> {
    const response = await apiClient.get<unknown>(`/support-teams/${encodeURIComponent(teamId)}/members`, { signal });
    return readTeamMembers(response.data);
  },

  async addTeamMember(teamId: string, payload: AddTeamMemberPayload): Promise<SupportTeamMemberDto[]> {
    const response = await apiClient.post<unknown>(`/support-teams/${encodeURIComponent(teamId)}/members`, payload);
    return readTeamMembers(response.data);
  },

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await apiClient.delete(`/support-teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`);
  },
};
