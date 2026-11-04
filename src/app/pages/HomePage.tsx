import { Navigate } from 'react-router-dom';
import { RequesterDashboard } from '@/features/tickets';
import { useAuth } from '@/features/auth';
import { isStaffAccount } from '../navigation/navigationConfig';
import { routeConfig } from '../router/routeConfig';

/** Staff land on the queue they work from; requesters on the overview of their own tickets. */
export function HomePage() {
  const { user } = useAuth();
  if (isStaffAccount(user?.roles ?? [])) return <Navigate to={routeConfig.workspace.path} replace />;
  return <RequesterDashboard />;
}
