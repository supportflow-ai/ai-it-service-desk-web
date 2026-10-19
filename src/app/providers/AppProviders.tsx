import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth';
import { shouldRetryQuery } from '@/shared/api/httpError';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * App-level providers wrapping the entire application.
 * ConfigProvider: Ant Design theme/locale configuration.
 * QueryClientProvider: TanStack Query server-state management.
 * AuthProvider: Global authentication state.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ConfigProvider>
      <QueryClientProvider client={queryClient}>
        <AntApp><AuthProvider>
          {children}
        </AuthProvider></AntApp>
      </QueryClientProvider>
    </ConfigProvider>
  );
}
