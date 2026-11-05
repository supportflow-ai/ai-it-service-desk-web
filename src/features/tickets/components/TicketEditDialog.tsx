import { useState } from 'react';
import { Alert, Button, Form, Modal } from 'antd';
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

export function TicketEditDialog({ ticket, open, onClose, onReload }: TicketEditDialogProps) {
  return (
    <Modal title="Sửa yêu cầu" open={open} onCancel={onClose} destroyOnHidden footer={null}>
      <TicketEditForm ticket={ticket} onClose={onClose} onReload={onReload} />
    </Modal>
  );
}

/**
 * Mounted afresh on every opening, so it starts from the ticket as loaded then. It saves with the
 * revision that content is based on: a change made meanwhile is refused (409), not overwritten.
 */
function TicketEditForm({ ticket, onClose, onReload }: Omit<TicketEditDialogProps, 'open'>) {
  const [form] = Form.useForm<UpdateTicketPayload>();
  const update = useUpdateTicket(ticket.id);
  // A background refetch (e.g. on window focus) must not move the base revision, or a save would
  // silently overwrite someone else's change. Only the reload the user asks for after a conflict
  // does; the typed changes are kept for that next save.
  const [base, setBase] = useState({ revision: ticket.revision, adoptReloaded: false });
  if (base.adoptReloaded && ticket.revision !== base.revision) {
    setBase({ revision: ticket.revision, adoptReloaded: false });
  }
  const failure = update.isError ? describeTicketError(update.error, editMessages) : null;

  const save = (payload: UpdateTicketPayload) => {
    setBase((value) => ({ ...value, adoptReloaded: false }));
    update.mutate({ payload, expectedRevision: base.revision }, { onSuccess: onClose });
  };
  const reload = () => {
    update.reset();
    setBase((value) => ({ ...value, adoptReloaded: true }));
    onReload();
  };

  return (
    <>
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={update.isPending} style={{ borderRadius: 6 }}>
            Lưu thay đổi
          </Button>
        </div>
      </Form>
    </>
  );
}
