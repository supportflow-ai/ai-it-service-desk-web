import config from './config';
import { sessionStore } from '@/features/auth';
import { configureApiClient } from '@/shared/api/apiClient';

export function bootstrap() {
  sessionStore.restore();
  configureApiClient({
    baseURL: config.apiBaseUrl,
    getAccessToken: () => sessionStore.getSnapshot().token,
    getRefreshToken: () => sessionStore.getSnapshot().refreshToken,
    getSessionVersion: () => sessionStore.getSnapshot().version,
    onUnauthorized: sessionStore.expire,
    onTokenRefreshed: (token, refreshToken) => sessionStore.setTokens(token, refreshToken),
  });
}
