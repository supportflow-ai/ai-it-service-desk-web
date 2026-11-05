import { useState } from 'react';
import { Alert, Button, Card, Popconfirm, Select, Space, Typography } from 'antd';
import { UserAddOutlined, UserDeleteOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { useAuth } from '@/features/auth';
import type { TicketDto } from '../model/ticket.types';
import { agentName, assignmentLabel } from '../model/assignment';
import { canAssignTicket, canSelfAssignTicket, canUnassignTicket } from '../model/ticketPermissions';
import { useAgentDirectory } from '../hooks/useAgentDirectory';
import { useAssignTicket } from '../hooks/useAssignTicket';
import { useUnassignTicket } from '../hooks/useUnassignTicket';
import { useTicketStateWritePending } from '../hooks/useTicketStateWritePending';
import { describeTicketError } from '../lib/ticketErrorMessage';

interface TicketAssignmentPanelProps {
  ticket: TicketDto;
  onReload: () => void;
}

const assignmentMessages = {
  400: 'Không thể thay đổi phân công: kỹ thuật viên không hợp lệ hoặc ticket đã được người khác cập nhật. Hãy tải lại để xem trạng thái mới nhất.',
};

export function TicketAssignmentPanel({ ticket, onReload }: TicketAssignmentPanelProps) {
  const { user } = useAuth();
  const agents = useAgentDirectory();
  const [chosenAgentId, setChosenAgentId] = useState<string>();
  const assignMutation = useAssignTicket(ticket.id);
  const unassignMutation = useUnassignTicket(ticket.id);
  // Also covers status writes from the other panel, so two state changes never overlap.
  const isPending = useTicketStateWritePending(ticket.id);
  const failedError = assignMutation.isError ? assignMutation.error : unassignMutation.isError ? unassignMutation.error : null;
  const failure = failedError ? describeTicketError(failedError, assignmentMessages) : null;

  const allowSelfAssign = canSelfAssignTicket(user, ticket);
  const allowUnassign = canUnassignTicket(user, ticket);
  const allowAssign = canAssignTicket(user, ticket);
  const assigningTo = assignMutation.isPending ? assignMutation.variables?.agentId : undefined;
  const agentOptions = (agents.data ?? []).map((entry) => ({
    value: entry.userId,
    label: agentName(entry),
    disabled: entry.userId === ticket.assignedToId,
  }));

  // Both carry the revision on screen, so a ticket changed by someone else meanwhile is rejected (409).
  const selfAssign = () => {
    if (!user) return;
    unassignMutation.reset();
    assignMutation.mutate({ agentId: user.userId, expectedRevision: ticket.revision });
  };
  const assignChosen = () => {
    if (!chosenAgentId) return;
    unassignMutation.reset();
    assignMutation.mutate(
      { agentId: chosenAgentId, expectedRevision: ticket.revision },
      { onSuccess: () => setChosenAgentId(undefined) },
    );
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
        Phụ trách: <strong>{assignmentLabel(ticket, user?.userId, agents.data)}</strong>
      </Typography.Paragraph>

      <Space direction="vertical" style={{ width: '100%' }}>
        {allowSelfAssign && (
          <Button type="primary" block icon={<UserAddOutlined />} loading={!!user && assigningTo === user.userId} disabled={isPending} onClick={selfAssign}>
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
        {allowAssign && (
          <>
            <Select
              aria-label="Giao cho kỹ thuật viên"
              placeholder="Chọn kỹ thuật viên"
              showSearch
              optionFilterProp="label"
              virtual={false}
              loading={agents.isPending}
              disabled={isPending || !!agents.error}
              value={chosenAgentId}
              options={agentOptions}
              notFoundContent="Chưa có kỹ thuật viên nào."
              onChange={setChosenAgentId}
              style={{ width: '100%' }}
            />
            {agents.error && (
              <Typography.Text type="danger" style={{ fontSize: 12 }}>
                Không tải được danh sách kỹ thuật viên.
              </Typography.Text>
            )}
            <Button
              block
              icon={<UserSwitchOutlined />}
              loading={!!assigningTo && assigningTo === chosenAgentId}
              disabled={isPending || !chosenAgentId}
              onClick={assignChosen}
            >
              Giao việc
            </Button>
          </>
        )}

        {!allowSelfAssign && !allowUnassign && !allowAssign && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Không có thao tác phân công với trạng thái hiện tại và vai trò của bạn.
          </Typography.Text>
        )}
      </Space>
    </Card>
  );
}
