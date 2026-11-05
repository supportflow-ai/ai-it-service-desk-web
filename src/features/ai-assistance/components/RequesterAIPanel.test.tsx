import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import type { RequesterTriageView } from '../model/ai.types';
import { RequesterAIPanel } from './RequesterAIPanel';

const view: RequesterTriageView = {
  outcome: 'Success', suggestedCategory: 'NET', categoryConfidence: 'High', requiresManualTriage: false, failureReason: null,
};

it('shows the suggested category with its band and no score', () => {
  render(<RequesterAIPanel result={view} />);
  expect(screen.getByText('Mạng & Wi-Fi')).toBeInTheDocument();
  expect(screen.getByText('Độ tin cậy: Cao')).toBeInTheDocument();
  expect(screen.queryByText(/chưa chắc chắn/)).not.toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/\d\.\d|%/);
});

it.each(['Low', null] as const)('tells a requester when AI is unsure of the category (%s)', (band) => {
  render(<RequesterAIPanel result={{ ...view, categoryConfidence: band }} />);
  expect(screen.getByText('AI chưa chắc chắn về danh mục này; kỹ thuật viên sẽ kiểm tra lại.')).toBeInTheDocument();
});

it('never blocks sending when AI is off or failed', () => {
  const { rerender } = render(<RequesterAIPanel result={null} />);
  expect(screen.getByText(/Bạn vẫn có thể gửi yêu cầu bình thường/)).toBeInTheDocument();
  rerender(<RequesterAIPanel result={{ ...view, outcome: 'Timeout' }} />);
  expect(screen.getByText(/Bạn vẫn có thể tiếp tục gửi yêu cầu/)).toBeInTheDocument();
});
