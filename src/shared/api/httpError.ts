import { isAxiosError, isCancel } from 'axios';
import { isRecord } from '../lib/guards';

export type ErrorKind = 'http' | 'network' | 'canceled' | 'invalid-response' | 'unknown';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly kind: ErrorKind,
    public readonly status?: number,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

const messages: Record<number, string> = {
  400: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.',
  401: 'Thông tin đăng nhập hoặc phiên đăng nhập không hợp lệ.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu yêu cầu.',
  409: 'Dữ liệu có xung đột. Vui lòng tải lại trước khi thử lại.',
};

export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (isCancel(error)) return new AppError('Đã hủy yêu cầu.', 'canceled');
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (!status) return new AppError('Không thể kết nối. Vui lòng thử lại.', 'network');
    const data: unknown = error.response?.data;
    let fieldErrors: Record<string, string[]> | undefined;
    if (isRecord(data) && isRecord(data.errors)) {
      fieldErrors = {};
      for (const [field, errors] of Object.entries(data.errors)) {
        if (Array.isArray(errors) && errors.every((item): item is string => typeof item === 'string')) fieldErrors[field] = errors;
      }
    }
    return new AppError(messages[status] ?? 'Máy chủ chưa thể xử lý yêu cầu. Vui lòng thử lại.', 'http', status, fieldErrors);
  }
  return new AppError('Có lỗi xảy ra. Vui lòng thử lại.', 'unknown');
}

export function shouldRetryQuery(failureCount: number, error: unknown) {
  const normalized = normalizeError(error);
  return failureCount < 1 && (normalized.kind === 'network' || (normalized.status ?? 0) >= 500);
}
