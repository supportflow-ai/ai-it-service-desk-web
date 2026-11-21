import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { WorkspaceRagPanel } from './WorkspaceRagPanel';

it('shows the not-enabled state without calling any AI endpoint', () => {
  // The test server fails on any unhandled request, so rendering proves no HTTP is sent.
  const { Wrapper } = createTestWrapper();
  render(<MemoryRouter><WorkspaceRagPanel ticketId="10000000-0000-0000-0000-000000000001" /></MemoryRouter>, { wrapper: Wrapper });
  expect(screen.getByText('Gợi ý trả lời từ tri thức chưa được bật cho ticket này.')).toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Nguồn tham chiếu' })).not.toBeInTheDocument();
});
