import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { CreateTicketPage } from './CreateTicketPage';

function renderCreate(aiPanel?: ReactNode) {
  const { Wrapper } = createTestWrapper();
  render(<MemoryRouter><CreateTicketPage aiPanel={aiPanel} /></MemoryRouter>, { wrapper: Wrapper });
}

beforeEach(() => {
  sessionStore.setToken('requester');
  server.use(http.get('http://localhost/api/auth/me', () => HttpResponse.json(user)));
});

it('shows no invented AI suggestion, confidence, article or department', async () => {
  renderCreate();
  expect(await screen.findByRole('button', { name: 'Gửi yêu cầu' })).toBeInTheDocument();
  expect(screen.queryByText(/92%|FortiClient|Phòng Công nghệ|Bài viết liên quan/)).not.toBeInTheDocument();
  expect(screen.queryByText('Phòng ban')).not.toBeInTheDocument();
});

it('hosts the AI panel the App injects beside the form', async () => {
  renderCreate(<p>AI side panel</p>);
  expect(await screen.findByText('AI side panel')).toBeInTheDocument();
});
