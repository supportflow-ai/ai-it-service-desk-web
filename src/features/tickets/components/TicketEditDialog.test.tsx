import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect, it, vi } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { ticketA, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import type { TicketDto } from '../model/ticket.types';
import { TicketEditDialog } from './TicketEditDialog';

const opened = { ...ticketA, requesterId: user.userId, revision: 7 } as TicketDto;
let revisions: unknown[] = [];
let conflict = false;

beforeEach(() => {
  revisions = [];
  conflict = false;
  sessionStore.setToken('requester');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json(user)),
    http.post(`http://localhost/api/tickets/${ticketA.id}/update`, async ({ request }) => {
      revisions.push((await request.json() as { expectedRevision: unknown }).expectedRevision);
      return conflict ? HttpResponse.json({ error: 'Dữ liệu đã bị thay đổi.' }, { status: 409 }) : HttpResponse.json(opened);
    }),
  );
});

function renderDialog(onReload = () => {}) {
  const { Wrapper } = createTestWrapper();
  const props = { open: true, onClose: () => {}, onReload };
  const view = render(<TicketEditDialog ticket={opened} {...props} />, { wrapper: Wrapper });
  return { rerenderWith: (ticket: TicketDto) => view.rerender(<TicketEditDialog ticket={ticket} {...props} />) };
}

it('saves with the revision it opened on, even after a background refetch brought a newer one', async () => {
  const { rerenderWith } = renderDialog();
  await screen.findByLabelText(/Tiêu đề yêu cầu/);
  // Someone else edited meanwhile, and a window-focus refetch delivered their version.
  rerenderWith({ ...opened, title: 'Sửa bởi Admin', revision: 9 });
  await userEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  await waitFor(() => expect(revisions).toEqual([7]));
});

it('takes the newer revision only after the user reloads following a conflict', async () => {
  conflict = true;
  const onReload = vi.fn();
  const { rerenderWith } = renderDialog(onReload);
  await userEvent.type(await screen.findByLabelText(/Tiêu đề yêu cầu/), ' (bổ sung)');
  await userEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Tải lại' }));
  expect(onReload).toHaveBeenCalledOnce();
  rerenderWith({ ...opened, revision: 9 });

  conflict = false;
  await userEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
  await waitFor(() => expect(revisions).toEqual([7, 9]));
  expect(screen.getByLabelText(/Tiêu đề yêu cầu/)).toHaveValue(`${ticketA.title} (bổ sung)`);
});
