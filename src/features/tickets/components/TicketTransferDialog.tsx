import { useState } from 'react';
import { Alert, Button, Form, Input, Modal, Select, Space, Tag, Typography } from 'antd';
import { BulbOutlined, SwapOutlined } from '@ant-design/icons';
import type { TicketDto } from '../model/ticket.types';
import { ticketCategoryLabels } from '../model/ticketCategories';
import { getSupportTeam, suggestSupportTeamByCategory, SUPPORT_TEAMS } from '../model/supportTeams';
import { agentName } from '../model/assignment';
import { useAgentDirectory } from '../hooks/useAgentDirectory';
import { useTransferTicketTeam } from '../hooks/useTransferTicketTeam';
import { describeTicketError } from '../lib/ticketErrorMessage';

interface TicketTransferDialogProps {
  ticket: TicketDto;
  open: boolean;
  onClose: () => void;
  onReload: () => void;
}

interface TransferFormValues {
  targetTeamId: string;
  reason: string;
  newAssigneeId?: string;
}

const transferMessages = {
  400: 'Không thể chuyển đội: thông tin không hợp lệ hoặc ticket đã thay đổi. Hãy tải lại để xem trạng thái mới nhất.',
  403: 'Bạn không có quyền chuyển đội cho ticket này.',
};

export function TicketTransferDialog({ ticket, open, onClose, onReload }: TicketTransferDialogProps) {
  return (
    <Modal
      title={
        <Space>
          <SwapOutlined style={{ color: 'var(--primary, #1890ff)' }} />
          <span>Điều phối & Chuyển đội xử lý</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      destroyOnHidden
      footer={null}
      width={560}
    >
      <TicketTransferForm ticket={ticket} onClose={onClose} onReload={onReload} />
    </Modal>
  );
}

function TicketTransferForm({ ticket, onClose, onReload }: Omit<TicketTransferDialogProps, 'open'>) {
  const [form] = Form.useForm<TransferFormValues>();
  const agents = useAgentDirectory();
  const transferMutation = useTransferTicketTeam(ticket.id);

  const [base, setBase] = useState({ revision: ticket.revision, adoptReloaded: false });
  if (base.adoptReloaded && ticket.revision !== base.revision) {
    setBase({ revision: ticket.revision, adoptReloaded: false });
  }

  const failure = transferMutation.isError ? describeTicketError(transferMutation.error, transferMessages) : null;

  const currentTeam = ticket.supportTeamId
    ? (getSupportTeam(ticket.supportTeamId) ?? { id: ticket.supportTeamId, name: ticket.supportTeamName ?? ticket.supportTeamId })
    : null;
  const currentTeamName = ticket.supportTeamName ?? (currentTeam ? currentTeam.name : 'Hàng đợi phân loại chung (Triage)');

  const suggestedTeam = suggestSupportTeamByCategory(ticket.categoryId);
  const isAlreadyInSuggested = ticket.supportTeamId === suggestedTeam.id;

  const applySuggestedTeam = () => {
    form.setFieldsValue({ targetTeamId: suggestedTeam.id });
  };

  const handleFinish = (values: TransferFormValues) => {
    setBase((prev) => ({ ...prev, adoptReloaded: false }));
    transferMutation.mutate(
      {
        targetTeamId: values.targetTeamId,
        reason: values.reason.trim(),
        newAssigneeId: values.newAssigneeId || null,
        expectedRevision: base.revision,
      },
      {
        onSuccess: onClose,
      },
    );
  };

  const handleReload = () => {
    transferMutation.reset();
    setBase((prev) => ({ ...prev, adoptReloaded: true }));
    onReload();
  };

  const teamOptions = SUPPORT_TEAMS.map((team) => ({
    value: team.id,
    label: (
      <div>
        <div style={{ fontWeight: 500 }}>{team.name}</div>
        <div style={{ fontSize: 12, color: 'var(--tx-subtle, #888)' }}>{team.description}</div>
      </div>
    ),
    rawName: team.name,
    disabled: team.id === ticket.supportTeamId,
  }));

  const agentOptions = (agents.data ?? []).map((entry) => ({
    value: entry.userId,
    label: agentName(entry),
  }));

  return (
    <div style={{ paddingTop: 8 }}>
      {failure && (
        <Alert
          type="error"
          showIcon
          message={failure.message}
          action={failure.reloadable ? <Button size="small" onClick={handleReload}>Tải lại</Button> : undefined}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Thông tin đội hiện tại & Gợi ý định tuyến theo danh mục */}
      <div style={{ background: 'var(--sf-subtle, #f5f5f5)', padding: '10px 14px', borderRadius: 6, marginBottom: 16 }}>
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>Đội đang phụ trách: </Typography.Text>
            <Tag color="default" style={{ fontWeight: 500 }}>{currentTeamName}</Tag>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <Space size={6} wrap>
              <BulbOutlined style={{ color: '#faad14' }} />
              <Typography.Text style={{ fontSize: 13 }}>
                Gợi ý theo danh mục <strong>{ticketCategoryLabels[ticket.categoryId]}</strong>:
              </Typography.Text>
              <Tag color="cyan">{suggestedTeam.name}</Tag>
            </Space>
            {!isAlreadyInSuggested && (
              <Button size="small" type="link" onClick={applySuggestedTeam} style={{ padding: 0 }}>
                Áp dụng gợi ý
              </Button>
            )}
          </div>
        </Space>
      </div>

      <Form<TransferFormValues>
        form={form}
        layout="vertical"
        scrollToFirstError={{ focus: true }}
        disabled={transferMutation.isPending}
        initialValues={{
          targetTeamId: !isAlreadyInSuggested ? suggestedTeam.id : undefined,
        }}
        onFinish={handleFinish}
      >
        <Form.Item
          name="targetTeamId"
          label="Đội nhóm tiếp nhận"
          rules={[{ required: true, message: 'Vui lòng chọn đội nhóm tiếp nhận' }]}
        >
          <Select
            placeholder="Chọn đội nhóm tiếp nhận xử lý"
            options={teamOptions}
            optionLabelProp="rawName"
            style={{ width: '100%' }}
            aria-label="Đội nhóm tiếp nhận"
          />
        </Form.Item>

        <Form.Item
          name="reason"
          label="Lý do chuyển đội"
          rules={[
            { required: true, message: 'Vui lòng nhập lý do chuyển đội' },
            { min: 10, message: 'Lý do chuyển đội phải có ít nhất 10 ký tự' },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Mô tả lý do điều phối (ví dụ: Vấn đề vượt thẩm quyền L1, cần kỹ thuật viên mạng cấu hình lại switch/router...)"
            maxLength={1000}
            showCount
            aria-label="Lý do chuyển đội"
          />
        </Form.Item>

        <Form.Item
          name="newAssigneeId"
          label="Kỹ thuật viên phụ trách mới (Tùy chọn)"
          extra="Nếu để trống, ticket sẽ chuyển vào hàng đợi chưa phân công của đội mới."
        >
          <Select
            placeholder="Chọn kỹ thuật viên thuộc đội mới (tùy chọn)"
            allowClear
            showSearch
            optionFilterProp="label"
            loading={agents.isPending}
            options={agentOptions}
            style={{ width: '100%' }}
            aria-label="Kỹ thuật viên phụ trách mới"
          />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <Button onClick={onClose} disabled={transferMutation.isPending}>
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SwapOutlined />}
            loading={transferMutation.isPending}
            style={{ borderRadius: 6 }}
          >
            Xác nhận chuyển đội
          </Button>
        </div>
      </Form>
    </div>
  );
}
