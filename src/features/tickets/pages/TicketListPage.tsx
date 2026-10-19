import { useState } from 'react';
import { Card, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useTickets } from '../hooks/useTickets';
import { TicketTable } from '../components/TicketTable';

export function TicketListPage() {
  const [paging, setPaging] = useState({ page: 1, pageSize: 10 });
  const tickets = useTickets(paging.page, paging.pageSize);
  return <Card>
    <Typography.Title level={2}>Yêu cầu hỗ trợ của tôi</Typography.Title>
    <Link to="/tickets/new">Tạo yêu cầu mới</Link>
    {tickets.error && <ErrorState error={tickets.error} onRetry={() => { void tickets.refetch(); }} />}
    {(!tickets.error || tickets.data) && <TicketTable result={tickets.data} loading={tickets.isFetching} {...paging} onPageChange={(page, pageSize) => {
      setPaging({ page: pageSize === paging.pageSize ? page : 1, pageSize });
    }} />}
  </Card>;
}
