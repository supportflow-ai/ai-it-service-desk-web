export type Role = 'Requester' | 'Agent' | 'Admin';

export interface User {
  userId: string;
  email: string;
  fullName: string | null;
  roles: Role[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  fullName: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface RefreshAuthPayload {
  refreshToken: string;
}

export interface RevokeTokenPayload {
  refreshToken: string;
}

export interface DepartmentDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface AssignRolesPayload {
  roles: Role[];
}

export interface UserDirectoryEntry {
  userId: string;
  fullName: string | null;
}

export interface OperationMessageResult {
  message: string;
}

export type AuthStatus = 'restoring' | 'authenticated' | 'anonymous' | 'unavailable';
