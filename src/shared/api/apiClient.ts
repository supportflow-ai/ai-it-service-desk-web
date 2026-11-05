import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { normalizeError } from './httpError';

declare module 'axios' {
  interface AxiosRequestConfig {
    authMode?: 'anonymous' | 'session';
    requestSession?: { token: string; version: number };
    _retry?: boolean;
  }
}

interface RefreshedTokens {
  token: string;
  refreshToken?: string;
}

export interface ApiConfiguration {
  baseURL: string;
  getAccessToken: () => string | null;
  getRefreshToken?: () => string | null;
  getSessionVersion: () => number;
  onUnauthorized: (token: string, version: number) => void;
  onTokenRefreshed?: (token: string, refreshToken?: string) => void;
  refreshAccessToken?: (refreshToken: string) => Promise<RefreshedTokens | null>;
}

let configuration: ApiConfiguration | undefined;
let refreshPromise: Promise<string | null> | null = null;

export const apiClient = axios.create({ headers: { 'Content-Type': 'application/json' } });

/** Called by App bootstrap, features, or by an isolated test, before requests are made. */
export function configureApiClient(options: Partial<ApiConfiguration>) {
  configuration = {
    baseURL: options.baseURL ?? configuration?.baseURL ?? '',
    getAccessToken: options.getAccessToken ?? configuration?.getAccessToken ?? (() => null),
    getRefreshToken: options.getRefreshToken ?? configuration?.getRefreshToken,
    getSessionVersion: options.getSessionVersion ?? configuration?.getSessionVersion ?? (() => 0),
    onUnauthorized: options.onUnauthorized ?? configuration?.onUnauthorized ?? (() => {}),
    onTokenRefreshed: options.onTokenRefreshed ?? configuration?.onTokenRefreshed,
    refreshAccessToken: options.refreshAccessToken ?? configuration?.refreshAccessToken,
  };
  if (options.baseURL) {
    apiClient.defaults.baseURL = options.baseURL;
  }
}

apiClient.interceptors.request.use((request) => {
  if (!configuration) throw new Error('HTTP client must be configured before use.');
  const token = request.authMode === 'anonymous' ? null : configuration.getAccessToken();
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
    request.requestSession = { token, version: configuration.getSessionVersion() };
  }
  return request;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

      // 401 on anonymous request (e.g. login credentials incorrect) -> don't try refresh
      if (config?.authMode === 'anonymous') {
        return Promise.reject(normalizeError(error));
      }

      const session = config?.requestSession;
      if (config && session && !config._retry && configuration?.refreshAccessToken && configuration.getRefreshToken) {
        const refreshToken = configuration.getRefreshToken();
        if (refreshToken) {
          config._retry = true;

          if (!refreshPromise) {
            refreshPromise = configuration
              .refreshAccessToken(refreshToken)
              .then((result) => {
                if (result?.token) {
                  configuration?.onTokenRefreshed?.(result.token, result.refreshToken);
                  return result.token;
                }
                return null;
              })
              .catch(() => null)
              .finally(() => {
                refreshPromise = null;
              });
          }

          const newToken = await refreshPromise;
          if (newToken) {
            config.headers.Authorization = `Bearer ${newToken}`;
            config.requestSession = { token: newToken, version: configuration.getSessionVersion() };
            return apiClient(config);
          }
        }

        configuration.onUnauthorized(session.token, session.version);
      } else if (session) {
        configuration?.onUnauthorized(session.token, session.version);
      }
    }

    return Promise.reject(normalizeError(error));
  },
);
