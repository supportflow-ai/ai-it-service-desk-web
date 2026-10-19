import { Spin } from 'antd';

export function PageLoader() {
  return <div role="status" aria-label="Đang tải" style={{ padding: 48, textAlign: 'center' }}><Spin size="large" /></div>;
}
