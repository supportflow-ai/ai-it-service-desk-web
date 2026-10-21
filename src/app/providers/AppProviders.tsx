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

const supportFlowTheme = {
  token: {
    colorPrimary: '#0F766E',
    colorPrimaryHover: '#0B625C',
    colorSuccess: '#2F7D5B',
    colorWarning: '#A56A16',
    colorError: '#B84848',
    colorInfo: '#426D86',
    colorBgBase: '#FFFFFF',
    colorBgLayout: '#F6F7F5',
    colorTextBase: '#17201F',
    colorTextSecondary: '#626D69',
    colorBorder: '#D8DEDB',
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
      headerBg: '#EEF1EF',
      headerColor: '#626D69',
      rowHoverBg: '#E7F2EF',
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
