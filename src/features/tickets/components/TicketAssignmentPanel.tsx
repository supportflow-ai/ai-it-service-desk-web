import { Alert, Button, Card, Popconfirm, Select, Space, Typography } from 'antd';
import { UserAddOutlined, UserDeleteOutlined } from '@ant-design/icons';
import { useAuth } from '@/features/auth';
import type { TicketDto } from '../model/ticket.types';
import { assignmentLabel } from '../model/assignment';
import { canSelfAssignTicket, canUnassignTicket } from '../model/ticketPermissions';
import { useAssignTicket } from '../hooks/useAssignTicket';
import { useUnassignTicket } from '../hooks/useUnassignTicket';
import { useTicketStateWritePending } from '../hooks/useTicketStateWritePending';
import { describeTicketError } from '../lib/ticketErrorMessage';

interface TicketAssignmentPanelProps {
  ticket: TicketDto;
  onReload: () => void;
}

const assignmentMessages = {
  400: 'Không thể thay đổi phân công: ticket có thể đã được người khác cập nhật. Hãy tải lại để xem trạng thái mới nhất.',
};

export function TicketAssignmentPanel({ ticket, onReload }: TicketAssignmentPanelProps) {
  const { user } = useAuth();
  const assignMutation = useAssignTicket(ticket.id);
  const unassignMutation = useUnassignTicket(ticket.id);
  // Also covers status writes from the other panel, so two state changes never overlap.
  const isPending = useTicketStateWritePending(ticket.id);
  const failedError = assignMutation.isError ? assignMutation.error : unassignMutation.isError ? unassignMutation.error : null;
  const failure = failedError ? describeTicketError(failedError, assignmentMessages) : null;

  const allowSelfAssign = canSelfAssignTicket(user, ticket);
  const allowUnassign = canUnassignTicket(user, ticket);

  // Both carry the revision on screen, so a ticket changed by someone else meanwhile is rejected (409).
  const selfAssign = () => {
    if (!user) return;
    unassignMutation.reset();
    assignMutation.mutate({ agentId: user.userId, expectedRevision: ticket.revision });
  };
  const unassign = () => {
    assignMutation.reset();
    unassignMutation.mutate(ticket.revision);
  };
  // Reloading shows the current ticket, so the error about the old copy no longer applies.
  const reload = () => {
    assignMutation.reset();
    unassignMutation.reset();
    onReload();
  };

  return (
    <Card title="Phân công" size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
      {failure && (
        <Alert
          type="error"
          showIcon
          message={failure.message}
          action={failure.reloadable ? <Button size="small" onClick={reload}>Tải lại</Button> : undefined}
          style={{ marginBottom: 12 }}
        />
      )}

      <Typography.Paragraph style={{ marginBottom: 12 }}>
        Phụ trách: <strong>{assignmentLabel(ticket, user?.userId)}</strong>
      </Typography.Paragraph>

      <Space direction="vertical" style={{ width: '100%' }}>
        {allowSelfAssign && (
          <Button type="primary" block icon={<UserAddOutlined />} loading={assignMutation.isPending} disabled={isPending} onClick={selfAssign}>
            Nhận về tôi
          </Button>
        )}
        {allowUnassign && (
          <Popconfirm
            title="Hủy phân công ticket này?"
            description="Ticket sẽ quay lại hàng đợi chưa phân công."
            okText="Xác nhận hủy phân công"
            cancelText="Không"
            onConfirm={unassign}
          >
            <Button block icon={<UserDeleteOutlined />} loading={unassignMutation.isPending} disabled={isPending}>
              Hủy phân công
            </Button>
          </Popconfirm>
        )}
        {!allowSelfAssign && !allowUnassign && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Không có thao tác phân công với trạng thái hiện tại và vai trò của bạn.
          </Typography.Text>
        )}

        {/* No agent directory endpoint exists, so choosing another agent stays locked. */}
        <Select aria-label="Giao cho kỹ thuật viên khác" disabled placeholder="Giao cho kỹ thuật viên khác" style={{ width: '100%' }} />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Chưa hỗ trợ chọn kỹ thuật viên khác: hệ thống chưa có danh sách kỹ thuật viên.
        </Typography.Text>
      </Space>
    </Card>
  );
}
