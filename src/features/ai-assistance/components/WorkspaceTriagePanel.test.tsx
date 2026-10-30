import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { WorkspaceTriagePanel } from './WorkspaceTriagePanel';

it('shows the not-enabled state without calling any AI endpoint', () => {
  // The test server fails on any unhandled request, so rendering proves no HTTP is sent.
  const { Wrapper } = createTestWrapper();
  render(<WorkspaceTriagePanel ticketId="10000000-0000-0000-0000-000000000001" />, { wrapper: Wrapper });
  expect(screen.getByText('Gợi ý AI chưa được bật cho ticket này.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Chấp nhận|Accept/ })).not.toBeInTheDocument();
});
