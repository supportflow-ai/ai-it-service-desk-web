import { Empty, Tag, Typography } from 'antd';
import { MarkdownPreview } from './MarkdownPreview';

interface ArticlePreviewProps {
  title: string;
  tags: readonly string[];
  content: string;
}

/** The draft as readers will see it once published (TC-339). */
export function ArticlePreview({ title, tags, content }: ArticlePreviewProps) {
  if (!title.trim() && !content.trim()) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có nội dung để xem trước." />;
  }
  return (
    <article aria-label="Xem trước bài viết" style={{ border: '1px solid var(--bd)', borderRadius: 8, padding: '16px 20px', background: 'var(--sf)' }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>{title.trim() || 'Chưa có tiêu đề'}</Typography.Title>
      {tags.length > 0 && <div style={{ marginBottom: 12 }}>{tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</div>}
      <MarkdownPreview markdown={content} />
    </article>
  );
}
