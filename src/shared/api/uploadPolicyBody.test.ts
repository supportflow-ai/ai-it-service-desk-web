import { expect, it, vi } from 'vitest';

const { post } = vi.hoisted(() => ({
  post: vi.fn<(url: string, data: unknown, config?: { headers?: unknown }) => Promise<{ status: number }>>()
    .mockResolvedValue({ status: 204 }),
}));
// Mock the transport boundary: jsdom FormData is not undici FormData used by MSW.
// Browser serialization is checked separately by e2e/attachments.spec.ts.
vi.mock('axios', () => ({ default: { create: () => ({ post }) } }));
import { uploadToPresignedUrl } from './uploadClient';

it('builds a multipart POST body containing the exact signed fields and file', async () => {
  await uploadToPresignedUrl('https://storage.example.invalid/upload', new File(['hello'], 'file.txt', { type: 'text/plain' }),
    { formData: { key: 'pending/key', policy: 'signed-policy', 'Content-Type': 'text/plain' } });
  const [, body, config] = post.mock.calls[0] ?? [];
  if (!(body instanceof FormData)) throw new Error('Expected browser FormData');
  expect(body.get('key')).toBe('pending/key');
  expect(body.get('policy')).toBe('signed-policy');
  expect(body.get('Content-Type')).toBe('text/plain');
  const file = body.get('file');
  expect(file).toBeInstanceOf(Blob);
  if (file instanceof Blob) expect(file.size).toBe(5);
  expect(config?.headers).toBeUndefined();
});
