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
      title="Giải quyết ticket"
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
      <p>Bạn đã xử lý xong sự cố này và muốn chuyển ticket sang trạng thái <b>Đã giải quyết</b>?</p>
    </Modal>
  );
}
