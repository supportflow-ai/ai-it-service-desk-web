import { normalizeError } from '@/shared/api/httpError';

export interface TicketErrorView {
  message: string;
  /** True when the ticket changed on the server and reloading shows its current state. */
  reloadable: boolean;
}

const defaultMessages: Partial<Record<number, string>> = {
  403: 'Bạn không có quyền thực hiện thao tác này trên ticket.',
  404: 'Không tìm thấy ticket hoặc ticket nằm ngoài phạm vi quyền của bạn.',
  409: 'Ticket vừa được người khác cập nhật. Hãy tải lại trước khi thao tác tiếp.',
};

/**
 * Maps a failed ticket request to a user-facing message. Returns null for cancellations,
 * which are not user errors. `overrides` lets each use case explain its own 400 rules.
 */
export function describeTicketError(
  error: unknown,
  overrides: Partial<Record<number, string>> = {},
): TicketErrorView | null {
  const normalized = normalizeError(error);
  if (normalized.kind === 'canceled') return null;
  const status = normalized.status;
  const message = (status !== undefined ? overrides[status] ?? defaultMessages[status] : undefined)
    ?? normalized.message;
  return { message, reloadable: status === 400 || status === 409 };
}
