import { describe, expect, it, vi } from 'vitest';
import { uploadToPresignedUrl } from './uploadClient';

describe('uploadToPresignedUrl', () => {
  it('makes PUT request with body and content type', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    vi.stubGlobal('fetch', fetchMock);

    const file = new File(['hello content'], 'test.txt', { type: 'text/plain' });
    await uploadToPresignedUrl('https://storage.example.com/upload-target', file);

    expect(fetchMock).toHaveBeenCalledWith('https://storage.example.com/upload-target', {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': 'text/plain',
      },
    });

    vi.unstubAllGlobals();
  });

  it('throws an error if upload response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    });
    vi.stubGlobal('fetch', fetchMock);

    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    await expect(uploadToPresignedUrl('https://storage.example.com/fail', file)).rejects.toThrow(
      'Upload file lên storage thất bại (403)',
    );

    vi.unstubAllGlobals();
  });
});
