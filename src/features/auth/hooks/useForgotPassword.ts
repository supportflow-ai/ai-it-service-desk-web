import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import type { ForgotPasswordPayload } from '../model/auth.types';

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authApi.forgotPassword(payload),
    retry: false,
  });
}
