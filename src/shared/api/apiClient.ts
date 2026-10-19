import axios from 'axios';
import { normalizeError } from './httpError';

declare module 'axios' {
  interface AxiosRequestConfig {
    authMode?: 'anonymous' | 'session';
    requestSession?: { token: string; version: number };
  }
}

interface ApiConfiguration {
  baseURL: string;
  getAccessToken: () => string | null;
  getSessionVersion: () => number;
  onUnauthorized: (token: string, version: number) => void;
}

let configuration: ApiConfiguration | undefined;
export const apiClient = axios.create({ headers: { 'Content-Type': 'application/json' } });

/** Called by App bootstrap, or by an isolated test, before requests are made. */
export function configureApiClient(options: ApiConfiguration) {
  configuration = options;
  apiClient.defaults.baseURL = options.baseURL;
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
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config?.requestSession) {
      const { token, version } = error.config.requestSession;
      configuration?.onUnauthorized(token, version);
    }
    return Promise.reject(normalizeError(error));
  },
);
