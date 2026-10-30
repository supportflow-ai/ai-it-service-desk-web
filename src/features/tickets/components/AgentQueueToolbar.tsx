import { Button, Select, Space, Tooltip, Typography } from 'antd';
import type { AgentQueueFilters } from '../model/ticket.types';
import { agentQueueScopes, agentQueueStatusOptions } from '../model/agentQueue';
import { ticketCategoryLabels } from '../model/ticketCategories';
import { ticketStatusMeta } from '../model/ticketStatus';
import { TicketCategory } from '../model/ticket.types';

interface AgentQueueToolbarProps {
  filters: AgentQueueFilters;
  totalCount: number | undefined;
  onChange: (patch: Partial<Pick<AgentQueueFilters, 'scope' | 'status' | 'category'>>) => void;
}

const statusOptions = agentQueueStatusOptions.map((status) => ({ value: status, label: ticketStatusMeta[status].label }));
const categoryOptions = Object.values(TicketCategory).map((category) => ({ value: category, label: ticketCategoryLabels[category] }));

function tabStyle(active: boolean) {
  return {
    borderRadius: 0,
    borderBottom: active ? '2px solid var(--pr)' : '2px solid transparent',
    color: active ? 'var(--pr)' : 'var(--tx2)',
    fontWeight: 600,
    padding: '8px 16px',
    height: 'auto',
  };
}

export function AgentQueueToolbar({ filters, totalCount, onChange }: AgentQueueToolbarProps) {
  const activeScope = agentQueueScopes.find((item) => item.scope === filters.scope);
  return (
    <>
      <div role="tablist" aria-label="Phạm vi hàng đợi" style={{ display: 'flex', borderBottom: '1px solid var(--bd)', marginBottom: 8 }}>
        {agentQueueScopes.map(({ scope, label }) => {
          const active = scope === filters.scope;
          return (
            <Button
              key={scope}
              type="text"
              role="tab"
              aria-selected={active}
              onClick={() => onChange({ scope })}
              style={tabStyle(active)}
            >
              {label}{active && totalCount !== undefined ? ` (${totalCount})` : ''}
            </Button>
          );
        })}
      </div>
      {activeScope && (
        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 12 }}>
          {activeScope.description}
        </Typography.Text>
      )}

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          aria-label="Trạng thái"
          allowClear
          virtual={false}
          placeholder="Trạng thái: Tất cả"
          style={{ width: 180 }}
          value={filters.status ?? undefined}
          options={statusOptions}
          onChange={(value?: AgentQueueFilters['status']) => onChange({ status: value ?? null })}
        />
        <Select
          aria-label="Danh mục"
          allowClear
          virtual={false}
          placeholder="Danh mục: Tất cả"
          style={{ width: 220 }}
          value={filters.category ?? undefined}
          options={categoryOptions}
          onChange={(value?: AgentQueueFilters['category']) => onChange({ category: value ?? null })}
        />
        <Tooltip title="Chưa hỗ trợ: ticket chưa có trường ưu tiên trong hệ thống.">
          <Select aria-label="Ưu tiên" disabled placeholder="Ưu tiên: chưa hỗ trợ" style={{ width: 180 }} />
        </Tooltip>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Sắp xếp: mới tạo trước</Typography.Text>
      </Space>
    </>
  );
}
