export const aiQueryKeys = {
  all: ['ai-assistance'] as const,
  ticketAnalysis: (ticketId: string) => [...aiQueryKeys.all, 'tickets', ticketId, 'analysis'] as const,
};
