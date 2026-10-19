import { Button, Form, Input, Select, Space } from 'antd';
import type { CreateTicketPayload } from '../model/ticket.types';
import { ticketCategoryLabels } from '../model/ticketCategories';
import { createTicketRules } from '../validation/createTicketRules';

export function CreateTicketForm({ pending, onSubmit, onCancel }: {
  pending: boolean; onSubmit: (payload: CreateTicketPayload) => Promise<void>; onCancel: () => void;
}) {
  return <Form<CreateTicketPayload> layout="vertical" onFinish={onSubmit} disabled={pending}>
    <Form.Item name="title" label="Tiêu đề yêu cầu" rules={createTicketRules.title}><Input /></Form.Item>
    <Form.Item name="categoryId" label="Danh mục sự cố" rules={createTicketRules.categoryId}>
      <Select options={Object.entries(ticketCategoryLabels).map(([value, label]) => ({ value, label }))} />
    </Form.Item>
    <Form.Item name="description" label="Mô tả chi tiết" rules={createTicketRules.description}><Input.TextArea rows={6} /></Form.Item>
    <Space><Button onClick={onCancel}>Hủy</Button><Button type="primary" htmlType="submit" loading={pending}>Gửi yêu cầu</Button></Space>
  </Form>;
}
