import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../../tests/mocks/server';
import type { TicketAIAnalysisResponse } from '../model/ai.types';
import { aiApi } from './aiApi';

const mockResponse: TicketAIAnalysisResponse = {
  result: {
    outcome: 'Success',
    suggestedCategory: 'NET',
    suggestedImpact: 'Medium',
    suggestedUrgency: 'High',
    categoryScore: 0.85,
    impactScore: 0.65,
    urgencyScore: 0.9,
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
      modelScore: 0.85,
      decision: 'Pending',
      finalValue: null,
      reviewedBy: null,
      reviewedAt: null,
    },
  ],
  ticketRevision: 4,
  stale: false,
};

describe('aiApi', () => {
  it('fetches ticket AI analysis when endpoint returns 200', async () => {
    server.use(
      http.get('http://localhost/api/tickets/:id/ai-analysis', () => HttpResponse.json(mockResponse)),
    );

    const result = await aiApi.getTicketAIAnalysis('ticket-123');
    expect(result).toEqual(mockResponse);
    expect(result?.result.suggestedCategory).toBe('NET');
  });

  it('returns null gracefully when endpoint returns 404 (not enabled for ticket)', async () => {
    server.use(
      http.get('http://localhost/api/tickets/:id/ai-analysis', () => new HttpResponse(null, { status: 404 })),
    );

    const result = await aiApi.getTicketAIAnalysis('ticket-123');
    expect(result).toBeNull();
  });

  it('returns null gracefully when endpoint returns 501 (not implemented on backend)', async () => {
    server.use(
      http.get('http://localhost/api/tickets/:id/ai-analysis', () => new HttpResponse(null, { status: 501 })),
    );

    const result = await aiApi.getTicketAIAnalysis('ticket-123');
    expect(result).toBeNull();
  });

  it('submits suggestion review decision', async () => {
    let capturedBody: unknown;
    server.use(
      http.post('http://localhost/api/ai/suggestions/:id/decision', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );

    await aiApi.submitSuggestionDecision('sug-1', {
      decision: 'Accepted',
      ticketRevision: 4,
    });

    expect(capturedBody).toEqual({
      decision: 'Accepted',
      ticketRevision: 4,
    });
  });

  it('triggers ticket analysis', async () => {
    let called = false;
    server.use(
      http.post('http://localhost/api/tickets/:id/ai-analysis', () => {
        called = true;
        return HttpResponse.json({ success: true });
      }),
    );

    await aiApi.triggerTicketAnalysis('ticket-123');
    expect(called).toBe(true);
  });
});
