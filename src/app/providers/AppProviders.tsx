import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider, theme } from 'antd';
import type { ThemeConfig } from 'antd';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth';
import { shouldRetryQuery } from '@/shared/api/httpError';
import { ThemeModeProvider } from './ThemeModeProvider';
import { useThemeMode } from './themeMode';

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

// Shared by both modes; colours live in the per-mode tokens below and in the CSS variables of styles.css.
const baseComponents: ThemeConfig['components'] = {
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
  Card: {
    borderRadiusLG: 8,
  },
};

const fontFamily = '"Be Vietnam Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const lightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
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
    fontFamily,
  },
  components: {
    ...baseComponents,
    Table: {
      headerBg: '#F1F5F9',
      headerColor: '#475569',
      rowHoverBg: '#EFF6FF',
      borderRadius: 8,
    },
  },
};

// Lighter tones on slate surfaces; the light primary is too dim on dark, so primary fills carry dark text.
const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#60A5FA',
    colorPrimaryHover: '#93C5FD',
    colorSuccess: '#4ADE80',
    colorWarning: '#FBBF24',
    colorError: '#F87171',
    colorInfo: '#60A5FA',
    colorLink: '#60A5FA',
    colorBgBase: '#0F172A',
    colorBgLayout: '#0F172A',
    colorBgContainer: '#1E293B',
    colorBgElevated: '#1E293B',
    colorTextBase: '#E2E8F0',
    colorTextSecondary: '#94A3B8',
    colorTextLightSolid: '#0F172A',
    colorBorder: '#475569',
    colorBorderSecondary: '#334155',
    borderRadius: 6,
    fontFamily,
  },
  components: {
    ...baseComponents,
    Table: {
      headerBg: '#273449',
      headerColor: '#94A3B8',
      rowHoverBg: '#1E3352',
      borderRadius: 8,
    },
  },
};

interface AppProvidersProps {
  children: ReactNode;
}

function ThemedConfigProvider({ children }: AppProvidersProps) {
  const { resolved } = useThemeMode();
  return <ConfigProvider theme={resolved === 'dark' ? darkTheme : lightTheme}>{children}</ConfigProvider>;
}

/**
 * App-level providers wrapping the entire application.
 * ThemeModeProvider + ConfigProvider: light/dark mode and the Ant Design theme for it.
 * QueryClientProvider: TanStack Query server-state management.
 * AuthProvider: Global authentication state.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeModeProvider>
      <ThemedConfigProvider>
        <QueryClientProvider client={queryClient}>
          <AntApp>
            <AuthProvider>
              {children}
            </AuthProvider>
          </AntApp>
        </QueryClientProvider>
      </ThemedConfigProvider>
    </ThemeModeProvider>
  );
}
