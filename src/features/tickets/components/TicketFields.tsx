import { Form, Input, Select } from 'antd';
import { ticketCategoryLabels } from '../model/ticketCategories';
import { createTicketRules } from '../validation/createTicketRules';

const categoryOptions = Object.entries(ticketCategoryLabels).map(([value, label]) => ({ value, label }));

/** Title, category and description, validated like the backend Ticket.Create and Ticket.Update. */
export function TicketFields() {
  return (
    <>
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
        {/* Eleven options: a plain list keeps every one reachable without scrolling a virtual list. */}
        <Select virtual={false} options={categoryOptions} />
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
    </>
  );
}
