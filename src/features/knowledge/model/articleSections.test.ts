import { describe, expect, it } from 'vitest';
import { articleSections, sameSection } from './articleSections';

describe('article sections', () => {
  it('lists the headings as their text reads, leaving code blocks out', () => {
    const markdown = ['Mở đầu', '## Các **bước**', 'text', '```', '# không phải heading', '```', '### Lỗi `809` ###', '####### quá sâu'].join('\n');
    expect(articleSections(markdown)).toEqual(['Các bước', 'Lỗi 809']);
    expect(articleSections('Không có heading nào.')).toEqual([]);
  });

  it('matches a section whatever its case or spacing', () => {
    expect(sameSection('  Các   bước ', 'các bước')).toBe(true);
    expect(sameSection('Các bước', 'Bước 1')).toBe(false);
  });
});
