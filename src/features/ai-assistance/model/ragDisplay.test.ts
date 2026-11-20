import { describe, expect, it } from 'vitest';
import { citationSectionLabel, plainExcerpt } from './ragDisplay';

describe('citation text', () => {
  it('names the opening when a passage has no section', () => {
    expect(citationSectionLabel(null)).toBe('Phần mở đầu');
    expect(citationSectionLabel('  ')).toBe('Phần mở đầu');
    expect(citationSectionLabel('Cài đặt')).toBe('Cài đặt');
  });

  it('flattens whitespace and cuts on a word', () => {
    expect(plainExcerpt('a   b\n\nc', 50)).toBe('a b c');
    expect(plainExcerpt('một hai ba bốn năm sáu', 14)).toBe('một hai ba…');
  });
});
