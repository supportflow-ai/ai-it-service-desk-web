import { Alert, Button, Form, Modal, Space } from 'antd';
import type { TicketDto, UpdateTicketPayload } from '../model/ticket.types';
import { useUpdateTicket } from '../hooks/useUpdateTicket';
import { describeTicketError } from '../lib/ticketErrorMessage';
import { TicketFields } from './TicketFields';

interface TicketEditDialogProps {
  ticket: TicketDto;
  open: boolean;
  onClose: () => void;
  onReload: () => void;
}

const editMessages = {
  400: 'Không lưu được: ticket có thể vừa được tiếp nhận nên không còn sửa được. Hãy tải lại để xem trạng thái mới nhất.',
};

/**
 * Opens on the ticket as last loaded and saves with its revision, so a change made meanwhile is
 * refused (409) instead of overwritten. Typed changes stay in the form across a reload; the next
 * save then carries the new revision.
 */
export function TicketEditDialog({ ticket, open, onClose, onReload }: TicketEditDialogProps) {
  const [form] = Form.useForm<UpdateTicketPayload>();
  const update = useUpdateTicket(ticket.id);
  const failure = update.isError ? describeTicketError(update.error, editMessages) : null;

  const close = () => {
    update.reset();
    onClose();
  };
  const save = (payload: UpdateTicketPayload) => {
    update.mutate({ payload, expectedRevision: ticket.revision }, { onSuccess: close });
  };
  const reload = () => {
    update.reset();
    onReload();
  };

  return (
    <Modal
      title="Sửa yêu cầu"
      open={open}
      onCancel={close}
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={close} disabled={update.isPending}>Hủy</Button>
          <Button type="primary" loading={update.isPending} onClick={() => form.submit()} style={{ borderRadius: 6 }}>
            Lưu thay đổi
          </Button>
        </Space>
      }
    >
      {failure && (
        <Alert
          type="error"
          showIcon
          message={failure.message}
          action={failure.reloadable ? <Button size="small" onClick={reload}>Tải lại</Button> : undefined}
          style={{ marginBottom: 12 }}
        />
      )}
      <Form<UpdateTicketPayload>
        form={form}
        layout="vertical"
        disabled={update.isPending}
        initialValues={{ title: ticket.title, categoryId: ticket.categoryId, description: ticket.description }}
        onFinish={save}
      >
        <TicketFields />
      </Form>
    </Modal>
  );
}
