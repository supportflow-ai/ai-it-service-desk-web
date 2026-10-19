import { Descriptions, Divider, Typography } from 'antd';
import type { TicketDto } from '../model/ticket.types';
import { ticketCategoryLabels } from '../model/ticketCategories';

export function TicketMetadata({ ticket }: { ticket: TicketDto }) {
  return <>
    <Descriptions bordered column={1} items={[
      { key: 'category', label: 'Danh mục', children: ticketCategoryLabels[ticket.categoryId] },
      { key: 'created', label: 'Ngày tạo', children: new Date(ticket.createdAt).toLocaleString('vi-VN') },
    ]} />
    <Divider>Mô tả chi tiết</Divider>
    <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</Typography.Paragraph>
  </>;
}
