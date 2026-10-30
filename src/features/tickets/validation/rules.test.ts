import { describe, expect, it } from 'vitest';
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
