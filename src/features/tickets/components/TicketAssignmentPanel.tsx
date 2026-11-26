import { useState } from 'react';
import { Alert, Button, Card, Popconfirm, Select, Space, Tag, Typography } from 'antd';
import { ApartmentOutlined, SwapOutlined, UserAddOutlined, UserDeleteOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { useAuth } from '@/features/auth';
import type { TicketDto } from '../model/ticket.types';
import { agentName, assignmentLabel } from '../model/assignment';
import { canAssignTicket, canSelfAssignTicket, canTransferTicketTeam, canUnassignTicket } from '../model/ticketPermissions';
import { getSupportTeam } from '../model/supportTeams';
import { useAgentDirectory } from '../hooks/useAgentDirectory';
import { useStaffDirectory } from '../hooks/useStaffDirectory';
import { useAssignTicket } from '../hooks/useAssignTicket';
import { useUnassignTicket } from '../hooks/useUnassignTicket';
import { useTicketStateWritePending } from '../hooks/useTicketStateWritePending';
import { describeTicketError } from '../lib/ticketErrorMessage';
import { TicketTransferDialog } from './TicketTransferDialog';

interface TicketAssignmentPanelProps {
  ticket: TicketDto;
  onReload: () => void;
}

const assignmentMessages = {
  400: 'Không thể thay đổi phân công: kỹ thuật viên không hợp lệ hoặc ticket đã được người khác cập nhật. Hãy tải lại để xem trạng thái mới nhất.',
};

export function TicketAssignmentPanel({ ticket, onReload }: TicketAssignmentPanelProps) {
  const { user } = useAuth();
  // Who can be chosen comes from the agents; the name shown for the current holder may be an Admin's.
  const agents = useAgentDirectory();
  const staff = useStaffDirectory();
  const [chosenAgentId, setChosenAgentId] = useState<string>();
  const [transferOpen, setTransferOpen] = useState(false);
  const assignMutation = useAssignTicket(ticket.id);
  const unassignMutation = useUnassignTicket(ticket.id);
  // Also covers status writes from the other panel, so two state changes never overlap.
  const isPending = useTicketStateWritePending(ticket.id);
  const failedError = assignMutation.isError ? assignMutation.error : unassignMutation.isError ? unassignMutation.error : null;
  const failure = failedError ? describeTicketError(failedError, assignmentMessages) : null;

  const allowSelfAssign = canSelfAssignTicket(user, ticket);
  const allowUnassign = canUnassignTicket(user, ticket);
  const allowAssign = canAssignTicket(user, ticket);
  const allowTransfer = canTransferTicketTeam(user, ticket);
  const assigningTo = assignMutation.isPending ? assignMutation.variables?.agentId : undefined;
  const currentTeam = ticket.supportTeamId
    ? (getSupportTeam(ticket.supportTeamId) ?? { id: ticket.supportTeamId, name: ticket.supportTeamName ?? ticket.supportTeamId })
    : null;
  const currentTeamName = ticket.supportTeamName ?? (currentTeam ? currentTeam.name : 'Hàng đợi phân loại chung (Triage)');
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

      <div style={{ marginBottom: 12 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
          Đội hỗ trợ:
        </Typography.Text>
        <Tag color="geekblue" icon={<ApartmentOutlined />} style={{ marginTop: 2, padding: '2px 8px', fontSize: 13 }}>
          {currentTeamName}
        </Tag>
      </div>

      <Typography.Paragraph style={{ marginBottom: 12 }}>
        Phụ trách: <strong>{assignmentLabel(ticket, user?.userId, staff.data)}</strong>
      </Typography.Paragraph>

      <Space direction="vertical" style={{ width: '100%' }}>
        {allowTransfer && (
          <Button
            block
            icon={<SwapOutlined />}
            disabled={isPending}
            onClick={() => setTransferOpen(true)}
          >
            Điều phối / Chuyển đội
          </Button>
        )}
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

        {!allowSelfAssign && !allowUnassign && !allowAssign && !allowTransfer && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Không có thao tác phân công với trạng thái hiện tại và vai trò của bạn.
          </Typography.Text>
        )}
      </Space>

      <TicketTransferDialog
        open={transferOpen}
        ticket={ticket}
        onClose={() => setTransferOpen(false)}
        onReload={reload}
      />
    </Card>
  );
}
