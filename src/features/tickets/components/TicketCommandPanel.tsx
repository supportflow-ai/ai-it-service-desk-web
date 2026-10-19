import { useState } from 'react';
import { Button, Card, Space } from 'antd';
import { UnsupportedState } from '@/shared/ui/UnsupportedState';
import type { useTicketCommands } from '../hooks/useTicketCommands';
import { TicketResolveDialog } from './TicketResolveDialog';

export function TicketCommandPanel({ commands }: { commands: ReturnType<typeof useTicketCommands> }) {
  const [resolveOpen, setResolveOpen] = useState(false);
  return <Card title="Hành động" data-ticket-id={commands.ticketId}>
    <UnsupportedState feature="Các thao tác xử lý ticket" />
    <Space direction="vertical">
      <Button disabled={!commands.eligible || !commands.capabilities.triage}>Phân loại</Button>
      <Button disabled={!commands.eligible || !commands.capabilities.assign}>Nhận xử lý</Button>
      <Button disabled={!commands.eligible || !commands.capabilities.start}>Bắt đầu xử lý</Button>
      <Button disabled={!commands.eligible || !commands.capabilities.requestInformation}>Yêu cầu thêm thông tin</Button>
      <Button disabled={!commands.eligible || !commands.capabilities.resolve} onClick={() => setResolveOpen(true)}>Giải quyết</Button>
    </Space>
    <TicketResolveDialog open={resolveOpen} onClose={() => setResolveOpen(false)} />
  </Card>;
}
