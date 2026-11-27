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

  it('sends the required headers of the signed URL and lets them override Content-Type', async () => {
    let seen: { contentType: string | null; encryption: string | null } | undefined;
    server.use(http.put(target, ({ request }) => {
      seen = { contentType: request.headers.get('content-type'), encryption: request.headers.get('x-amz-server-side-encryption') };
      return new HttpResponse(null, { status: 200 });
    }));

    await uploadToPresignedUrl(target, new File(['hello'], 'test.txt', { type: 'text/plain' }), {
      requiredHeaders: { 'content-type': 'application/pdf', 'x-amz-server-side-encryption': 'AES256' },
    });

    expect(seen).toEqual({ contentType: 'application/pdf', encryption: 'AES256' });
  });

  it('does not set Content-Length from the required headers, the browser sends its own', async () => {
    let seen: { encryption: string | null } | undefined;
    server.use(http.put(target, ({ request }) => {
      seen = { encryption: request.headers.get('x-amz-server-side-encryption') };
      return new HttpResponse(null, { status: 200 });
    }));

    await expect(uploadToPresignedUrl(target, new File(['hello'], 'test.txt', { type: 'text/plain' }), {
      requiredHeaders: { 'Content-Length': '5', 'x-amz-server-side-encryption': 'AES256' },
    })).resolves.toBeUndefined();
    expect(seen).toEqual({ encryption: 'AES256' });
  });

  // The presigned POST-policy branch is covered in e2e/attachments.spec.ts only: on Node 22 a jsdom
  // File inside FormData never completes through MSW's XMLHttpRequest interceptor.
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
