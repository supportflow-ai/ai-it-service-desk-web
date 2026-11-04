import { normalizeError } from '@/shared/api/httpError';

export interface ArticleErrorView {
  message: string;
  /** True when the article changed on the server and reloading shows its current state. */
  reloadable: boolean;
}

// Status codes of the Knowledge endpoints at backend dev 1506a5b: 422 is a lifecycle rule (not a
// Draft, not Published), 409 an outdated revision.
const defaultMessages: Partial<Record<number, string>> = {
  400: 'Nội dung bài viết chưa hợp lệ. Vui lòng kiểm tra tiêu đề, nội dung và tags.',
  403: 'Bạn không có quyền thực hiện thao tác này với bài viết.',
  404: 'Không tìm thấy bài viết.',
  409: 'Bài viết vừa được người khác cập nhật. Hãy tải lại trước khi thao tác tiếp.',
  422: 'Trạng thái bài viết đã thay đổi, có thể đã được xuất bản hoặc lưu trữ. Hãy tải lại để xem trạng thái mới nhất.',
};

/** 403/404 on a read means the article is no longer ours to show, even if a copy is cached. */
export function isArticleAccessLost(error: unknown) {
  if (!error) return false;
  const status = normalizeError(error).status;
  return status === 403 || status === 404;
}

/** A user-facing message for a failed article request; null for a cancellation. */
export function describeArticleError(error: unknown, overrides: Partial<Record<number, string>> = {}): ArticleErrorView | null {
  const normalized = normalizeError(error);
  if (normalized.kind === 'canceled') return null;
  const status = normalized.status;
  const message = (status !== undefined ? overrides[status] ?? defaultMessages[status] : undefined) ?? normalized.message;
  return { message, reloadable: status === 409 || status === 422 };
}
