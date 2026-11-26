import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
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

it('renders apply button and calls onApplyCategory when clicked', async () => {
  const onApply = vi.fn();
  render(<RequesterAIPanel result={view} onApplyCategory={onApply} selectedCategory="ACC" />);
  const button = screen.getByRole('button', { name: 'Áp dụng danh mục này' });
  expect(button).toBeInTheDocument();
  await userEvent.click(button);
  expect(onApply).toHaveBeenCalledWith('NET');
});

it('shows already selected tag when selectedCategory matches suggested category', () => {
  render(<RequesterAIPanel result={view} onApplyCategory={vi.fn()} selectedCategory="NET" />);
  expect(screen.getByText('Đã chọn danh mục này')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Áp dụng danh mục này' })).not.toBeInTheDocument();
});
