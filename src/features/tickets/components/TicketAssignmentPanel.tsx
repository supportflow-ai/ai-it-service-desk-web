import { useState } from 'react';
import { Alert, Button, Card, Popconfirm, Select, Space, Typography } from 'antd';
import { UserAddOutlined, UserDeleteOutlined } from '@ant-design/icons';
import { useAuth } from '@/features/auth';
import { TicketStatus } from '../model/ticket.types';
import type { TicketDto } from '../model/ticket.types';
import { assignmentView } from '../model/assignment';
import { canSelfAssignTicket, canUnassignTicket } from '../model/ticketPermissions';
import { useAgents } from '../hooks/useAgents';
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
  const agents = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>();
  const assignMutation = useAssignTicket(ticket.id, ticket.revision);
  const unassignMutation = useUnassignTicket(ticket.id, ticket.revision);
  // Also covers status writes from the other panel, so two state changes never overlap.
  const isPending = useTicketStateWritePending(ticket.id) || !ticket.revision;
  const failedError = assignMutation.isError ? assignMutation.error : unassignMutation.isError ? unassignMutation.error : null;
  const failure = failedError ? describeTicketError(failedError, assignmentMessages) : null;

  const assignment = assignmentView(ticket.status, ticket.assignedToId);
  const allowSelfAssign = canSelfAssignTicket(user, ticket.status);
  const allowUnassign = canUnassignTicket(user, ticket.status, ticket.assignedToId);
  const canAssign = !!user?.roles.some((role) => role === 'Agent' || role === 'Admin') && ![TicketStatus.Closed, TicketStatus.Cancelled].includes(ticket.status);
  const assignee = agents.data?.find((agent) => agent.userId === ticket.assignedToId);
  const assignmentLabel = assignee?.fullName || assignee?.email || assignment.label;

  const selfAssign = () => {
    if (!user) return;
    unassignMutation.reset();
    assignMutation.mutate(user.userId);
  };
  const unassign = () => {
    assignMutation.reset();
    unassignMutation.mutate();
  };

  return (
    <Card title="Phân công" size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}>
      {!ticket.revision && <Alert type="warning" message="Cần tải lại ticket để lấy phiên bản hiện tại trước khi thao tác." />}
      {failure && (
        <Alert
          type="error"
          showIcon
          message={failure.message}
          action={failure.reloadable ? <Button size="small" onClick={onReload}>Tải lại</Button> : undefined}
          style={{ marginBottom: 12 }}
        />
      )}

      <Typography.Paragraph style={{ marginBottom: 12 }}>
        Phụ trách:{' '}
        {assignment.known ? <strong>{assignmentLabel}</strong> : <Typography.Text type="secondary">{assignment.label}</Typography.Text>}
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

        <Select aria-label="Giao cho kỹ thuật viên khác" placeholder="Giao cho kỹ thuật viên khác"
          value={selectedAgent} onChange={setSelectedAgent} loading={agents.isPending}
          disabled={!canAssign || isPending || agents.isError || !agents.data?.length}
          options={(agents.data ?? []).map((agent) => ({ value: agent.userId, label: agent.fullName || agent.email }))}
          style={{ width: '100%' }} />
        <Button disabled={!canAssign || isPending || !selectedAgent} loading={assignMutation.isPending}
          onClick={() => { if (selectedAgent) assignMutation.mutate(selectedAgent, { onSuccess: () => setSelectedAgent(undefined) }); }}>
          Xác nhận phân công
        </Button>
        {agents.isError && <Alert type="error" message="Không tải được danh sách kỹ thuật viên."
          action={<Button onClick={() => { void agents.refetch(); }}>Thử lại</Button>} />}
        {agents.isSuccess && agents.data.length === 0 && <Typography.Text type="secondary">Chưa có kỹ thuật viên trong danh sách.</Typography.Text>}
      </Space>
    </Card>
  );
}
