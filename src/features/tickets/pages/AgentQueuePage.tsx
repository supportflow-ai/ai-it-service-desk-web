import { Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { normalizeError } from '@/shared/api/httpError';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useAgentQueue } from '../hooks/useAgentQueue';
import { useAgentQueueFilters } from '../hooks/useAgentQueueFilters';
import { AgentQueueToolbar } from '../components/AgentQueueToolbar';
import { AgentQueueTable } from '../components/AgentQueueTable';
import { workspaceTicketPath } from '../lib/agentQueueSearch';
import type { QueueReturnState } from '../lib/agentQueueSearch';
import type { AgentQueueFilters } from '../model/ticket.types';

export function AgentQueuePage() {
  const navigate = useNavigate();
  const { filters, setFilters, search } = useAgentQueueFilters();
  const queue = useAgentQueue(filters);
  const errorStatus = queue.error ? normalizeError(queue.error).status : undefined;
  // 403/404 means the queue is no longer ours to show, even if an older page is cached.
  const result = errorStatus === 403 || errorStatus === 404 ? undefined : queue.data;
  const returnState: QueueReturnState = { queueSearch: search };

  // Any filter change starts again from the first page.
  const changeFilters = (patch: Partial<AgentQueueFilters>) => setFilters({ ...filters, ...patch, page: 1 });

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      <Typography.Title level={2} style={{ margin: '0 0 12px', fontWeight: 700 }}>
        Hàng đợi xử lý
      </Typography.Title>

      <AgentQueueToolbar filters={filters} totalCount={result?.totalCount} onChange={changeFilters} />

      {queue.error && (
        <div style={{ marginBottom: 12 }}>
          <ErrorState error={queue.error} onRetry={() => { void queue.refetch(); }} />
        </div>
      )}

      <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 8, borderColor: 'var(--bd)', overflow: 'hidden' }}>
        <AgentQueueTable
          result={result}
          loading={queue.isFetching}
          page={filters.page}
          pageSize={filters.pageSize}
          returnState={returnState}
          onPageChange={(page, pageSize) => setFilters({ ...filters, page: pageSize === filters.pageSize ? page : 1, pageSize })}
          onOpen={(ticket) => navigate(workspaceTicketPath(ticket.id), { state: returnState })}
        />
      </Card>
    </div>
  );
}
