import { Button, Input, Space } from 'antd';
import type { ArticleListFilters } from '../model/knowledge.types';
import { articleStatusTabs } from '../model/articleList';

interface KnowledgeToolbarProps {
  filters: ArticleListFilters;
  totalCount: number | undefined;
  onChange: (patch: Partial<Pick<ArticleListFilters, 'status' | 'tag' | 'query'>>) => void;
}

function tabStyle(active: boolean) {
  return {
    borderRadius: 0,
    borderBottom: active ? '2px solid var(--pr)' : '2px solid transparent',
    color: active ? 'var(--pr)' : 'var(--tx2)',
    fontWeight: 600,
    padding: '8px 16px',
    height: 'auto',
  };
}

export function KnowledgeToolbar({ filters, totalCount, onChange }: KnowledgeToolbarProps) {
  return (
    <>
      <div role="tablist" aria-label="Trạng thái bài viết" style={{ display: 'flex', borderBottom: '1px solid var(--bd)', marginBottom: 12 }}>
        {articleStatusTabs.map(({ status, label }) => {
          const active = status === filters.status;
          return (
            <Button key={label} type="text" role="tab" aria-selected={active} onClick={() => onChange({ status })} style={tabStyle(active)}>
              {label}{active && totalCount !== undefined ? ` (${totalCount})` : ''}
            </Button>
          );
        })}
      </div>

      {/* Remounted when the URL changes, so the boxes always show the filters in force. */}
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          key={`q-${filters.query}`}
          aria-label="Tìm bài viết"
          allowClear
          defaultValue={filters.query}
          placeholder="Tìm theo tiêu đề hoặc nội dung"
          style={{ width: 320 }}
          onSearch={(value) => onChange({ query: value.trim() })}
        />
        <Input.Search
          key={`tag-${filters.tag}`}
          aria-label="Lọc theo tag"
          allowClear
          defaultValue={filters.tag}
          placeholder="Lọc theo tag, ví dụ: vpn"
          style={{ width: 240 }}
          onSearch={(value) => onChange({ tag: value.trim() })}
        />
      </Space>
    </>
  );
}
