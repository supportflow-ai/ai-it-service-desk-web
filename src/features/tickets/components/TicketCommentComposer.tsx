import { Button, Card, Input, Space } from 'antd';
import { UnsupportedState } from '@/shared/ui/UnsupportedState';

export function TicketCommentComposer() {
  return <Card title="Bình luận và ghi chú">
    <UnsupportedState feature="Bình luận, ghi chú và tệp đính kèm" />
    <Input.TextArea aria-label="Nội dung trao đổi" disabled rows={3} />
    <Space wrap><Button disabled>Gửi bình luận</Button><Button disabled>Lưu ghi chú nội bộ</Button><Button disabled>Đính kèm file</Button></Space>
  </Card>;
}
