import { Table } from 'antd';
import { Link } from 'react-router-dom';
import type { PagedTicketResult } from '../model/ticket.types';
import { TicketStatusTag } from './TicketStatusTag';

export function TicketTable({ result, loading, page, pageSize, onPageChange }: {
  result: PagedTicketResult | undefined; loading: boolean; page: number; pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
}) {
  return <Table rowKey="id" dataSource={result?.items ?? []} loading={loading}
    locale={{ emptyText: 'Bạn chưa có ticket nào' }}
    columns={[
      { title: 'Mã Ticket', key: 'number', render: (_, ticket) => <Link to={`/requester-dashboard/tickets/${ticket.id}`}>{ticket.ticketNumber}</Link> },
      { title: 'Tiêu đề', dataIndex: 'title' },
      { title: 'Danh mục', dataIndex: 'categoryId' },
      { title: 'Trạng thái', key: 'status', render: (_, ticket) => <TicketStatusTag status={ticket.status} /> },
    ]}
    pagination={{ current: page, pageSize, total: result?.totalCount ?? 0, showSizeChanger: true, onChange: onPageChange }} />;
}
