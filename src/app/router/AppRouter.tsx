import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PageLoader } from '@/shared/ui/PageLoader';
import { MainLayout } from '../layouts/MainLayout';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { UnavailablePage } from '../pages/UnavailablePage';
import { ProtectedRoute } from './ProtectedRoute';
import { routeConfig as routes } from './routeConfig';

const LoginPage = lazy(() => import('@/features/auth').then((feature) => ({ default: feature.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth').then((feature) => ({ default: feature.RegisterPage })));
const TicketListPage = lazy(() => import('@/features/tickets').then((feature) => ({ default: feature.TicketListPage })));
const TicketDetailPage = lazy(() => import('@/features/tickets').then((feature) => ({ default: feature.TicketDetailPage })));
const CreateTicketPage = lazy(() => import('@/features/tickets').then((feature) => ({ default: feature.CreateTicketPage })));
const TicketWorkspacePage = lazy(() => import('@/features/tickets').then((feature) => ({ default: feature.TicketWorkspacePage })));
const AgentQueuePage = lazy(() => import('@/features/tickets').then((feature) => ({ default: feature.AgentQueuePage })));

export function AppRouter() {
  const protectedPages = [
    { ...routes.home, element: <HomePage /> },
    { ...routes.tickets, element: <TicketListPage /> },
    { ...routes.ticket, element: <TicketDetailPage /> },
    { ...routes.create, element: <CreateTicketPage /> },
    { ...routes.workspace, element: <AgentQueuePage /> },
    { ...routes.workspaceTicket, element: <TicketWorkspacePage /> },
    { ...routes.admin, element: <UnavailablePage title="Admin Panel" /> },
  ];
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/403" element={<ForbiddenPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {protectedPages.map((route) => (
                <Route key={route.path} path={route.path} element={<ProtectedRoute roles={route.roles} />}>
                  <Route index element={route.element} />
                </Route>
              ))}
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
