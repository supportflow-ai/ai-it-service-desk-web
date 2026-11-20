import type { RagCitation, RagSuggestionView } from './rag.types';

/**
 * What the RAG panel shows (TC-384, TC-386). The three ways of having no answer are kept apart,
 * because they ask the agent for different things: `loading` wait, `unavailable` try later or
 * work by hand, `no-evidence` search the knowledge base or work by hand.
 */
export type RagPanelState =
  | { kind: 'not-enabled' }
  | { kind: 'loading' }
  | { kind: 'unavailable'; reason: 'Unavailable' | 'Timeout' }
  /** `abstained`: retrieval found nothing close enough. `uncited`: an answer came without a source. */
  | { kind: 'no-evidence'; reason: 'abstained' | 'uncited' }
  | { kind: 'answer'; view: RagSuggestionView; answer: string; citations: RagCitation[] };

export function ragPanelState(result: RagSuggestionView | null, loading: boolean): RagPanelState {
  // A request in flight wins over an older result, so a stale answer is not shown beside a new run.
  if (loading) return { kind: 'loading' };
  if (!result) return { kind: 'not-enabled' };
  switch (result.outcome) {
    case 'Unavailable':
    case 'Timeout':
      return { kind: 'unavailable', reason: result.outcome };
    case 'NoEvidence':
      return { kind: 'no-evidence', reason: 'abstained' };
    case 'Answered': {
      const answer = result.answer?.trim() ?? '';
      // An answer with no source cannot be checked, so it is treated as no evidence, never shown.
      if (answer === '' || result.citations.length === 0) return { kind: 'no-evidence', reason: 'uncited' };
      return { kind: 'answer', view: result, answer, citations: result.citations };
    }
  }
}

/** Fixed, user-facing text per failure; the provider's own message is never shown (TC-277). */
export const ragUnavailableMessages: Record<'Unavailable' | 'Timeout', string> = {
  Unavailable: 'Dịch vụ AI tạm thời không khả dụng.',
  Timeout: 'AI phản hồi quá thời gian cho phép.',
};

export const ragNoEvidenceMessages: Record<'abstained' | 'uncited', { message: string; description: string }> = {
  abstained: {
    message: 'AI không tìm thấy bằng chứng đủ gần trong Kho tri thức nên không đưa ra gợi ý.',
    description: 'Đây không phải lỗi hệ thống. Hãy tra cứu Kho tri thức hoặc xử lý ticket thủ công.',
  },
  uncited: {
    message: 'AI có câu trả lời nhưng không kèm nguồn nên không được hiển thị.',
    description: 'Gợi ý không có bằng chứng thì không thể kiểm tra. Hãy tra cứu Kho tri thức hoặc xử lý thủ công.',
  },
};

export const ragCitationLimits = { snippet: 280 } as const;

/** A model score as a plain number, never a percentage (Spec §11.3). */
export function formatEvidenceScore(score: number) {
  return score.toFixed(2);
}

export function citationSectionLabel(section: string | null) {
  return section?.trim() ? section : 'Phần mở đầu';
}

/** Version and publication date of the cited article, for the lines under a citation. */
export function formatEvidenceDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatGeneratedAt(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** Whitespace-only tidy-up used when no adapter supplies an excerpt: plain text, cut on a word. */
export function plainExcerpt(text: string, maxLength: number) {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= maxLength) return flat;
  const cut = flat.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
