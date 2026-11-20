import { createContext } from 'react';
import type { AppError } from '@/shared/api/httpError';
import type { AuthStatus, LoginCredentials, User } from '../model/auth.types';

export interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  /** Anonymous because someone signed out, rather than a first visit or an expired session. */
  signedOut: boolean;
  /** Anonymous because the server rejected the session and it could not be renewed. */
  sessionExpired: boolean;
  sessionVersion: number;
  error: AppError | null;
  loginPending: boolean;
  loginError: AppError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void | Promise<void>;
  retrySession: () => void;
}
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
