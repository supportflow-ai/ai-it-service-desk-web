import { Button, Modal, Space } from 'antd';

export function TicketResolveDialog({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Modal
      title="Giải quyết Ticket"
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button type="primary" loading={loading} onClick={onConfirm} style={{ borderRadius: 6 }}>
            Xác nhận giải quyết
          </Button>
        </Space>
      }
    >
      <p>Bạn có chắc chắn đã hoàn tất xử lý sự cố này và muốn chuyển trạng thái vé sang <b>Đã giải quyết (Resolved)</b>?</p>
    </Modal>
  );
}
