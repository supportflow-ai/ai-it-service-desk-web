import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supportTeamApi } from '../api/supportTeamApi';
import { invalidateSupportTeamQueries, supportTeamInvalidation } from '../api/supportTeamQueries';
import type { UpdateSupportTeamPayload } from '../model/supportTeam.types';

export function useUpdateSupportTeam(teamId: string) {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSupportTeamPayload) => supportTeamApi.updateTeam(teamId, payload),
    onSuccess: () => {
      void invalidateSupportTeamQueries(queryClient, supportTeamInvalidation.teamDetail(sessionVersion, teamId));
    },
  });
}
