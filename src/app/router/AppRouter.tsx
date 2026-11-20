import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { hasAnyRole, useAuth } from '@/features/auth';
import { PageLoader } from '@/shared/ui/PageLoader';
import { MainLayout } from '../layouts/MainLayout';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RootRoute } from './RootRoute';
import { routeConfig as routes } from './routeConfig';

const LoginPage = lazy(() => import('@/features/auth').then((feature) => ({ default: feature.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth').then((feature) => ({ default: feature.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@/features/auth').then((feature) => ({ default: feature.ForgotPasswordPage })));
const AdminUsersPage = lazy(() => import('@/features/auth').then((feature) => ({ default: feature.AdminUsersPage })));
const TicketListPage = lazy(() => import('@/features/tickets').then((feature) => ({ default: feature.TicketListPage })));
const TicketDetailPage = lazy(() => import('@/features/tickets').then((feature) => ({ default: feature.TicketDetailPage })));
const CreateTicketPage = lazy(() => import('@/features/tickets').then((feature) => ({ default: feature.CreateTicketPage })));
const TicketWorkspacePage = lazy(() => import('@/features/tickets').then((feature) => ({ default: feature.TicketWorkspacePage })));
const AgentQueuePage = lazy(() => import('@/features/tickets').then((feature) => ({ default: feature.AgentQueuePage })));
const KnowledgeSearchPage = lazy(() => import('@/features/knowledge').then((feature) => ({ default: feature.KnowledgeSearchPage })));
const PublishedArticlePage = lazy(() => import('@/features/knowledge').then((feature) => ({ default: feature.PublishedArticlePage })));
const KnowledgeAdminPage = lazy(() => import('@/features/knowledge').then((feature) => ({ default: feature.KnowledgeAdminPage })));
const NewArticlePage = lazy(() => import('@/features/knowledge').then((feature) => ({ default: feature.NewArticlePage })));
const EditArticlePage = lazy(() => import('@/features/knowledge').then((feature) => ({ default: feature.EditArticlePage })));
const ArticleDetailPage = lazy(() => import('@/features/knowledge').then((feature) => ({ default: feature.ArticleDetailPage })));
const WorkspaceTriagePanel = lazy(() => import('@/features/ai-assistance').then((feature) => ({ default: feature.WorkspaceTriagePanel })));
const RequesterAIPanel = lazy(() => import('@/features/ai-assistance').then((feature) => ({ default: feature.RequesterAIPanel })));

export function AppRouter() {
  const { user } = useAuth();
  // Every role may raise a request, so the knowledge pages offer the way to one whenever the route allows the viewer.
  const helpPath = hasAnyRole(user?.roles ?? [], routes.create.roles) ? routes.create.path : undefined;
  const protectedPages = [
    { ...routes.tickets, element: <TicketListPage /> },
    { ...routes.ticket, element: <TicketDetailPage /> },
    {
      ...routes.create,
      // No requester analysis endpoint exists yet, so the panel shows its not-enabled state and sends no request.
      element: <CreateTicketPage aiPanel={<Suspense fallback={null}><RequesterAIPanel result={null} /></Suspense>} />,
    },
    { ...routes.workspace, element: <AgentQueuePage /> },
    {
      ...routes.workspaceTicket,
      // The workspace hosts the AI panel without depending on the ai-assistance feature.
      element: <TicketWorkspacePage aiPanel={({ ticket, reload }) => (
        <Suspense fallback={null}><WorkspaceTriagePanel ticketId={ticket.id} onTicketChanged={reload} /></Suspense>
      )} />,
    },
    // A reader who found no answer goes on to a request (PRD J-03).
    { ...routes.knowledge, element: <KnowledgeSearchPage helpPath={helpPath} /> },
    { ...routes.knowledgeArticle, element: <PublishedArticlePage helpPath={helpPath} /> },
    { ...routes.knowledgeAdmin, element: <KnowledgeAdminPage /> },
    { ...routes.knowledgeNew, element: <NewArticlePage /> },
    { ...routes.knowledgeRead, element: <ArticleDetailPage /> },
    { ...routes.knowledgeEdit, element: <EditArticlePage /> },
    { ...routes.admin, element: <AdminUsersPage /> },
  ];
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path={routes.forgotPassword.path} element={<ForgotPasswordPage />} />
          <Route path="/403" element={<ForbiddenPage />} />
          {/* `/` is public: the landing page for visitors, the overview once signed in. */}
          <Route path={routes.home.path} element={<RootRoute />}>
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route index element={<HomePage />} />
              </Route>
            </Route>
          </Route>
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
