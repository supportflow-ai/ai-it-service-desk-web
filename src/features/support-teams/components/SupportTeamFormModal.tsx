import { useEffect } from 'react';
import { Alert, Button, Form, Input, Modal, Select } from 'antd';
import { useUsers } from '@/features/auth';
import { TicketCategory, ticketCategoryLabels } from '@/features/tickets';
import type { CreateSupportTeamPayload, SupportTeamDto, UpdateSupportTeamPayload } from '../model/supportTeam.types';
import { useCreateSupportTeam } from '../hooks/useCreateSupportTeam';
import { useUpdateSupportTeam } from '../hooks/useUpdateSupportTeam';
import { normalizeError } from '@/shared/api/httpError';

interface SupportTeamFormModalProps {
  open: boolean;
  team?: SupportTeamDto | null;
  onClose: () => void;
}

interface FormValues {
  name: string;
  code: string;
  description: string;
  leadId?: string;
  categories: TicketCategory[];
  status?: 'active' | 'inactive';
}

export function SupportTeamFormModal({ open, team, onClose }: SupportTeamFormModalProps) {
  const [form] = Form.useForm<FormValues>();
  const isEditing = Boolean(team);

  const agentsQuery = useUsers('Agent');
  const createMutation = useCreateSupportTeam();
  const updateMutation = useUpdateSupportTeam(team?.id ?? '');

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  useEffect(() => {
    if (open) {
      if (team) {
        form.setFieldsValue({
          name: team.name,
          code: team.code,
          description: team.description,
          leadId: team.leadId ?? undefined,
          categories: team.categories,
          status: team.status,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          categories: [],
          status: 'active',
        });
      }
    }
  }, [open, team, form]);

  const handleFinish = (values: FormValues) => {
    if (isEditing && team) {
      const payload: UpdateSupportTeamPayload = {
        name: values.name.trim(),
        description: values.description.trim(),
        leadId: values.leadId || null,
        categories: values.categories,
        status: values.status ?? 'active',
      };
      updateMutation.mutate(payload, {
        onSuccess: () => {
          onClose();
        },
      });
    } else {
      const payload: CreateSupportTeamPayload = {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        description: values.description.trim(),
        leadId: values.leadId || null,
        categories: values.categories,
      };
      createMutation.mutate(payload, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const agentOptions = (agentsQuery.data ?? []).map((agent) => ({
    value: agent.userId,
    label: agent.fullName ?? `Kỹ thuật viên (${agent.userId.slice(0, 8)})`,
  }));

  const categoryOptions = Object.values(TicketCategory).map((cat) => ({
    value: cat,
    label: `${ticketCategoryLabels[cat]} (${cat})`,
  }));

  return (
    <Modal
      title={isEditing ? `Chỉnh sửa: ${team?.name}` : 'Thêm đội nhóm hỗ trợ mới'}
      open={open}
      onCancel={onClose}
      destroyOnHidden
      footer={null}
      width={600}
    >
      {mutationError && (
        <Alert
          type="error"
          showIcon
          message={normalizeError(mutationError).message}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        disabled={isPending}
      >
        <Form.Item
          name="name"
          label="Tên đội nhóm"
          rules={[{ required: true, message: 'Vui lòng nhập tên đội nhóm' }]}
        >
          <Input placeholder="Ví dụ: Đội Mạng & Hạ tầng" />
        </Form.Item>

        <Form.Item
          name="code"
          label="Mã đội"
          rules={[
            { required: true, message: 'Vui lòng nhập mã đội' },
            { max: 10, message: 'Mã đội tối đa 10 ký tự' },
          ]}
        >
          <Input
            placeholder="Ví dụ: NET, L1, SW..."
            disabled={isEditing}
            style={{ textTransform: 'uppercase' }}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả phạm vi hỗ trợ"
          rules={[{ required: true, message: 'Vui lòng nhập mô tả phạm vi hỗ trợ' }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Mô tả trách nhiệm của đội, các loại sự cố và nghiệp vụ phụ trách..."
          />
        </Form.Item>

        <Form.Item
          name="leadId"
          label="Trưởng nhóm (Lead)"
          extra="Chỉ định kỹ thuật viên chịu trách nhiệm điều phối và quản lý thành viên đội."
        >
          <Select
            placeholder="Chọn trưởng nhóm (tùy chọn)"
            allowClear
            showSearch
            optionFilterProp="label"
            loading={agentsQuery.isPending}
            options={agentOptions}
          />
        </Form.Item>

        <Form.Item
          name="categories"
          label="Danh mục dịch vụ tiếp nhận tự động"
          extra="Khi phiếu tạo ra thuộc danh mục này, hệ thống sẽ tự động đề xuất chuyển về đội."
        >
          <Select
            mode="multiple"
            placeholder="Chọn các danh mục phiếu tiếp nhận"
            options={categoryOptions}
            allowClear
          />
        </Form.Item>

        {isEditing && (
          <Form.Item
            name="status"
            label="Trạng thái hoạt động"
          >
            <Select
              options={[
                { value: 'active', label: 'Đang hoạt động' },
                { value: 'inactive', label: 'Tạm ngừng tiếp nhận' },
              ]}
            />
          </Form.Item>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <Button onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={isPending} style={{ borderRadius: 6 }}>
            {isEditing ? 'Lưu thay đổi' : 'Tạo đội nhóm'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
