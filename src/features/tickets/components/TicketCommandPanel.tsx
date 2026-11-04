import { useState } from 'react';
import { Alert, Button, Card, Popconfirm, Space, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, RollbackOutlined, StopOutlined, UserAddOutlined } from '@ant-design/icons';
import { useAuth } from '@/features/auth';
import type { TicketDto } from '../model/ticket.types';
import {
  canCancelTicket,
  canClaimTicket,
  canCloseTicket,
  canReopenTicket,
  canResolveTicket,
} from '../model/ticketPermissions';
import type { TicketView } from '../model/ticketPermissions';
import { useCancelTicket } from '../hooks/useCancelTicket';
import { useClaimTicket } from '../hooks/useClaimTicket';
import { useCloseTicket } from '../hooks/useCloseTicket';
import { useReopenTicket } from '../hooks/useReopenTicket';
import { useResolveTicket } from '../hooks/useResolveTicket';
import { useTicketStateWritePending } from '../hooks/useTicketStateWritePending';
import { describeTicketError } from '../lib/ticketErrorMessage';
import { TicketResolveDialog } from './TicketResolveDialog';

interface TicketCommandPanelProps {
  ticket: TicketDto;
  onReload: () => void;
  /** The requester screen offers the owner's commands only; the workspace the staff commands. */
  view: TicketView;
}

const transitionMessages = {
  400: 'Không thể chuyển trạng thái: ticket có thể đã được người khác cập nhật. Hãy tải lại để xem trạng thái mới nhất.',
};

export function TicketCommandPanel({ ticket, onReload, view }: TicketCommandPanelProps) {
  const { user } = useAuth();
  const [resolveOpen, setResolveOpen] = useState(false);

  const claimMutation = useClaimTicket(ticket.id);
  const resolveMutation = useResolveTicket(ticket.id);
  const closeMutation = useCloseTicket(ticket.id);
  const reopenMutation = useReopenTicket(ticket.id);
  const cancelMutation = useCancelTicket(ticket.id);
  const mutations = [claimMutation, resolveMutation, closeMutation, reopenMutation, cancelMutation];

  // Also covers assignment writes from the other panel, so two state changes never overlap.
  const isPending = useTicketStateWritePending(ticket.id);
  const failed = mutations.find((mutation) => mutation.isError);
  const failure = failed ? describeTicketError(failed.error, transitionMessages) : null;

  // Only the latest command's outcome is shown, so earlier errors are cleared first. The command
  // carries the revision on screen, so a ticket changed by someone else meanwhile is rejected (409).
  const run = (target: typeof claimMutation, onSettled?: () => void) => {
    for (const mutation of mutations) if (mutation !== target) mutation.reset();
    target.mutate(ticket.revision, onSettled ? { onSettled } : undefined);
  };
  // Reloading shows the current ticket, so the error about the old copy no longer applies.
  const reload = () => {
    for (const mutation of mutations) mutation.reset();
    onReload();
  };

  const allowed = {
    claim: canClaimTicket(user, ticket, view),
    resolve: canResolveTicket(user, ticket, view),
    close: canCloseTicket(user, ticket, view),
    reopen: canReopenTicket(user, ticket, view),
    cancel: canCancelTicket(user, ticket, view),
  };
  const hasAction = Object.values(allowed).some(Boolean);

  return (
    <Card
      title="Thao tác xử lý"
      data-ticket-id={ticket.id}
      style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
    >
      {failure && (
        <Alert
          type="error"
          showIcon
          message={failure.message}
          action={failure.reloadable ? <Button size="small" onClick={reload}>Tải lại</Button> : undefined}
          style={{ marginBottom: 12 }}
        />
      )}

      {!hasAction && (
        <Typography.Text type="secondary">
          Không có thao tác nào khả dụng với trạng thái hiện tại và vai trò của bạn.
        </Typography.Text>
      )}

      <Space wrap>
        {allowed.claim && (
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            loading={claimMutation.isPending}
            disabled={isPending}
            onClick={() => run(claimMutation)}
            style={{ borderRadius: 6 }}
          >
            Nhận xử lý
          </Button>
        )}

        {allowed.resolve && (
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={resolveMutation.isPending}
            disabled={isPending}
            onClick={() => setResolveOpen(true)}
            style={{ borderRadius: 6, background: 'var(--ok)', borderColor: 'var(--ok)' }}
          >
            Giải quyết
          </Button>
        )}

        {allowed.close && (
          <Popconfirm
            title="Đóng yêu cầu này?"
            description="Bạn có chắc chắn muốn đóng hoàn tất yêu cầu này?"
            onConfirm={() => run(closeMutation)}
            okText="Xác nhận đóng"
            cancelText="Không"
          >
            <Button
              loading={closeMutation.isPending}
              disabled={isPending}
              icon={<CloseOutlined />}
              style={{ borderRadius: 6 }}
            >
              Đóng vé
            </Button>
          </Popconfirm>
        )}

        {allowed.reopen && (
          <Button
            loading={reopenMutation.isPending}
            disabled={isPending}
            icon={<RollbackOutlined />}
            onClick={() => run(reopenMutation)}
            style={{ borderRadius: 6 }}
          >
            Mở lại vé
          </Button>
        )}

        {allowed.cancel && (
          <Popconfirm
            title="Hủy yêu cầu này?"
            description="Yêu cầu đã hủy sẽ không được xử lý tiếp."
            onConfirm={() => run(cancelMutation)}
            okText="Xác nhận hủy"
            cancelText="Không"
          >
            <Button
              danger
              loading={cancelMutation.isPending}
              disabled={isPending}
              icon={<StopOutlined />}
              style={{ borderRadius: 6 }}
            >
              Hủy vé
            </Button>
          </Popconfirm>
        )}
      </Space>

      <TicketResolveDialog
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        // Closing on failure too keeps the error alert in the panel visible.
        onConfirm={() => run(resolveMutation, () => setResolveOpen(false))}
        loading={resolveMutation.isPending}
      />
    </Card>
  );
}
