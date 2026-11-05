import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownPreview } from './MarkdownPreview';

function renderMarkdown(markdown: string) {
  return render(<MarkdownPreview markdown={markdown} />).container;
}

describe('Markdown preview: what it renders', () => {
  it('renders headings, emphasis, lists, code, quotes and GitHub-flavoured tables, task lists and strikethrough', () => {
    const container = renderMarkdown([
      '## Cách xử lý', '', '**Quan trọng**: làm theo thứ tự.', '', '1. Mở VPN', '2. Đăng nhập', '',
      '- [x] Đã thử', '- [ ] Chưa thử', '', '> Lưu ý', '', '`ipconfig /all`', '', '~~cách cũ~~', '',
      '| Lỗi | Cách xử lý |', '| --- | --- |', '| 809 | Mở cổng UDP 500 |',
    ].join('\n'));
    expect(screen.getByRole('heading', { level: 2, name: 'Cách xử lý' })).toBeInTheDocument();
    expect(container.querySelector('strong')).toHaveTextContent('Quan trọng');
    expect(container.querySelectorAll('ol li')).toHaveLength(2);
    expect(container.querySelector('blockquote')).toHaveTextContent('Lưu ý');
    expect(container.querySelector('code')).toHaveTextContent('ipconfig /all');
    expect(container.querySelector('del')).toHaveTextContent('cách cũ');
    expect(screen.getByRole('table')).toHaveTextContent('Mở cổng UDP 500');
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes.map((box) => (box as HTMLInputElement).checked)).toEqual([true, false]);
    expect(boxes.every((box) => box.hasAttribute('disabled'))).toBe(true);
  });

  it('keeps safe links, opening them in a new tab without referrer or opener', () => {
    renderMarkdown('[Cổng IT](https://it.example.com/vpn) · [Danh sách](/knowledge/manage) · [Hỗ trợ](mailto:it@example.com)');
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['https://it.example.com/vpn', '/knowledge/manage', 'mailto:it@example.com']);
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.getAttribute('rel')).toContain('noreferrer');
    }
  });

  it('keeps http(s) images, loaded lazily without referrer', () => {
    const container = renderMarkdown('![Màn hình lỗi](https://it.example.com/err.png)');
    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', 'https://it.example.com/err.png');
    expect(image).toHaveAttribute('alt', 'Màn hình lỗi');
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
  });
});

describe('Markdown preview: XSS (NFR-SEC-04)', () => {
  it.each([
    ['a script tag', '<script>window.__xss = 1</script>', 'script'],
    ['an image with an error handler', '<img src="x" onerror="window.__xss = 1">', 'img'],
    ['an iframe', '<iframe src="https://evil.example"></iframe>', 'iframe'],
    ['a raw HTML link', '<a href="javascript:alert(1)">bấm</a>', 'a'],
    ['an inline event handler', '<div onclick="alert(1)">bấm</div>', 'div[onclick]'],
  ])('shows %s as text, never as an element', (_, markdown, selector) => {
    const container = renderMarkdown(markdown);
    expect(container.querySelector(selector)).toBeNull();
    expect(container).toHaveTextContent(markdown);
  });

  it.each([
    ['javascript:alert(1)'],
    ['JaVaScRiPt:alert(1)'],
    ['java&#115;cript:alert(1)'],
    ['vbscript:msgbox(1)'],
    ['data:text/html,<script>alert(1)</script>'],
  ])('drops the unsafe link target %s', (target) => {
    const container = renderMarkdown(`[bấm vào đây](${target})`);
    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.hasAttribute('href')).toBe(false);
    expect(container.innerHTML.toLowerCase()).not.toMatch(/javascript:|vbscript:|data:text/);
  });

  it('drops an unsafe image source', () => {
    const container = renderMarkdown('![x](javascript:alert(1)) ![y](data:image/svg+xml;base64,PHN2Zy8+)');
    const images = [...container.querySelectorAll('img')];
    expect(images).toHaveLength(2);
    expect(images.every((image) => !image.hasAttribute('src'))).toBe(true);
  });

  it('keeps text that merely looks like a tag, such as a key name', () => {
    renderMarkdown('Nhấn <Enter> để tiếp tục.');
    expect(screen.getByText('Nhấn <Enter> để tiếp tục.')).toBeInTheDocument();
  });
});
