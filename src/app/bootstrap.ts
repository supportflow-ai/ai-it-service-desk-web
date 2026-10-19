import config from './config';
import { sessionStore } from '@/features/auth';
import { configureApiClient } from '@/shared/api/apiClient';

export function bootstrap() {
  sessionStore.restore();
  configureApiClient({
    baseURL: config.apiBaseUrl,
    getAccessToken: () => sessionStore.getSnapshot().token,
    getSessionVersion: () => sessionStore.getSnapshot().version,
    onUnauthorized: sessionStore.expire,
  });
}
