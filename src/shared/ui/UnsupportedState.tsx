import { Alert } from 'antd';

export function UnsupportedState({ feature }: { feature: string }) {
  return <Alert showIcon type="info" message={`${feature} chưa được hỗ trợ.`} />;
}
