import { useEffect, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppError, normalizeError } from '@/shared/api/httpError';
import { authApi } from '../api/authApi';
import { authKeys } from '../api/authQueries';
import { sessionStore } from '../lib/sessionStore';
import { AuthContext } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot);
  const queryClient = useQueryClient();
  useEffect(() => sessionStore.subscribe(() => {
    void queryClient.cancelQueries();
    queryClient.clear();
  }), [queryClient]);

  const currentUser = useQuery({
    queryKey: authKeys.session(session.version),
    enabled: session.token !== null,
    queryFn: async ({ signal }) => {
      try { return await authApi.getCurrentUser(signal); }
      catch (error) {
        if (normalizeError(error).status === 404 && session.token) sessionStore.expire(session.token, session.version);
        throw error;
      }
    },
    retry: false,
  });
  const loginMutation = useMutation({ mutationFn: authApi.login, retry: false });
  const login = async (credentials: Parameters<typeof authApi.login>[0]) => {
    const version = sessionStore.getSnapshot().version;
    const result = await loginMutation.mutateAsync(credentials);
    if (sessionStore.getSnapshot().version !== version) throw new AppError('Đã hủy đăng nhập của phiên cũ.', 'canceled');
    sessionStore.setToken(result.token);
    queryClient.setQueryData(authKeys.session(sessionStore.getSnapshot().version), result.user);
  };
  const status = !session.token ? 'anonymous' : currentUser.data ? 'authenticated'
    : currentUser.isError ? 'unavailable' : 'restoring';

  return <AuthContext.Provider value={{
    user: session.token ? currentUser.data ?? null : null,
    status,
    sessionVersion: session.version,
    error: currentUser.error ? normalizeError(currentUser.error) : null,
    loginPending: loginMutation.isPending,
    loginError: loginMutation.error ? normalizeError(loginMutation.error) : null,
    login,
    logout: sessionStore.clear,
    retrySession: () => { void currentUser.refetch(); },
  }}>{children}</AuthContext.Provider>;
}
