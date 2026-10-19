export function canReviewSuggestion(revision: number | null, stale: boolean, manual: boolean, hasHandler: boolean) {
  return revision !== null && Number.isInteger(revision) && revision >= 0 && !stale && !manual && hasHandler;
}
