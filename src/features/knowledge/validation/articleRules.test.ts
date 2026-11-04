import { describe, expect, it } from 'vitest';
import { normalizeTags, validateTags } from './articleRules';

describe('article rules (backend Article domain at dev 1506a5b)', () => {
  it('normalizes tags as the backend stores them', () => {
    expect(normalizeTags([' VPN ', 'vpn', 'Mật-Khẩu', '', '   ', 'mật-khẩu'])).toEqual(['vpn', 'mật-khẩu']);
  });

  it('accepts up to 10 tags of up to 50 characters', () => {
    expect(validateTags([])).toBeNull();
    expect(validateTags(Array.from({ length: 10 }, (_, i) => `tag${i}`))).toBeNull();
    expect(validateTags(['a'.repeat(50)])).toBeNull();
  });

  it('counts tags after normalizing, so duplicates do not add up', () => {
    expect(validateTags([...Array.from({ length: 10 }, (_, i) => `tag${i}`), 'TAG0'])).toBeNull();
  });

  it('rejects more than 10 tags or a tag over 50 characters', () => {
    expect(validateTags(Array.from({ length: 11 }, (_, i) => `tag${i}`))).toBe('Tối đa 10 tag.');
    expect(validateTags(['a'.repeat(51)])).toMatch(/dài quá 50 ký tự/);
  });
});
