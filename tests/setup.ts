import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { server } from './mocks/server';
import { sessionStore } from '@/features/auth';
import { configureApiClient } from '@/shared/api/apiClient';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  Object.defineProperty(window, 'matchMedia', { writable: true, value: (query: string) => ({
    matches: false, media: query, onchange: null, addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false,
  }) });
  // jsdom does not implement pseudo-element computed styles used by Ant Design.
  const getComputedStyle = window.getComputedStyle;
  window.getComputedStyle = (element) => getComputedStyle(element);
});
beforeEach(() => {
  sessionStore.clear();
  configureApiClient({ baseURL: 'http://localhost/api', getAccessToken: () => sessionStore.getSnapshot().token,
    getSessionVersion: () => sessionStore.getSnapshot().version, onUnauthorized: sessionStore.expire });
});
afterEach(() => { cleanup(); server.resetHandlers(); localStorage.clear(); });
afterAll(() => server.close());
