import { Table, Typography } from 'antd';
import { Link } from 'react-router-dom';
import type { PagedTicketResult, TicketDto } from '../model/ticket.types';
import { AGENT_QUEUE_PAGE_SIZES } from '../model/agentQueue';
import { ticketCategoryLabels } from '../model/ticketCategories';
import { workspaceTicketPath } from '../lib/agentQueueSearch';
import type { QueueReturnState } from '../lib/agentQueueSearch';
import { TicketStatusTag } from './TicketStatusTag';

interface AgentQueueTableProps {
  result: PagedTicketResult | undefined;
  loading: boolean;
  page: number;
  pageSize: number;
  returnState: QueueReturnState;
  onPageChange: (page: number, pageSize: number) => void;
  onOpen: (ticket: TicketDto) => void;
}

function formatCreatedAt(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function AgentQueueTable({ result, loading, page, pageSize, returnState, onPageChange, onOpen }: AgentQueueTableProps) {
  return (
    <Table<TicketDto>
      rowKey="id"
      size="middle"
      dataSource={result?.items ?? []}
      loading={loading}
      locale={{ emptyText: 'Không có ticket nào phù hợp với bộ lọc.' }}
      onRow={(ticket) => ({
        // The ticket link handles its own clicks (including opening in a new tab).
        onClick: (event) => {
          if (event.target instanceof Element && event.target.closest('a')) return;
          onOpen(ticket);
        },
        style: { cursor: 'pointer' },
      })}
      columns={[
        {
          title: 'Mã',
          key: 'number',
          width: 140,
          render: (_, ticket) => (
            <Link className="mono" to={workspaceTicketPath(ticket.id)} state={returnState} aria-label={`Mở ticket ${ticket.ticketNumber}`}>
              {ticket.ticketNumber}
            </Link>
          ),
        },
        {
          title: 'Tiêu đề',
          key: 'title',
          render: (_, ticket) => (
            <>
              <div style={{ fontWeight: 600, color: 'var(--tx)' }}>{ticket.title}</div>
              <Typography.Text type="secondary" ellipsis style={{ fontSize: 12, maxWidth: 420 }}>
                {ticket.description}
              </Typography.Text>
            </>
          ),
        },
        { title: 'Danh mục', key: 'category', render: (_, ticket) => ticketCategoryLabels[ticket.categoryId] },
        { title: 'Trạng thái', key: 'status', render: (_, ticket) => <TicketStatusTag status={ticket.status} /> },
        { title: 'Ngày tạo', key: 'created', align: 'right', render: (_, ticket) => formatCreatedAt(ticket.createdAt) },
      ]}
      pagination={{
        current: page,
        pageSize,
        total: result?.totalCount ?? 0,
        showSizeChanger: true,
        pageSizeOptions: [...AGENT_QUEUE_PAGE_SIZES],
        showTotal: (total, [from, to]) => `${from}–${to} trên ${total} ticket`,
        onChange: onPageChange,
      }}
    />
  );
}
