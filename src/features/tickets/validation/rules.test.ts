import { describe, expect, it } from 'vitest';
import { ATTACHMENT_MAX_BYTES, resolveAttachmentContentType, validateAttachmentFile, validateTicketCapacity } from './attachmentRules';
import { COMMENT_MAX_LENGTH, canSendComment, validateCommentContent } from './commentRules';

describe('comment rules', () => {
  it('matches the backend 2–4000 trimmed character limits', () => {
    expect(validateCommentContent('')).toBeNull();
    expect(canSendComment('   ')).toBe(false);
    expect(validateCommentContent(' a ')).toMatch(/ít nhất 2/);
    expect(canSendComment(' ab ')).toBe(true);
    expect(canSendComment('x'.repeat(COMMENT_MAX_LENGTH))).toBe(true);
    expect(validateCommentContent('x'.repeat(COMMENT_MAX_LENGTH + 1))).toMatch(/tối đa 4000/);
  });
});

describe('attachment rules', () => {
  it('accepts the backend allow-list case-insensitively', () => {
    expect(validateAttachmentFile({ name: 'log.TXT', size: 10 })).toBeNull();
    expect(validateAttachmentFile({ name: 'scan.final.pdf', size: ATTACHMENT_MAX_BYTES })).toBeNull();
  });

  it('rejects other extensions, files without one and dot-files', () => {
    expect(validateAttachmentFile({ name: 'setup.exe', size: 10 })).toMatch(/'\.exe'/);
    expect(validateAttachmentFile({ name: 'README', size: 10 })).toMatch(/không được hỗ trợ/);
    expect(validateAttachmentFile({ name: '.png', size: 10 })).toMatch(/không được hỗ trợ/);
  });

  it('rejects empty and oversized files', () => {
    expect(validateAttachmentFile({ name: 'a.png', size: 0 })).toMatch(/tối đa 10 MB/);
    expect(validateAttachmentFile({ name: 'a.png', size: ATTACHMENT_MAX_BYTES + 1 })).toMatch(/tối đa 10 MB/);
  });

  it('keeps the browser content type when it is specific', () => {
    expect(resolveAttachmentContentType({ name: 'a.txt', type: 'text/plain' })).toBe('text/plain');
  });

  it('falls back to the backend type for the extension when the browser type is empty or generic', () => {
    const docx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    expect(resolveAttachmentContentType({ name: 'Report.DOCX', type: '' })).toBe(docx);
    expect(resolveAttachmentContentType({ name: 'a.zip', type: 'application/octet-stream' })).toBe('application/zip');
    expect(resolveAttachmentContentType({ name: 'a.jpeg', type: '' })).toBe('image/jpeg');
  });

  it('keeps octet-stream for an unknown extension', () => {
    expect(resolveAttachmentContentType({ name: 'a.exe', type: '' })).toBe('application/octet-stream');
  });
});

describe('ticket attachment quota', () => {
  const MiB = 1024 * 1024;

  it('accepts the tenth file when the total is exactly 50 MiB', () => {
    expect(validateTicketCapacity(Array(9).fill(5 * MiB), { size: 5 * MiB })).toBeNull();
  });

  it('rejects an eleventh file even when the total fits', () => {
    expect(validateTicketCapacity(Array(10).fill(1), { size: 1 })).toMatch(/tối đa 10 tệp/);
  });

  it('rejects a total over 50 MiB by one byte', () => {
    expect(validateTicketCapacity([10 * MiB, 10 * MiB, 10 * MiB, 10 * MiB], { size: 10 * MiB + 1 })).toMatch(/50 MB/);
  });
});
