import { Result } from 'antd';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <Result status="404" title="404" subTitle="Không tìm thấy trang." extra={<Link to="/">Về trang chủ</Link>} />;
}
