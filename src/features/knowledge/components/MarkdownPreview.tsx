import Markdown, { defaultUrlTransform } from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// NFR-SEC-04: article Markdown is stored as typed (the backend does not sanitize it), so it is
// rendered here without any HTML path:
// - react-markdown builds React elements, never innerHTML; raw HTML in the text is shown as text.
//   Do not add rehype-raw or a similar plugin: it would turn that text back into live HTML.
// - defaultUrlTransform keeps only http(s), mailto, irc(s), xmpp and relative URLs in links and
//   images; javascript:, data: or vbscript: become empty.
// A URL the transform emptied is left out, rather than rendered as href="" or src="".
const components: Components = {
  a: ({ href, children }) => (
    <a href={href || undefined} target="_blank" rel="noopener noreferrer nofollow">{children}</a>
  ),
  img: ({ src, alt }) => (
    <img src={typeof src === 'string' && src ? src : undefined} alt={alt ?? ''} loading="lazy" referrerPolicy="no-referrer" />
  ),
};

/** Article Markdown as readers see it, with GitHub-flavoured tables, task lists and strikethrough. */
export function MarkdownPreview({ markdown }: { markdown: string }) {
  return (
    <div className="kb-markdown">
      <Markdown remarkPlugins={[remarkGfm]} components={components} urlTransform={defaultUrlTransform}>
        {markdown}
      </Markdown>
    </div>
  );
}
