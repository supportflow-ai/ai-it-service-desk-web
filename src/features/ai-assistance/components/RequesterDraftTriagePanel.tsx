import type { TicketCategory } from '@/features/tickets';
import { useRequesterDraftTriage } from '../hooks/useRequesterDraftTriage';
import { RequesterAIPanel } from './RequesterAIPanel';

interface RequesterDraftTriagePanelProps {
  title?: string;
  description?: string;
  selectedCategory?: string;
  onApplyCategory?: (category: TicketCategory) => void;
  enabled?: boolean;
}

export function RequesterDraftTriagePanel({
  title = '',
  description = '',
  selectedCategory,
  onApplyCategory,
  enabled = true,
}: RequesterDraftTriagePanelProps) {
  const { data, isLoading } = useRequesterDraftTriage({ title, description, enabled });

  return (
    <RequesterAIPanel
      result={data ?? null}
      loading={isLoading}
      selectedCategory={selectedCategory}
      onApplyCategory={onApplyCategory}
    />
  );
}
