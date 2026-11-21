import { lazy, Suspense } from 'react';
import type { TicketCategory } from '@/features/tickets';

const RequesterDraftTriagePanel = lazy(() =>
  import('@/features/ai-assistance').then((feature) => ({ default: feature.RequesterDraftTriagePanel })),
);

interface CreateTicketAiPanelProps {
  title?: string;
  description?: string;
  selectedCategory?: string;
  onApplyCategory: (category: TicketCategory) => void;
}

export function CreateTicketAiPanel({
  title,
  description,
  selectedCategory,
  onApplyCategory,
}: CreateTicketAiPanelProps) {
  return (
    <Suspense fallback={null}>
      <RequesterDraftTriagePanel
        title={title}
        description={description}
        selectedCategory={selectedCategory}
        onApplyCategory={onApplyCategory}
      />
    </Suspense>
  );
}
