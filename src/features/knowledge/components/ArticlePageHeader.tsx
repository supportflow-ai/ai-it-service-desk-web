import type { ReactNode } from 'react';
import { Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

interface ArticlePageHeaderProps {
  title: string;
  backPath: string;
  backLabel: string;
  /** Status, version or actions shown beside the title. */
  extra?: ReactNode;
}

export function ArticlePageHeader({ title, backPath, backLabel, extra }: ArticlePageHeaderProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Link to={backPath} style={{ fontWeight: 500 }}><ArrowLeftOutlined /> {backLabel}</Link>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
        <Typography.Title level={2} style={{ margin: 0, fontWeight: 700 }}>{title}</Typography.Title>
        {extra && <Space wrap>{extra}</Space>}
      </div>
    </div>
  );
}
