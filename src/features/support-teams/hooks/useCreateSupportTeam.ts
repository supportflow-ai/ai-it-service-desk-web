import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { supportTeamApi } from '../api/supportTeamApi';
import { invalidateSupportTeamQueries, supportTeamInvalidation } from '../api/supportTeamQueries';
import type { CreateSupportTeamPayload } from '../model/supportTeam.types';

export function useCreateSupportTeam() {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSupportTeamPayload) => supportTeamApi.createTeam(payload),
    onSuccess: () => {
      void invalidateSupportTeamQueries(queryClient, supportTeamInvalidation.teams(sessionVersion));
    },
  });
}
