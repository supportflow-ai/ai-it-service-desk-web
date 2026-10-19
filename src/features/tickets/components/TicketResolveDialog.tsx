import { Modal } from 'antd';
import { UnsupportedState } from '@/shared/ui/UnsupportedState';

export function TicketResolveDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <Modal title="Giải quyết Ticket" open={open} onCancel={onClose} footer={null}>
    <UnsupportedState feature="Giải quyết ticket" />
  </Modal>;
}
