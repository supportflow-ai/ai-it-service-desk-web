import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../tests/mocks/server';
import { configureApiClient } from './apiClient';
import { AppError } from './httpError';
import { uploadToPresignedUrl } from './uploadClient';

const target = 'https://storage.example.com/upload-target';

describe('uploadToPresignedUrl', () => {
  // jsdom + msw cannot read a File request body; the byte-for-byte body is checked in e2e/attachments.spec.ts.
  it('PUTs with the file content type and never the API bearer token', async () => {
    configureApiClient({ baseURL: 'http://localhost/api', getAccessToken: () => 'api-token', getSessionVersion: () => 1, onUnauthorized: () => {} });
    let seen: { method: string; authorization: string | null; contentType: string | null } | undefined;
    server.use(http.put(target, ({ request }) => {
      seen = { method: request.method, authorization: request.headers.get('authorization'), contentType: request.headers.get('content-type') };
      return new HttpResponse(null, { status: 200 });
    }));

    await uploadToPresignedUrl(target, new File(['hello content'], 'test.txt', { type: 'text/plain' }));

    expect(seen).toEqual({ method: 'PUT', authorization: null, contentType: 'text/plain' });
  });

  it('normalizes a storage rejection without exposing it as an API status', async () => {
    server.use(http.put(target, () => new HttpResponse(null, { status: 403 })));

    const failure = uploadToPresignedUrl(target, new File(['hello'], 'test.txt', { type: 'text/plain' }));

    await expect(failure).rejects.toBeInstanceOf(AppError);
    await expect(failure).rejects.toMatchObject({
      kind: 'http',
      status: undefined,
      message: 'Không tải được tệp lên kho lưu trữ. Vui lòng thử lại.',
    });
  });
});
