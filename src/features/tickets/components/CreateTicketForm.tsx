import { Button, Form, Input, Select } from 'antd';
import type { FormInstance } from 'antd';
import type { CreateTicketPayload } from '../model/ticket.types';
import { ticketCategoryLabels } from '../model/ticketCategories';
import { createTicketRules } from '../validation/createTicketRules';

interface CreateTicketFormProps {
  form: FormInstance<CreateTicketPayload>;
  pending: boolean;
  onSubmit: (payload: CreateTicketPayload) => Promise<void>;
  onCancel: () => void;
}

export function CreateTicketForm({ form, pending, onSubmit, onCancel }: CreateTicketFormProps) {
  return (
    <Form<CreateTicketPayload>
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      disabled={pending}
    >
      <Form.Item
        name="title"
        label={<span style={{ fontWeight: 600 }}>Tiêu đề yêu cầu <span className="meta">(bắt buộc)</span></span>}
        rules={createTicketRules.title}
        style={{ marginBottom: 16 }}
      >
        <Input placeholder="Mô tả tóm tắt sự cố" />
      </Form.Item>

      {/* No department is sent or known yet: the backend takes no department on create. */}
      <Form.Item
        name="categoryId"
        label={<span style={{ fontWeight: 600 }}>Danh mục sự cố</span>}
        rules={createTicketRules.categoryId}
        style={{ marginBottom: 16 }}
      >
        <Select
          options={Object.entries(ticketCategoryLabels).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </Form.Item>

      <Form.Item
        name="description"
        label={<span style={{ fontWeight: 600 }}>Mô tả chi tiết</span>}
        rules={createTicketRules.description}
        style={{ marginBottom: 8 }}
      >
        <Input.TextArea
          rows={5}
          placeholder="Mô tả cụ thể triệu chứng, thời điểm xảy ra và các bước đã thử..."
        />
      </Form.Item>
      <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 20 }}>
        Nên nêu thời điểm xảy ra lỗi và nội dung thông báo lỗi.
      </div>

      <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 8 }}>
        Bạn có thể đính kèm tệp (PDF, PNG, JPG, DOCX, TXT, ZIP, tối đa 10 MB) trong trang chi tiết sau khi gửi yêu cầu.
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
        <Button onClick={onCancel} style={{ borderRadius: 6 }}>
          Hủy
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={pending}
          style={{ borderRadius: 6, fontWeight: 500, minWidth: 120 }}
        >
          Gửi yêu cầu
        </Button>
      </div>
    </Form>
  );
}
