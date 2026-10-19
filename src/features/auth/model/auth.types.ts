export type Role = 'Requester' | 'Agent' | 'Admin';
export interface User {
  userId: string;
  email: string;
  fullName: string | null;
  roles: Role[];
}
export interface LoginCredentials { email: string; password: string }
export interface RegisterCredentials extends LoginCredentials { fullName: string }
export interface AuthResponse { token: string; user: User }
export type AuthStatus = 'restoring' | 'authenticated' | 'anonymous' | 'unavailable';
