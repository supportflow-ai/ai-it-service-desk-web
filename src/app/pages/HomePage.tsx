import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { RequesterDashboard } from '@/features/tickets';
import { useAuth } from '@/features/auth';
import { isStaffAccount } from '../navigation/navigationConfig';
import { routeConfig } from '../router/routeConfig';

const KnowledgeDashboardCard = lazy(() => import('@/features/knowledge').then((feature) => ({ default: feature.KnowledgeDashboardCard })));

/** Staff land on the queue they work from; requesters on the overview of their own tickets. */
export function HomePage() {
  const { user } = useAuth();
  if (isStaffAccount(user?.roles ?? [])) return <Navigate to={routeConfig.workspace.path} replace />;
  // The overview hosts the knowledge base card without the tickets feature depending on it.
  return <RequesterDashboard knowledgePanel={<Suspense fallback={null}><KnowledgeDashboardCard /></Suspense>} />;
}
