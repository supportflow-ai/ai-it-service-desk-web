import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../tests/render';
import { server } from '../../../tests/mocks/server';
import { user } from '../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { WorkspaceAiPanels } from './WorkspaceAiPanels';

function renderPanels(roles: string[]) {
  sessionStore.setToken('session');
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles })));
  const { Wrapper } = createTestWrapper();
  render(<MemoryRouter><WorkspaceAiPanels ticketId="10000000-0000-0000-0000-000000000001" onTicketChanged={() => {}} /></MemoryRouter>, { wrapper: Wrapper });
}

beforeEach(() => sessionStore.clear());

it.each([['Agent'], ['Admin']])('shows the evidence panel to %s beside the triage panel', async (role) => {
  renderPanels([role]);
  // The panels are lazy chunks: the first render in a cold run can take longer than the 1s default.
  expect(await screen.findByText('Gợi ý trả lời từ tri thức chưa được bật cho ticket này.', {}, { timeout: 10000 })).toBeInTheDocument();
  expect(screen.getByText('Gợi ý AI chưa được bật cho ticket này.')).toBeInTheDocument();
});

it('never shows the evidence panel to a Requester', async () => {
  renderPanels(['Requester']);
  expect(await screen.findByText('Gợi ý AI chưa được bật cho ticket này.', {}, { timeout: 10000 })).toBeInTheDocument();
  expect(screen.queryByText(/Gợi ý từ Kho tri thức/)).not.toBeInTheDocument();
});
