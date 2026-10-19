import { Card } from 'antd';
import { UnsupportedState } from '@/shared/ui/UnsupportedState';

export function UnavailablePage({ title }: { title: string }) {
  return <Card title={title}><UnsupportedState feature={title} /></Card>;
}
