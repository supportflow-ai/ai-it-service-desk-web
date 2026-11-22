import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supportTeamApi } from '../api/supportTeamApi';
import { invalidateSupportTeamQueries, supportTeamInvalidation } from '../api/supportTeamQueries';
import type { AddTeamMemberPayload } from '../model/supportTeam.types';

export function useAddTeamMember(teamId: string) {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddTeamMemberPayload) => supportTeamApi.addTeamMember(teamId, payload),
    onSuccess: () => {
      void invalidateSupportTeamQueries(queryClient, supportTeamInvalidation.members(sessionVersion, teamId));
    },
  });
}

export function useRemoveTeamMember(teamId: string) {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => supportTeamApi.removeTeamMember(teamId, userId),
    onSuccess: () => {
      void invalidateSupportTeamQueries(queryClient, supportTeamInvalidation.members(sessionVersion, teamId));
    },
  });
}
