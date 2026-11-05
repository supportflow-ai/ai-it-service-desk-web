import { afterEach, expect, it, vi } from 'vitest';
import { newIdempotencyKey } from './idempotencyKey';

const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => { vi.unstubAllGlobals(); });

it.each([true, false])('makes a fresh UUID v4 whether or not the page is a secure context (%s)', (secure) => {
  vi.stubGlobal('isSecureContext', secure);
  const first = newIdempotencyKey();
  expect(first).toMatch(uuidV4);
  expect(newIdempotencyKey()).not.toBe(first);
});
