import { describe, expect, it } from 'vitest';
import { timelineItemA } from '../../../../tests/fixtures';
import { timelineAuthorLabel, visibleTimelineItems } from './timeline';

const otherAuthorId = '00000000-0000-0000-0000-000000000002';

describe('timeline display rules', () => {
  it('labels the current user as "Bạn"', () => {
    expect(timelineAuthorLabel(timelineItemA, timelineItemA.authorId)).toBe('Bạn');
  });

  it('never shows a raw user id as the author name', () => {
    const idAsName = { ...timelineItemA, authorId: otherAuthorId, authorName: otherAuthorId, authorRole: 'Agent' };
    expect(timelineAuthorLabel(idAsName, undefined)).toBe('Kỹ thuật viên');
    expect(timelineAuthorLabel({ ...idAsName, authorName: '  ' }, undefined)).toBe('Kỹ thuật viên');
  });

  it('keeps a real author name', () => {
    expect(timelineAuthorLabel({ ...timelineItemA, authorId: otherAuthorId }, undefined)).toBe(timelineItemA.authorName);
  });

  it('drops internal notes for viewers who may not see them', () => {
    const note = { ...timelineItemA, id: 'note', isInternal: true };
    expect(visibleTimelineItems([timelineItemA, note], false)).toEqual([timelineItemA]);
    expect(visibleTimelineItems([timelineItemA, note], true)).toEqual([timelineItemA, note]);
  });
});
