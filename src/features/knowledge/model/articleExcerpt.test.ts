import { describe, expect, it } from 'vitest';
import { articleExcerpt } from './articleExcerpt';

describe('article excerpt', () => {
  it('drops Markdown syntax and keeps the words', () => {
    const markdown = [
      '## Các bước', '', '1. Mở **Cài đặt** > *Mạng*', '2. Chọn `SupportFlow_Guest`', '- [x] Đã kết nối',
      '', '> Xem [hướng dẫn](https://example.com) và ![sơ đồ](a.png)', '', '| Lỗi | Cách xử lý |', '| --- | --- |', '| 809 | Tường lửa |',
    ].join('\n');
    expect(articleExcerpt(markdown)).toBe('Các bước Mở Cài đặt > Mạng Chọn SupportFlow_Guest Đã kết nối Xem hướng dẫn và sơ đồ Lỗi Cách xử lý 809 Tường lửa');
  });

  it('leaves code blocks and raw HTML tags out', () => {
    expect(articleExcerpt('Chạy lệnh:\n```sh\nipconfig /all\n```\nrồi <b>khởi động lại</b>.')).toBe('Chạy lệnh: rồi khởi động lại.');
    expect(articleExcerpt('Nhấn <script>alert(1)</script> Enter')).toBe('Nhấn alert(1) Enter');
    expect(articleExcerpt('Bấm [đây](javascript:alert(1)) hoặc [wiki](https://vi.wikipedia.org/wiki/VPN_(mạng))')).toBe('Bấm đây hoặc wiki');
  });

  it('cuts a long text on a word and marks the cut', () => {
    const excerpt = articleExcerpt('một hai ba bốn năm sáu bảy tám chín mười', 20);
    expect(excerpt).toBe('một hai ba bốn năm…');
    expect(excerpt.length).toBeLessThanOrEqual(21);
    expect(articleExcerpt('ngắn', 20)).toBe('ngắn');
  });
});
