import { normalizeError } from '@/shared/api/httpError';

export const LOGIN_FAILED_MESSAGE = 'Email hoặc mật khẩu không đúng. Nếu nhập sai 5 lần liên tiếp, tài khoản bị khoá tạm thời 15 phút.';

/**
 * LoginUserUseCase answers a bare 401 both for a wrong email or password and for an account
 * locked after 5 failures (15 minutes), so one message covers both. Null for a cancellation.
 */
export function describeLoginError(error: unknown) {
  const normalized = normalizeError(error);
  if (normalized.kind === 'canceled') return null;
  return normalized.status === 401 ? LOGIN_FAILED_MESSAGE : normalized.message;
}
