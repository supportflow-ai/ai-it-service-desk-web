import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth';

export function createTestWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return <ConfigProvider theme={{ token: { motion: false } }}><QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider></ConfigProvider>;
  }
  return { queryClient, Wrapper };
}
