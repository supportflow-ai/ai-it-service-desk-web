import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasAnyRole, useAuth } from '@/features/auth';
import type { Role } from '@/features/auth';
import { ErrorState } from '@/shared/ui/ErrorState';
import { PageLoader } from '@/shared/ui/PageLoader';

export function ProtectedRoute({ roles = [] }: { roles?: readonly Role[] }) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.status === 'restoring') return <PageLoader />;
  if (auth.status === 'unavailable') return <ErrorState error={auth.error} onRetry={auth.retrySession} />;
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles.length > 0 && !hasAnyRole(auth.user?.roles ?? [], roles)) return <Navigate to="/403" replace />;
  return <Outlet />;
}
