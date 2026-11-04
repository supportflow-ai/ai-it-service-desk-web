import { Result, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { normalizeError } from '@/shared/api/httpError';
import { ErrorState } from '@/shared/ui/ErrorState';

interface ArticleUnavailableProps {
  /** null: the address names no article. */
  error: unknown;
  backPath: string;
  onRetry: () => void;
}

/** Full-page state when an article cannot be shown: missing, out of scope or failed to load. */
export function ArticleUnavailable({ error, backPath, onRetry }: ArticleUnavailableProps) {
  const back = <Link to={backPath}><ArrowLeftOutlined /> Quay lại danh sách</Link>;
  const status = error === null ? 404 : normalizeError(error).status;
  // 403 and 404 read the same, so the page never says whether an article it hides exists (UX-04).
  if (status === 404 || status === 403) {
    return <Result status="404" title="Không tìm thấy bài viết" subTitle="Bài viết không tồn tại hoặc bạn không có quyền xem." extra={back} />;
  }
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <ErrorState error={error} onRetry={onRetry} />
      {back}
    </Space>
  );
}
