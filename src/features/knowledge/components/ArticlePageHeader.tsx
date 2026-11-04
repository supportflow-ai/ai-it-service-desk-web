import type { ReactNode } from 'react';
import { Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

interface ArticlePageHeaderProps {
  title: string;
  backPath: string;
  backLabel: string;
  /** Router state for the back link, e.g. the list filters to return to. */
  backState?: unknown;
  /** Status, version or actions shown beside the title. */
  extra?: ReactNode;
}

export function ArticlePageHeader({ title, backPath, backLabel, backState, extra }: ArticlePageHeaderProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Link to={backPath} state={backState} style={{ fontWeight: 500 }}><ArrowLeftOutlined /> {backLabel}</Link>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
        <Typography.Title level={2} style={{ margin: 0, fontWeight: 700 }}>{title}</Typography.Title>
        {extra && <Space wrap>{extra}</Space>}
      </div>
    </div>
  );
}
