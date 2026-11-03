import { expect, it, vi } from 'vitest';

const { request } = vi.hoisted(() => ({
  request: vi.fn<(config: { url: string; method: string; data: unknown; headers?: unknown }) => Promise<{ status: number }>>()
    .mockResolvedValue({ status: 204 }),
}));
// Mock the transport boundary: jsdom FormData is not undici FormData used by MSW.
// Browser serialization is checked separately by e2e/attachments.spec.ts.
vi.mock('axios', () => ({ default: { create: () => ({ request }) } }));
import { uploadToPresignedUrl } from './uploadClient';

it('builds a multipart POST body containing the exact signed fields and file', async () => {
  await uploadToPresignedUrl('https://storage.example.invalid/upload', new File(['hello'], 'file.txt', { type: 'text/plain' }),
    { formData: { key: 'pending/key', policy: 'signed-policy', 'Content-Type': 'text/plain' } });
  const config = request.mock.calls[0]?.[0];
  expect(config?.method).toBe('POST');
  const body = config?.data;
  if (!(body instanceof FormData)) throw new Error('Expected browser FormData');
  expect(body.get('key')).toBe('pending/key');
  expect(body.get('policy')).toBe('signed-policy');
  expect(body.get('Content-Type')).toBe('text/plain');
  const file = body.get('file');
  expect(file).toBeInstanceOf(Blob);
  if (file instanceof Blob) expect(file.size).toBe(5);
  expect(config?.headers).toBeUndefined();
});
