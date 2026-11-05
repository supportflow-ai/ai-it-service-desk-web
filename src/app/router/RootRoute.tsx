import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { PageLoader } from '@/shared/ui/PageLoader';

const LandingPage = lazy(() => import('../pages/LandingPage').then((page) => ({ default: page.LandingPage })));

/**
 * The address `/` is public: someone who is not signed in sees the landing page. Everyone else
 * continues into the protected overview, whose route still handles the restoring, unavailable and
 * wrong-role states.
 */
export function RootRoute() {
  const { status } = useAuth();
  if (status !== 'anonymous') return <Outlet />;
  return <Suspense fallback={<PageLoader />}><LandingPage /></Suspense>;
}
