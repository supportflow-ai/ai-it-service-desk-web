import { describe, expect, it } from 'vitest';
import { ATTACHMENT_MAX_BYTES, validateAttachmentFile } from './attachmentRules';
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
});
