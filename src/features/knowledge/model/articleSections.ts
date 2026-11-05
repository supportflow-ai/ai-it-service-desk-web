import { articleExcerpt } from './articleExcerpt';

/** The headings of an article's Markdown as their text reads: `#` to `######`, outside code blocks. */
export function articleSections(markdown: string) {
  const outsideCode = markdown.replace(/```[\s\S]*?(?:```|$)/g, '');
  return [...outsideCode.matchAll(/^[ \t]{0,3}#{1,6}[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/gm)]
    .map((match) => articleExcerpt(match[1] ?? '', 500));
}

function normalized(section: string) {
  return section.trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
}

/** Whether two section names are the same heading, whatever their case or spacing. */
export function sameSection(a: string, b: string) {
  return normalized(a) === normalized(b);
}
