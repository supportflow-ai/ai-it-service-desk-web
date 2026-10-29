import { useState } from 'react';
import { Alert, Button, Card, Popconfirm, Space } from 'antd';
import { CheckOutlined, CloseOutlined, RollbackOutlined, UserAddOutlined } from '@ant-design/icons';
import type { useTicketCommands } from '../hooks/useTicketCommands';
import type { TicketDto } from '../model/ticket.types';
import {
  canClaimTicket,
  canCloseTicket,
  canReopenTicket,
  canResolveTicket,
} from '../model/ticketPermissions';
import { useClaimTicket } from '../hooks/useClaimTicket';
import { useCloseTicket } from '../hooks/useCloseTicket';
import { useReopenTicket } from '../hooks/useReopenTicket';
import { useResolveTicket } from '../hooks/useResolveTicket';
import { TicketResolveDialog } from './TicketResolveDialog';

interface TicketCommandPanelProps {
  ticket: TicketDto;
  commands: ReturnType<typeof useTicketCommands>;
}

export function TicketCommandPanel({ ticket, commands }: TicketCommandPanelProps) {
  const [resolveOpen, setResolveOpen] = useState(false);

  const claimMutation = useClaimTicket(ticket.id);
  const resolveMutation = useResolveTicket(ticket.id);
  const closeMutation = useCloseTicket(ticket.id);
  const reopenMutation = useReopenTicket(ticket.id);

  const isPending =
    claimMutation.isPending ||
    resolveMutation.isPending ||
    closeMutation.isPending ||
    reopenMutation.isPending;

  const error =
    claimMutation.error ||
    resolveMutation.error ||
    closeMutation.error ||
    reopenMutation.error;

  const handleClaim = async () => {
    await claimMutation.mutateAsync();
  };

  const handleResolve = async () => {
    await resolveMutation.mutateAsync();
    setResolveOpen(false);
  };

  const handleClose = async () => {
    await closeMutation.mutateAsync();
  };

  const handleReopen = async () => {
    await reopenMutation.mutateAsync();
  };

  return (
    <Card
      title="Thao tác xử lý"
      data-ticket-id={ticket.id}
      style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
    >
      {error && (
        <Alert
          type="error"
          showIcon
          message="Thao tác chuyển trạng thái thất bại. Vui lòng thử lại."
          style={{ marginBottom: 12 }}
        />
      )}

      <Space wrap>
        {canClaimTicket(ticket.status) && (
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            loading={claimMutation.isPending}
            disabled={!commands.eligible || isPending}
            onClick={handleClaim}
            style={{ borderRadius: 6 }}
          >
            Nhận xử lý
          </Button>
        )}

        {canResolveTicket(ticket.status) && (
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={resolveMutation.isPending}
            disabled={!commands.eligible || isPending}
            onClick={() => setResolveOpen(true)}
            style={{ borderRadius: 6, background: '#0F766E', borderColor: '#0F766E' }}
          >
            Giải quyết
          </Button>
        )}

        {canCloseTicket(ticket.status) && (
          <Popconfirm
            title="Đóng yêu cầu này?"
            description="Bạn có chắc chắn muốn đóng hoàn tất yêu cầu này?"
            onConfirm={handleClose}
            okText="Đóng vé"
            cancelText="Hủy"
          >
            <Button
              loading={closeMutation.isPending}
              disabled={!commands.eligible || isPending}
              icon={<CloseOutlined />}
              style={{ borderRadius: 6 }}
            >
              Đóng vé
            </Button>
          </Popconfirm>
        )}

        {canReopenTicket(ticket.status) && (
          <Button
            loading={reopenMutation.isPending}
            disabled={!commands.eligible || isPending}
            icon={<RollbackOutlined />}
            onClick={handleReopen}
            style={{ borderRadius: 6 }}
          >
            Mở lại vé
          </Button>
        )}
      </Space>

      <TicketResolveDialog
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        onConfirm={handleResolve}
        loading={resolveMutation.isPending}
      />
    </Card>
  );
}
