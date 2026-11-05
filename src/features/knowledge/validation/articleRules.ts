import type { Rule } from 'antd/es/form';

// Mirrors the Article domain at backend dev 1506a5b (ValidateAndNormalizeTitle/Content, NormalizeTags).
export const ARTICLE_TITLE_MAX = 200;
export const ARTICLE_CONTENT_MIN = 10;
export const ARTICLE_TAGS_MAX = 10;
export const ARTICLE_TAG_MAX = 50;

/** As the backend stores them: trimmed, lower case, without duplicates. Blank entries are dropped. */
export function normalizeTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const tag of tags) {
    const normalized = tag.trim().toLowerCase();
    if (normalized) seen.add(normalized);
  }
  return [...seen];
}

/** Returns a user-facing message, or null when the tags can be saved. */
export function validateTags(tags: readonly string[]): string | null {
  const normalized = normalizeTags(tags);
  if (normalized.length > ARTICLE_TAGS_MAX) return `Tối đa ${ARTICLE_TAGS_MAX} tag.`;
  const tooLong = normalized.find((tag) => tag.length > ARTICLE_TAG_MAX);
  return tooLong ? `Tag "${tooLong.slice(0, 20)}…" dài quá ${ARTICLE_TAG_MAX} ký tự.` : null;
}

const trimmedLength = (value: unknown) => (typeof value === 'string' ? value.trim().length : 0);

export const articleRules = {
  title: [
    { required: true, whitespace: true, message: 'Vui lòng nhập tiêu đề.' },
    {
      validator: (_, value: unknown) => (trimmedLength(value) <= ARTICLE_TITLE_MAX
        ? Promise.resolve() : Promise.reject(new Error(`Tiêu đề tối đa ${ARTICLE_TITLE_MAX} ký tự.`))),
    },
  ],
  content: [
    { required: true, whitespace: true, message: 'Vui lòng nhập nội dung.' },
    {
      validator: (_, value: unknown) => (trimmedLength(value) >= ARTICLE_CONTENT_MIN
        ? Promise.resolve() : Promise.reject(new Error(`Nội dung cần ít nhất ${ARTICLE_CONTENT_MIN} ký tự.`))),
    },
  ],
  tags: [
    {
      validator: (_, value: unknown) => {
        const message = Array.isArray(value) ? validateTags(value.filter((tag): tag is string => typeof tag === 'string')) : null;
        return message ? Promise.reject(new Error(message)) : Promise.resolve();
      },
    },
  ],
} satisfies Record<string, Rule[]>;
