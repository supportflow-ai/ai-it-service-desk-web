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

async function chooseOverride(value: string, reason: string) {
  await userEvent.click(screen.getByRole('button', { name: 'Chọn giá trị khác' }));
  await userEvent.click(screen.getByRole('combobox', { name: 'Giá trị thay thế' }));
  await userEvent.click(await screen.findByTitle(value));
  if (reason) await userEvent.type(screen.getByRole('textbox', { name: 'Lý do điều chỉnh' }), reason);
}

it.each([
  { revision: null, stale: false, manual: false, reason: /Chưa có revision/ },
  { revision: 12, stale: true, manual: false, reason: /Gợi ý đã cũ/ },
  { revision: 12, stale: false, manual: true, reason: /cần phân loại thủ công nên/ },
])('disables decisions and says why without an eligible current revision: %j', async ({ revision, stale, manual, reason }) => {
  const onDecision = vi.fn(async () => {});
  const { Wrapper } = createTestWrapper();
  render(<AgentReviewPanel result={{ ...analysis, requiresManualTriage: manual }} ticketRevision={revision}
    stale={stale} suggestions={[suggestion]} onDecision={onDecision} />, { wrapper: Wrapper });
  expect(screen.getByText(reason)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Chấp nhận' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Chọn giá trị khác' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Chấp nhận' }));
  expect(onDecision).not.toHaveBeenCalled();
});

it('locks decisions while no review API exists', () => {
  const { Wrapper } = createTestWrapper();
  render(<AgentReviewPanel result={analysis} ticketRevision={3} suggestions={[suggestion]} />, { wrapper: Wrapper });
  expect(screen.getByText(/chưa có API review gợi ý AI/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Chấp nhận' })).toBeDisabled();
});

it('sends the real revision, prevents another decision while pending, then refetches the ticket', async () => {
  let release = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const onDecision = vi.fn(() => gate);
  const onDecided = vi.fn();
  const { Wrapper } = createTestWrapper();
  render(<AgentReviewPanel result={analysis} ticketRevision={17} suggestions={[suggestion]} onDecision={onDecision} onDecided={onDecided} />, { wrapper: Wrapper });
  await userEvent.click(screen.getByRole('button', { name: 'Chấp nhận' }));
  expect(onDecision).toHaveBeenCalledExactlyOnceWith('suggestion-1', { decision: 'Accepted', ticketRevision: 17 });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Từ chối' })).toBeDisabled());
  expect(onDecided).not.toHaveBeenCalled();
  await act(async () => { release(); await gate; });
  await waitFor(() => expect(onDecided).toHaveBeenCalledOnce());
  expect(screen.getByRole('button', { name: 'Từ chối' })).toBeEnabled();
});

it('requires another value and a reason before overriding', async () => {
  const onDecision = vi.fn(async () => {});
  const { Wrapper } = createTestWrapper();
  render(<AgentReviewPanel result={analysis} ticketRevision={5} suggestions={[suggestion]} onDecision={onDecision} />, { wrapper: Wrapper });
  await userEvent.click(screen.getByRole('button', { name: 'Chọn giá trị khác' }));
  await userEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));
  expect(screen.getByText('Chọn giá trị thay thế.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('combobox', { name: 'Giá trị thay thế' }));
  expect(screen.queryByTitle('Thấp')).not.toBeInTheDocument();
  await userEvent.click(await screen.findByTitle('Cao'));
  await userEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));
  expect(screen.getByText('Nhập lý do điều chỉnh.')).toBeInTheDocument();
  expect(onDecision).not.toHaveBeenCalled();
});

it('keeps override input and shows an error when the async decision fails', async () => {
  const onDecision = vi.fn(async () => { throw new Error('private server detail'); });
  const { Wrapper } = createTestWrapper();
  render(<AgentReviewPanel result={analysis} ticketRevision={23} suggestions={[suggestion]} onDecision={onDecision} />, { wrapper: Wrapper });
  await chooseOverride('Cao', 'Ảnh hưởng cả phòng ban');
  await userEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));
  expect(onDecision).toHaveBeenCalledExactlyOnceWith('suggestion-1', {
    decision: 'Overridden', ticketRevision: 23, finalValue: 'High', reason: 'Ảnh hưởng cả phòng ban',
  });
  expect(await screen.findByRole('alert')).toHaveTextContent('Có lỗi xảy ra');
  expect(screen.getByRole('textbox', { name: 'Lý do điều chỉnh' })).toHaveValue('Ảnh hưởng cả phòng ban');
  expect(screen.getByRole('combobox', { name: 'Giá trị thay thế' }).closest('.ant-select')).toHaveTextContent('Cao');
  expect(screen.queryByText('private server detail')).not.toBeInTheDocument();
});

it('rejects only after confirmation', async () => {
  const onDecision = vi.fn(async () => {});
  const { Wrapper } = createTestWrapper();
  render(<AgentReviewPanel result={analysis} ticketRevision={8} suggestions={[suggestion]} onDecision={onDecision} />, { wrapper: Wrapper });
  await userEvent.click(screen.getByRole('button', { name: 'Từ chối' }));
  expect(onDecision).not.toHaveBeenCalled();
  await userEvent.click(await screen.findByRole('button', { name: 'Xác nhận từ chối' }));
  await waitFor(() => expect(onDecision).toHaveBeenCalledExactlyOnceWith('suggestion-1', { decision: 'Rejected', ticketRevision: 8 }));
});

it('shows the existing final value separately and offers no action on a decided suggestion', () => {
  const { Wrapper } = createTestWrapper();
  render(<AgentReviewPanel result={analysis} ticketRevision={23} onDecision={vi.fn(async () => {})}
    suggestions={[{ ...suggestion, finalValue: 'High', decision: 'Overridden' }]} />, { wrapper: Wrapper });
  expect(screen.getByText('Gợi ý:')).toBeInTheDocument();
  expect(screen.getByText('Giá trị cuối:')).toBeInTheDocument();
  expect(screen.getByText('Đã điều chỉnh')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Chấp nhận' })).not.toBeInTheDocument();
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
