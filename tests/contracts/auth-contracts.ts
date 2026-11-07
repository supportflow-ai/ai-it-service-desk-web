import type {
  AssignRolesPayload,
  AuthResponse,
  ChangePasswordPayload,
  DepartmentDto,
  ForgotPasswordPayload,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordPayload,
  User,
} from '../../src/features/auth';

// Backend UserInfo.FullName is nullable for login and /auth/me.
const restoredUser: User = {
  userId: '00000000-0000-0000-0000-000000000001',
  email: 'synthetic@example.invalid',
  fullName: null,
  roles: ['Requester'],
};
const registrationUser: User = { ...restoredUser, fullName: 'Synthetic User' };
const response: AuthResponse = { token: 'synthetic-token', refreshToken: 'synthetic-refresh', user: restoredUser };
const login: LoginCredentials = { email: restoredUser.email, password: 'synthetic-password' };
const register: RegisterCredentials = { ...login, fullName: 'Synthetic User' };

const department: DepartmentDto = {
  id: '00000000-0000-0000-0000-000000000010',
  code: 'IT',
  name: 'Information Technology',
  description: 'IT Department',
};

const changePassword: ChangePasswordPayload = {
  currentPassword: 'old-password',
  newPassword: 'new-password-123',
};

const forgotPassword: ForgotPasswordPayload = {
  email: 'user@example.invalid',
};

const resetPassword: ResetPasswordPayload = {
  email: 'user@example.invalid',
  otpCode: '123456',
  newPassword: 'new-password-123',
};

const assignRoles: AssignRolesPayload = {
  roles: ['Agent', 'Admin'],
};

// These inputs must remain rejected by TypeScript even if form validation is bypassed.
// @ts-expect-error Password is required by the backend login request.
const missingLoginPassword: LoginCredentials = { email: restoredUser.email };
// @ts-expect-error Password is required by the backend register request.
const missingRegisterPassword: RegisterCredentials = { email: restoredUser.email, fullName: 'Synthetic' };
// @ts-expect-error Role must use the backend's existing controlled vocabulary.
const inventedRole: User = { ...restoredUser, roles: ['Superuser'] };
// @ts-expect-error Department requires code and name.
const invalidDepartment: DepartmentDto = { id: '1' };
// @ts-expect-error AssignRoles requires valid roles.
const invalidAssignRoles: AssignRolesPayload = { roles: ['Superuser'] };

void [
  registrationUser,
  response,
  login,
  register,
  department,
  changePassword,
  forgotPassword,
  resetPassword,
  assignRoles,
  missingLoginPassword,
  missingRegisterPassword,
  inventedRole,
  invalidDepartment,
  invalidAssignRoles,
];
