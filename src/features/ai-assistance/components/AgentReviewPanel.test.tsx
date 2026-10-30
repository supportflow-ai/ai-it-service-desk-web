import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import type { AgentTriageView, SuggestionDto } from '../model/ai.types';
import { AgentReviewPanel } from './AgentReviewPanel';

const analysis: AgentTriageView = {
  outcome: 'Success', suggestedCategory: 'NET', suggestedImpact: 'Low', suggestedUrgency: 'Low',
  categoryScore: 0.8, impactScore: 0.7, urgencyScore: 0.7,
  categoryConfidence: 'High', impactConfidence: 'Medium', urgencyConfidence: 'Medium',
  requiresManualTriage: false, failureReason: null, validationErrors: [],
};
const suggestion: SuggestionDto = {
  id: 'suggestion-1', analysisId: 'analysis-1', type: 'Impact', suggestedValue: 'Low',
  modelScore: 0.7, decision: 'Pending', finalValue: null, reviewedBy: null, reviewedAt: null,
};

it.each([
  { revision: null, stale: false, manual: false },
  { revision: 12, stale: true, manual: false },
  { revision: 12, stale: false, manual: true },
])('disables decisions without an eligible current revision: %j', async ({ revision, stale, manual }) => {
  const onDecision = vi.fn(async () => {});
  const { Wrapper } = createTestWrapper();
  render(<AgentReviewPanel result={{ ...analysis, requiresManualTriage: manual }} ticketRevision={revision}
    stale={stale} suggestions={[suggestion]} onDecision={onDecision} />, { wrapper: Wrapper });
  expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Override' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
  expect(onDecision).not.toHaveBeenCalled();
});

it('sends the real revision and prevents another decision while pending', async () => {
  let release = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const onDecision = vi.fn(() => gate);
  const { Wrapper } = createTestWrapper();
  render(<AgentReviewPanel result={analysis} ticketRevision={17} suggestions={[suggestion]} onDecision={onDecision} />, { wrapper: Wrapper });
  await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
  expect(onDecision).toHaveBeenCalledExactlyOnceWith('suggestion-1', { decision: 'Accepted', ticketRevision: 17 });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Reject' })).toBeDisabled());
  await act(async () => { release(); await gate; });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Reject' })).toBeEnabled());
});

it('keeps override input and shows an error when the async decision fails', async () => {
  const onDecision = vi.fn(async () => { throw new Error('private server detail'); });
  const { Wrapper } = createTestWrapper();
  render(<AgentReviewPanel result={analysis} ticketRevision={23} suggestions={[suggestion]} onDecision={onDecision} />, { wrapper: Wrapper });
  await userEvent.click(screen.getByRole('button', { name: 'Override' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Final value' }), 'High');
  await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(onDecision).toHaveBeenCalledExactlyOnceWith('suggestion-1', { decision: 'Overridden', ticketRevision: 23, finalValue: 'High' });
  expect(await screen.findByRole('alert')).toHaveTextContent('Có lỗi xảy ra');
  expect(screen.getByRole('textbox', { name: 'Final value' })).toHaveValue('High');
  expect(screen.queryByText('private server detail')).not.toBeInTheDocument();
});

it('shows the existing final value separately and never enables terminal suggestions', () => {
  const { Wrapper } = createTestWrapper();
  render(<AgentReviewPanel result={analysis} ticketRevision={23}
    suggestions={[{ ...suggestion, finalValue: 'High', decision: 'Overridden' }]} />, { wrapper: Wrapper });
  expect(screen.getByText('Suggested:')).toBeInTheDocument();
  expect(screen.getByText('Final:')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
});

it('says when AI is not enabled for the ticket, and that manual work continues', () => {
  const { Wrapper } = createTestWrapper();
  render(<AgentReviewPanel result={null} ticketRevision={null} />, { wrapper: Wrapper });
  expect(screen.getByText('Gợi ý AI chưa được bật cho ticket này.')).toBeInTheDocument();
  expect(screen.getByText(/xử lý thủ công như bình thường/)).toBeInTheDocument();
});

it.each([
  ['Unavailable', 'Dịch vụ AI tạm thời không khả dụng.'],
  ['Timeout', 'AI phản hồi quá thời gian cho phép.'],
  ['InvalidResponse', 'Kết quả AI không hợp lệ nên đã bị loại.'],
  ['ValidationFailed', 'Kết quả AI không qua được kiểm tra nên đã bị loại.'],
] as const)('shows a fixed message for the %s outcome and never the provider reason', (outcome, message) => {
  const { Wrapper } = createTestWrapper();
  render(<AgentReviewPanel result={{ ...analysis, outcome, failureReason: 'provider stack trace' }} ticketRevision={1} />, { wrapper: Wrapper });
  expect(screen.getByText(message)).toBeInTheDocument();
  expect(screen.queryByText(/provider stack trace/)).not.toBeInTheDocument();
  expect(screen.queryByText('Danh mục')).not.toBeInTheDocument();
});

it('shows each suggestion with its confidence band and flags the ones that need review', () => {
  const { Wrapper } = createTestWrapper();
  render(<AgentReviewPanel result={{ ...analysis, suggestedUrgency: 'High', urgencyConfidence: 'Low', urgencyScore: 0.3 }}
    ticketRevision={1} />, { wrapper: Wrapper });
  expect(screen.getByText('Mạng & Wi-Fi')).toBeInTheDocument();
  expect(screen.getByText('Độ tin cậy: Cao')).toBeInTheDocument();
  expect(screen.getByText('Độ tin cậy: Thấp')).toBeInTheDocument();
  expect(screen.getAllByText('Cần xem xét')).toHaveLength(1);
  expect(screen.queryByText(/%/)).not.toBeInTheDocument();
});

it('warns about manual-only and stale results', () => {
  const onReanalyze = vi.fn();
  const { Wrapper } = createTestWrapper();
  render(<AgentReviewPanel result={{ ...analysis, requiresManualTriage: true }} ticketRevision={1} stale onReanalyze={onReanalyze} />, { wrapper: Wrapper });
  expect(screen.getByText('Cần phân loại thủ công')).toBeInTheDocument();
  expect(screen.getByText('Gợi ý cũ')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Phân tích lại' })).toBeInTheDocument();
});
