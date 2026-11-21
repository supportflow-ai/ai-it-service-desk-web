import { Button, Space } from 'antd';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasAnyRole, useAuth } from '@/features/auth';
import type { Role } from '@/features/auth';
import { ErrorState } from '@/shared/ui/ErrorState';
import { PageLoader } from '@/shared/ui/PageLoader';

export function ProtectedRoute({ roles = [] }: { roles?: readonly Role[] }) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.status === 'restoring') return <PageLoader />;
  // The session could not be checked (network or server): the token is kept so a retry can restore it,
  // but the person must also be able to leave, e.g. to sign in as someone else.
  if (auth.status === 'unavailable') {
    return (
      <Space direction="vertical" style={{ width: '100%', maxWidth: 480, margin: '48px auto', padding: '0 16px' }}>
        <ErrorState error={auth.error} onRetry={auth.retrySession} />
        <Button type="link" style={{ padding: 0 }} onClick={() => { void auth.logout(); }}>Đăng xuất</Button>
      </Space>
    );
  }
  // Return to this page only after a first visit or an expired session. After a sign-out the next
  // person may be someone else, who must not be sent to the previous account's page.
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={auth.signedOut ? null : { from: location }} />;
  if (roles.length > 0 && !hasAnyRole(auth.user?.roles ?? [], roles)) return <Navigate to="/403" replace />;
  return <Outlet />;
}
