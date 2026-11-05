import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import type { ResetPasswordPayload } from '../model/auth.types';

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authApi.resetPassword(payload),
    retry: false,
  });
}
