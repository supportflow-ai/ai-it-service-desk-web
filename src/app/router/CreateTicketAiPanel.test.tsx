import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { createTestWrapper } from '../../../tests/render';
import { CreateTicketAiPanel } from './CreateTicketAiPanel';

it('renders CreateTicketAiPanel with fallback', async () => {
  const { Wrapper } = createTestWrapper();
  render(
    <CreateTicketAiPanel
      title=""
      description=""
      onApplyCategory={vi.fn()}
    />,
    { wrapper: Wrapper },
  );

  expect(
    await screen.findByText('Gợi ý AI chưa được bật. Bạn vẫn có thể gửi yêu cầu bình thường.', {}, { timeout: 10000 }),
  ).toBeInTheDocument();
});
