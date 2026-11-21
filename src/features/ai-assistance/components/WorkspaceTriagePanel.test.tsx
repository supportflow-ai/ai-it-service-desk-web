import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';
import { server } from '../../../../tests/mocks/server';
import { createTestWrapper } from '../../../../tests/render';
import type { TicketAIAnalysisResponse } from '../model/ai.types';
import { WorkspaceTriagePanel } from './WorkspaceTriagePanel';

const mockAnalysis: TicketAIAnalysisResponse = {
  result: {
    outcome: 'Success',
    suggestedCategory: 'NET',
    suggestedImpact: 'Low',
    suggestedUrgency: 'Medium',
    categoryScore: 0.9,
    impactScore: 0.7,
    urgencyScore: 0.8,
    categoryConfidence: 'High',
    impactConfidence: 'Medium',
    urgencyConfidence: 'High',
    requiresManualTriage: false,
    failureReason: null,
    validationErrors: [],
  },
  suggestions: [
    {
      id: 'sug-1',
      analysisId: 'ana-1',
      type: 'Category',
      suggestedValue: 'NET',
      modelScore: 0.9,
      decision: 'Pending',
      finalValue: null,
      reviewedBy: null,
      reviewedAt: null,
    },
  ],
  ticketRevision: 5,
  stale: false,
};

it('shows the not-enabled state without calling any AI endpoint', () => {
  // The test server fails on any unhandled request, so rendering proves no HTTP is sent.
  const { Wrapper } = createTestWrapper();
  render(<WorkspaceTriagePanel ticketId="10000000-0000-0000-0000-000000000001" onTicketChanged={() => {}} />, { wrapper: Wrapper });
  expect(screen.getByText('Gợi ý AI chưa được bật cho ticket này.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Chấp nhận|Accept/ })).not.toBeInTheDocument();
});

it('fetches and renders AI suggestions when enabled', async () => {
  server.use(
    http.get('http://localhost/api/tickets/:id/ai-analysis', () => HttpResponse.json(mockAnalysis)),
  );

  const { Wrapper } = createTestWrapper();
  render(<WorkspaceTriagePanel ticketId="10000000-0000-0000-0000-000000000001" onTicketChanged={() => {}} enabled={true} />, { wrapper: Wrapper });

  const matches = await screen.findAllByText('Mạng & Wi-Fi');
  expect(matches.length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: 'Chấp nhận' })).toBeInTheDocument();
});

it('submits decision and triggers onTicketChanged when agent accepts a suggestion', async () => {
  let submittedBody: unknown;
  const onTicketChanged = vi.fn();

  server.use(
    http.get('http://localhost/api/tickets/:id/ai-analysis', () => HttpResponse.json(mockAnalysis)),
    http.post('http://localhost/api/ai/suggestions/:id/decision', async ({ request }) => {
      submittedBody = await request.json();
      return HttpResponse.json({ success: true });
    }),
  );

  const { Wrapper } = createTestWrapper();
  render(<WorkspaceTriagePanel ticketId="10000000-0000-0000-0000-000000000001" onTicketChanged={onTicketChanged} enabled={true} />, { wrapper: Wrapper });

  const acceptBtn = await screen.findByRole('button', { name: 'Chấp nhận' });
  await userEvent.click(acceptBtn);

  await waitFor(() => {
    expect(submittedBody).toEqual({
      decision: 'Accepted',
      ticketRevision: 5,
    });
    expect(onTicketChanged).toHaveBeenCalled();
  });
});

it('shows stale warning and lets agent reanalyze', async () => {
  let reanalyzed = false;

  server.use(
    http.get('http://localhost/api/tickets/:id/ai-analysis', () => HttpResponse.json({ ...mockAnalysis, stale: true })),
    http.post('http://localhost/api/tickets/:id/ai-analysis', () => {
      reanalyzed = true;
      return HttpResponse.json({ success: true });
    }),
  );

  const { Wrapper } = createTestWrapper();
  render(<WorkspaceTriagePanel ticketId="10000000-0000-0000-0000-000000000001" onTicketChanged={() => {}} enabled={true} />, { wrapper: Wrapper });

  const reanalyzeBtn = await screen.findByRole('button', { name: 'Phân tích lại' });
  expect(screen.getByText('Gợi ý cũ')).toBeInTheDocument();
  await userEvent.click(reanalyzeBtn);

  await waitFor(() => {
    expect(reanalyzed).toBe(true);
  });
});
