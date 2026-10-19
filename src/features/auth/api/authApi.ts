import { apiClient } from '@/shared/api/apiClient';
import { AppError } from '@/shared/api/httpError';
import { isRecord } from '@/shared/lib/guards';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../model/auth.types';

function isUser(value: unknown): value is User {
  return isRecord(value) && typeof value.userId === 'string' && typeof value.email === 'string'
    && (value.fullName === null || typeof value.fullName === 'string')
    && Array.isArray(value.roles) && value.roles.every((role) => role === 'Requester' || role === 'Agent' || role === 'Admin');
}

function readAuth(value: unknown): AuthResponse {
  if (!isRecord(value) || typeof value.token !== 'string' || !value.token || !isUser(value.user)) {
    throw new AppError('Phản hồi đăng nhập không hợp lệ.', 'invalid-response');
  }
  return { token: value.token, user: value.user };
}

export const authApi = {
  async login(credentials: LoginCredentials) {
    const response = await apiClient.post<unknown>('/auth/login', credentials, { authMode: 'anonymous' });
    return readAuth(response.data);
  },
  async register(credentials: RegisterCredentials) {
    const response = await apiClient.post<unknown>('/auth/register', credentials, { authMode: 'anonymous' });
    return readAuth(response.data);
  },
  async getCurrentUser(signal?: AbortSignal): Promise<User> {
    const response = await apiClient.get<unknown>('/auth/me', { signal });
    if (!isUser(response.data)) throw new AppError('Phản hồi người dùng không hợp lệ.', 'invalid-response');
    return response.data;
  },
};
