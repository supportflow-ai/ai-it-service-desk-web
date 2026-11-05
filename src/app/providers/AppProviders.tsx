import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth';
import { shouldRetryQuery } from '@/shared/api/httpError';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      // Several agents work the same tickets: keep reads fresh, so a queue or ticket seen again
      // (or a tab brought back) shows other people's changes instead of a copy up to minutes old.
      staleTime: 30 * 1000,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});

const supportFlowTheme = {
  token: {
    colorPrimary: '#2563EB',
    colorPrimaryHover: '#1D4ED8',
    colorSuccess: '#15803D',
    colorWarning: '#D97706',
    colorError: '#DC2626',
    colorInfo: '#2563EB',
    colorLink: '#2563EB',
    colorBgBase: '#FFFFFF',
    colorBgLayout: '#F8FAFC',
    colorTextBase: '#0F172A',
    colorTextSecondary: '#475569',
    colorBorder: '#CBD5E1',
    colorBorderSecondary: '#E2E8F0',
    borderRadius: 6,
    fontFamily: '"Be Vietnam Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 34,
      fontWeight: 500,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 36,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 36,
    },
    Table: {
      headerBg: '#F1F5F9',
      headerColor: '#475569',
      rowHoverBg: '#EFF6FF',
      borderRadius: 8,
    },
    Card: {
      borderRadiusLG: 8,
    },
  },
};

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
    <ConfigProvider theme={supportFlowTheme}>
      <QueryClientProvider client={queryClient}>
        <AntApp>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AntApp>
      </QueryClientProvider>
    </ConfigProvider>
  );
}
