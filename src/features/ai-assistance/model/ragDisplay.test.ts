import { describe, expect, it } from 'vitest';
import type { RagCitation, RagSuggestionView } from './rag.types';
import { citationSectionLabel, plainExcerpt, ragPanelState } from './ragDisplay';

const citation: RagCitation = {
  articleId: '40000000-0000-0000-0000-000000000001', title: 'Cấu hình VPN', section: 'Cài đặt',
  snippet: 'Mở ứng dụng VPN.', score: 0.82, version: 3, publishedAt: '2026-11-04T08:00:00Z',
};
const answered: RagSuggestionView = {
  outcome: 'Answered', answer: 'Hãy cài lại VPN.', citations: [citation], model: 'm-1', confidence: 'High', score: 0.82, generatedAt: null,
};

describe('ragPanelState', () => {
  it('has no result and nothing running when AI is not enabled', () => {
    expect(ragPanelState(null, false)).toEqual({ kind: 'not-enabled' });
  });

  it('tells a running request apart from every other state, even over an older result', () => {
    expect(ragPanelState(null, true)).toEqual({ kind: 'loading' });
    expect(ragPanelState(answered, true)).toEqual({ kind: 'loading' });
  });

  it('shows an answer only together with its sources', () => {
    const state = ragPanelState(answered, false);
    expect(state).toMatchObject({ kind: 'answer', answer: 'Hãy cài lại VPN.', citations: [citation] });
  });

  it.each([
    ['no citations', { ...answered, citations: [] }],
    ['a blank answer', { ...answered, answer: '   ' }],
    ['no answer text', { ...answered, answer: null }],
  ])('treats an answer with %s as no evidence instead of showing it', (_name, view) => {
    expect(ragPanelState(view, false)).toEqual({ kind: 'no-evidence', reason: 'uncited' });
  });

  it('keeps abstention apart from an unavailable AI, and never shows an answer on those outcomes', () => {
    expect(ragPanelState({ ...answered, outcome: 'NoEvidence' }, false)).toEqual({ kind: 'no-evidence', reason: 'abstained' });
    expect(ragPanelState({ ...answered, outcome: 'Unavailable' }, false)).toEqual({ kind: 'unavailable', reason: 'Unavailable' });
    expect(ragPanelState({ ...answered, outcome: 'Timeout' }, false)).toEqual({ kind: 'unavailable', reason: 'Timeout' });
  });
});

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
