import { useState } from 'react';
import { Button, Col, Form, Input, Row, Select } from 'antd';
import { CloseOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import type { CreateTicketPayload } from '../model/ticket.types';
import { ticketCategoryLabels } from '../model/ticketCategories';
import { createTicketRules } from '../validation/createTicketRules';



interface AttachmentItem {
  id: string;
  name: string;
  sizeInfo: string;
  status: 'uploaded' | 'uploading' | 'error';
  progress?: number;
  errorMessage?: string;
}

interface CreateTicketFormProps {
  form: FormInstance<CreateTicketPayload>;
  pending: boolean;
  onSubmit: (payload: CreateTicketPayload) => Promise<void>;
  onCancel: () => void;
}

export function CreateTicketForm({ form, pending, onSubmit, onCancel }: CreateTicketFormProps) {
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

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

      <Row gutter={16}>
        <Col xs={24} sm={12}>
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
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            label={<span style={{ fontWeight: 600 }}>Phòng ban</span>}
            style={{ marginBottom: 16 }}
          >
            <Input value="Phòng Công nghệ / Hà Nội" readOnly style={{ background: 'var(--sf2)' }} />
          </Form.Item>
        </Col>
      </Row>

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

      {/* Attachment Section */}
      {attachments.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
            Tệp đính kèm
          </div>

          <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 8, padding: '0 12px' }}>
            {attachments.map((att) => (
              <div key={att.id} className="att-row">
                <div className="att-grow">
                  <div style={{ fontWeight: 500, color: 'var(--tx)' }}>{att.name}</div>
                  <div style={{ fontSize: 12, color: att.status === 'error' ? 'var(--er)' : 'var(--tx3)' }}>
                    {att.sizeInfo}
                  </div>
                  {att.status === 'uploading' && (
                    <div className="att-prog">
                      <i style={{ width: `${att.progress ?? 50}%` }} />
                    </div>
                  )}
                </div>

                {att.status === 'error' && (
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => {}}
                    style={{ borderRadius: 4 }}
                  >
                    Thử lại
                  </Button>
                )}
                {att.status === 'uploading' ? (
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => removeAttachment(att.id)}
                    style={{ color: 'var(--tx2)' }}
                  >
                    Hủy
                  </Button>
                ) : (
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeAttachment(att.id)}
                    style={{ color: 'var(--tx2)' }}
                  >
                    Xóa
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
