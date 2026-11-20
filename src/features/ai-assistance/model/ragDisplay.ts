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
