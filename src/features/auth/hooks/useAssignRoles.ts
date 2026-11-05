import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import type { AssignRolesPayload } from '../model/auth.types';

export function useAssignRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: AssignRolesPayload }) =>
      authApi.assignRoles(userId, payload),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'auth' && query.queryKey[1] === 'users',
      });
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'tickets' &&
          (query.queryKey[2] === 'agents' || query.queryKey[2] === 'admins'),
      });
    },
  });
}
