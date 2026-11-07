import { apiClient, configureApiClient } from '@/shared/api/apiClient';
import { AppError } from '@/shared/api/httpError';
import { isRecord } from '@/shared/lib/guards';
import type {
  AssignRolesPayload,
  AuthResponse,
  ChangePasswordPayload,
  DepartmentDto,
  ForgotPasswordPayload,
  LoginCredentials,
  OperationMessageResult,
  RefreshAuthPayload,
  RegisterCredentials,
  ResetPasswordPayload,
  RevokeTokenPayload,
  User,
  UserDirectoryEntry,
} from '../model/auth.types';

function isUser(value: unknown): value is User {
  return isRecord(value) && typeof value.userId === 'string' && typeof value.email === 'string'
    && (value.fullName === null || typeof value.fullName === 'string')
    && Array.isArray(value.roles) && value.roles.every((role) => role === 'Requester' || role === 'Agent' || role === 'Admin');
}

function readAuth(value: unknown): AuthResponse {
  if (!isRecord(value) || typeof value.token !== 'string' || !value.token || !isUser(value.user)) {
    throw new AppError('Phản hồi xác thực không hợp lệ.', 'invalid-response');
  }
  return {
    token: value.token,
    refreshToken: typeof value.refreshToken === 'string' ? value.refreshToken : undefined,
    user: value.user,
  };
}

function isDepartment(value: unknown): value is DepartmentDto {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.code === 'string'
    && typeof value.name === 'string'
    && (value.description === null || typeof value.description === 'string');
}

function readDepartments(value: unknown): DepartmentDto[] {
  if (!Array.isArray(value) || !value.every(isDepartment)) {
    throw new AppError('Phản hồi danh sách phòng ban không hợp lệ.', 'invalid-response');
  }
  return value;
}

function isUserDirectoryEntry(value: unknown): value is UserDirectoryEntry {
  return isRecord(value)
    && typeof value.userId === 'string' && value.userId.length > 0
    && (value.fullName === undefined || value.fullName === null || typeof value.fullName === 'string');
}

function readUserDirectory(value: unknown): UserDirectoryEntry[] {
  if (!Array.isArray(value) || !value.every(isUserDirectoryEntry)) {
    throw new AppError('Phản hồi danh sách người dùng không hợp lệ.', 'invalid-response');
  }
  return value.map(({ userId, fullName }) => ({ userId, fullName: fullName?.trim() || null }));
}

function readMessageResult(value: unknown): OperationMessageResult {
  if (!isRecord(value) || typeof value.message !== 'string') {
    return { message: 'Thao tác thành công.' };
  }
  return { message: value.message };
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
  async refresh(payload: RefreshAuthPayload): Promise<AuthResponse> {
    const response = await apiClient.post<unknown>('/auth/refresh', payload, { authMode: 'anonymous' });
    return readAuth(response.data);
  },
  async revoke(payload: RevokeTokenPayload): Promise<void> {
    await apiClient.post('/auth/revoke', payload, { authMode: 'anonymous' });
  },
  async getDepartments(signal?: AbortSignal): Promise<DepartmentDto[]> {
    const response = await apiClient.get<unknown>('/departments', { signal });
    return readDepartments(response.data);
  },
  async changePassword(payload: ChangePasswordPayload): Promise<OperationMessageResult> {
    const response = await apiClient.post<unknown>('/auth/change-password', payload);
    return readMessageResult(response.data);
  },
  async forgotPassword(payload: ForgotPasswordPayload): Promise<OperationMessageResult> {
    const response = await apiClient.post<unknown>('/auth/forgot-password', payload, { authMode: 'anonymous' });
    return readMessageResult(response.data);
  },
  async resetPassword(payload: ResetPasswordPayload): Promise<OperationMessageResult> {
    const response = await apiClient.post<unknown>('/auth/reset-password', payload, { authMode: 'anonymous' });
    return readMessageResult(response.data);
  },
  async assignRoles(userId: string, payload: AssignRolesPayload): Promise<OperationMessageResult> {
    const response = await apiClient.put<unknown>(`/users/${encodeURIComponent(userId)}/roles`, payload);
    return readMessageResult(response.data);
  },
  async getUsers(role?: string, signal?: AbortSignal): Promise<UserDirectoryEntry[]> {
    const response = await apiClient.get<unknown>('/users', {
      params: role ? { role } : undefined,
      signal,
    });
    return readUserDirectory(response.data);
  },
};

configureApiClient({
  refreshAccessToken: async (refreshToken: string) => {
    try {
      const response = await authApi.refresh({ refreshToken });
      return { token: response.token, refreshToken: response.refreshToken };
    } catch {
      return null;
    }
  },
});
