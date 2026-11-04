import { normalizeError } from '@/shared/api/httpError';

export const PASSWORD_POLICY_MESSAGE = 'Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và chữ số.';

/**
 * RegisterUserUseCase answers 400 with `errors: string[]` in English (Identity messages). Known
 * ones get a Vietnamese explanation; anything else keeps the generic message.
 */
export function describeRegisterError(error: unknown) {
  const normalized = normalizeError(error);
  const messages = normalized.serverMessages ?? [];
  if (messages.some((message) => /already (registered|taken)/i.test(message))) {
    return 'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.';
  }
  if (messages.some((message) => /^passwords? must/i.test(message))) return PASSWORD_POLICY_MESSAGE;
  return normalized.message;
}
