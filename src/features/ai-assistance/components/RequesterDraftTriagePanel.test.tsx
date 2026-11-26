import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { expect, it, vi } from 'vitest';
import { server } from '../../../../tests/mocks/server';
import { createTestWrapper } from '../../../../tests/render';
import type { RequesterTriageView } from '../model/ai.types';
import { RequesterDraftTriagePanel } from './RequesterDraftTriagePanel';

const mockDraftView: RequesterTriageView = {
  outcome: 'Success',
  suggestedCategory: 'VPN',
  categoryConfidence: 'High',
  requiresManualTriage: false,
  failureReason: null,
};

it('shows empty tip when title and description are too short', () => {
  const { Wrapper } = createTestWrapper();
  render(<RequesterDraftTriagePanel title="" description="" />, { wrapper: Wrapper });
  expect(screen.getByText('Gợi ý AI chưa được bật. Bạn vẫn có thể gửi yêu cầu bình thường.')).toBeInTheDocument();
});

it('fetches draft triage and renders suggested category when text is provided', async () => {
  server.use(
    http.post('http://localhost/api/ai/classify-draft', () => HttpResponse.json(mockDraftView)),
  );

  const { Wrapper } = createTestWrapper();
  render(
    <RequesterDraftTriagePanel
      title="Không thể kết nối VPN"
      description="Lỗi authentication timeout khi kết nối từ xa"
    />,
    { wrapper: Wrapper },
  );

  expect(await screen.findByText('VPN')).toBeInTheDocument();
  expect(screen.getByText('Độ tin cậy: Cao')).toBeInTheDocument();
});

it('calls onApplyCategory when apply button is clicked', async () => {
  server.use(
    http.post('http://localhost/api/ai/classify-draft', () => HttpResponse.json(mockDraftView)),
  );

  const onApply = vi.fn();
  const { Wrapper } = createTestWrapper();
  render(
    <RequesterDraftTriagePanel
      title="Không thể kết nối VPN"
      description="Lỗi authentication timeout khi kết nối từ xa"
      selectedCategory="OTHER"
      onApplyCategory={onApply}
    />,
    { wrapper: Wrapper },
  );

  const button = await screen.findByRole('button', { name: 'Áp dụng danh mục này' });
  await userEvent.click(button);
  expect(onApply).toHaveBeenCalledWith('VPN');
});
