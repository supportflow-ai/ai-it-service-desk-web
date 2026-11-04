import { Button, Form } from 'antd';
import type { FormInstance } from 'antd';
import type { CreateTicketPayload } from '../model/ticket.types';
import { AttachmentPicker } from './AttachmentPicker';
import { TicketFields } from './TicketFields';

interface CreateTicketFormProps {
  form: FormInstance<CreateTicketPayload>;
  pending: boolean;
  files: readonly File[];
  onFilesChange: (files: File[]) => void;
  onSubmit: (payload: CreateTicketPayload) => Promise<void>;
  onCancel: () => void;
}

export function CreateTicketForm({ form, pending, files, onFilesChange, onSubmit, onCancel }: CreateTicketFormProps) {
  return (
    <Form<CreateTicketPayload>
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      disabled={pending}
    >
      <TicketFields />
      <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 20 }}>
        Nên nêu thời điểm xảy ra lỗi và nội dung thông báo lỗi.
      </div>

      {/* PRD US-062: files can be chosen here; they are attached once the ticket exists. */}
      <AttachmentPicker files={files} onChange={onFilesChange} disabled={pending} />

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
