// Markdown syntax dropped for a one-paragraph preview. The result is rendered as plain text, so
// these rules only tidy it; they are not what keeps it safe.
const rules: readonly [RegExp, string][] = [
  [/```[\s\S]*?(?:```|$)/g, ' '],
  [/!\[([^\]]*)\]\([^)]*\)/g, '$1'],
  [/\[([^\]]*)\]\([^)]*\)/g, '$1'],
  [/<[^>]+>/g, ' '],
  [/^[ \t]*(?:#{1,6}|>+|[-*+]|\d+[.)])[ \t]+/gm, ''],
  [/^\[[ xX]\][ \t]+/gm, ''],
  [/^[ \t]*\|?[ \t]*:?-{3,}[\s|:-]*$/gm, ' '],
  [/(\*\*|__|~~)(.+?)\1/g, '$2'],
  // Single * or _ only around words, so snake_case names keep their underscores.
  [/(?<!\w)([*_])(?!\s)(.+?)(?<!\s)\1(?!\w)/g, '$2'],
  [/`([^`]*)`/g, '$1'],
  [/\|/g, ' '],
  [/\s+/g, ' '],
  [/ ([.,;:!?])/g, '$1'],
];

/** The start of an article as plain text, cut on a word boundary. */
export function articleExcerpt(markdown: string, maxLength = 200) {
  const text = rules.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), markdown).trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
