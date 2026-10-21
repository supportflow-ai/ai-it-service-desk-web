import { useState } from 'react';
import { Button, Card, Space } from 'antd';
import { UnsupportedState } from '@/shared/ui/UnsupportedState';
import type { useTicketCommands } from '../hooks/useTicketCommands';
import { TicketResolveDialog } from './TicketResolveDialog';

export function TicketCommandPanel({ commands }: { commands: ReturnType<typeof useTicketCommands> }) {
  const [resolveOpen, setResolveOpen] = useState(false);

  return (
    <Card
      title="Thao tác xử lý"
      data-ticket-id={commands.ticketId}
      style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
    >
      <div style={{ marginBottom: 12 }}>
        <UnsupportedState feature="Các thao tác xử lý ticket" />
      </div>

      <Space wrap>
        <Button
          disabled={!commands.eligible || !commands.capabilities.triage}
          style={{ borderRadius: 6 }}
        >
          Phân loại
        </Button>
        <Button
          disabled={!commands.eligible || !commands.capabilities.assign}
          style={{ borderRadius: 6 }}
        >
          Nhận xử lý
        </Button>
        <Button
          disabled={!commands.eligible || !commands.capabilities.start}
          style={{ borderRadius: 6 }}
        >
          Bắt đầu xử lý
        </Button>
        <Button
          disabled={!commands.eligible || !commands.capabilities.requestInformation}
          style={{ borderRadius: 6 }}
        >
          Yêu cầu thêm thông tin
        </Button>
        <Button
          type="primary"
          disabled={!commands.eligible || !commands.capabilities.resolve}
          onClick={() => setResolveOpen(true)}
          style={{ borderRadius: 6 }}
        >
          Giải quyết
        </Button>
      </Space>

      <TicketResolveDialog open={resolveOpen} onClose={() => setResolveOpen(false)} />
    </Card>
  );
}
