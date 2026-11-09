import { AxiosError, AxiosHeaders, CanceledError } from 'axios';
import { describe, expect, it } from 'vitest';
import { normalizeError, shouldRetryQuery } from './httpError';

function httpError(status: number, data: unknown = {}) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('private database details', 'E_TEST', config, undefined, { status, statusText: '', headers: {}, config, data });
}
describe('HTTP normalization', () => {
  it.each([400, 401, 403, 404, 409, 500])('preserves status %i without leaking internal messages', (status) => {
    const normalized = normalizeError(httpError(status));
    expect(normalized.status).toBe(status);
    expect(normalized.message).not.toContain('database');
  });
  it('explains a rate limit (429) and never retries it automatically', () => {
    const limited = httpError(429);
    expect(normalizeError(limited).message).toBe('Bạn thao tác quá nhanh. Vui lòng đợi một lúc rồi thử lại.');
    expect(shouldRetryQuery(0, limited)).toBe(false);
  });
  it('preserves validated field errors', () => {
    expect(normalizeError(httpError(400, { errors: { title: ['Required'], unsafe: 42 } })).fieldErrors).toEqual({ title: ['Required'] });
  });
  it('keeps server messages sent as a plain list, but never as the shown message', () => {
    const normalized = normalizeError(httpError(400, { errors: ['Email is already registered.', 42] }));
    expect(normalized.serverMessages).toEqual(['Email is already registered.']);
    expect(normalized.fieldErrors).toBeUndefined();
    expect(normalized.message).toBe('Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.');
  });
  it('recognizes network and cancellation separately', () => {
    expect(normalizeError(new AxiosError('offline')).kind).toBe('network');
    expect(normalizeError(new CanceledError()).kind).toBe('canceled');
  });
  it.each([null, undefined, 'error', 409, new Error('private'), { response: { status: 409 } }])('handles untrusted values', (value) => {
    expect(normalizeError(value).status).toBeUndefined();
    expect(normalizeError(value).kind).toBe('unknown');
  });
  it('only retries a transient query once', () => {
    expect(shouldRetryQuery(0, httpError(500))).toBe(true);
    expect(shouldRetryQuery(1, httpError(500))).toBe(false);
    expect(shouldRetryQuery(0, httpError(401))).toBe(false);
    expect(shouldRetryQuery(0, httpError(409))).toBe(false);
  });
});
