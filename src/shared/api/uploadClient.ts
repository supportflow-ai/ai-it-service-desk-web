/**
 * Uploads raw binary data to a presigned URL using PUT.
 * Isolated within shared/api to adhere to architecture HTTP transport boundaries.
 */
export async function uploadToPresignedUrl(uploadUrl: string, file: Blob, contentType?: string): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': contentType || (file instanceof File && file.type ? file.type : 'application/octet-stream'),
    },
  });

  if (!response.ok) {
    throw new Error(`Upload file lên storage thất bại (${response.status})`);
  }
}
