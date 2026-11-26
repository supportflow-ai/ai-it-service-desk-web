import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import { server } from '../../../../tests/mocks/server';
import { agentDirectory, ticketA, user } from '../../../../tests/fixtures';
import { sessionStore } from '@/features/auth';
import { TicketCategory, TicketStatus } from '../model/ticket.types';
import { TicketTransferDialog } from './TicketTransferDialog';

const testTicket = {
  ...ticketA,
  categoryId: TicketCategory.NET,
  status: TicketStatus.Submitted,
  supportTeamId: 'team-l1',
  supportTeamName: 'IT Helpdesk Cấp 1',
};

function renderDialog(open = true, onClose = vi.fn(), onReload = vi.fn(), ticket = testTicket) {
  sessionStore.setToken('session');
  server.use(
    http.get('http://localhost/api/auth/me', () => HttpResponse.json({ ...user, roles: ['Agent'] })),
    http.get('http://localhost/api/users', () => HttpResponse.json(agentDirectory)),
  );
  const { Wrapper } = createTestWrapper();
  return render(
    <TicketTransferDialog ticket={ticket} open={open} onClose={onClose} onReload={onReload} />,
    { wrapper: Wrapper },
  );
}

describe('TicketTransferDialog', () => {
  it('renders current team and suggested team for NET category', async () => {
    renderDialog();
    expect(screen.getByText('Điều phối & Chuyển đội xử lý')).toBeInTheDocument();
    expect(screen.getByText('IT Helpdesk Cấp 1')).toBeInTheDocument();
    expect(screen.getAllByText('Đội Mạng & Hạ tầng').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Áp dụng gợi ý')).toBeInTheDocument();
  });

  it('validates required fields before submitting', async () => {
    renderDialog();
    const submitBtn = screen.getByRole('button', { name: /Xác nhận chuyển đội/i });
    await userEvent.click(submitBtn);

    expect(await screen.findByText('Vui lòng nhập lý do chuyển đội')).toBeInTheDocument();
  });

  it('validates reason length minimum 10 characters', async () => {
    renderDialog();
    const reasonInput = screen.getByLabelText('Lý do chuyển đội');
    await userEvent.type(reasonInput, 'Ngắn');

    const submitBtn = screen.getByRole('button', { name: /Xác nhận chuyển đội/i });
    await userEvent.click(submitBtn);

    expect(await screen.findByText('Lý do chuyển đội phải có ít nhất 10 ký tự')).toBeInTheDocument();
  });

  it('submits transfer payload with targetTeamId, reason and expectedRevision', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(`http://localhost/api/tickets/${testTicket.id}/transfer-team`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({
          ...testTicket,
          supportTeamId: 'team-network',
          supportTeamName: 'Đội Mạng & Hạ tầng',
        });
      }),
    );

    const onClose = vi.fn();
    renderDialog(true, onClose);

    // Click apply suggestion button
    const applyBtn = screen.getByText('Áp dụng gợi ý');
    await userEvent.click(applyBtn);

    const reasonInput = screen.getByLabelText('Lý do chuyển đội');
    await userEvent.type(reasonInput, 'Sự cố liên quan tới router core cần Đội Mạng hỗ trợ cấu hình');

    const submitBtn = screen.getByRole('button', { name: /Xác nhận chuyển đội/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(bodies).toHaveLength(1);
    });

    expect(bodies[0]).toEqual({
      targetTeamId: 'team-network',
      reason: 'Sự cố liên quan tới router core cần Đội Mạng hỗ trợ cấu hình',
      newAssigneeId: null,
      expectedRevision: testTicket.revision,
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles 409 conflict error and allows reload', async () => {
    server.use(
      http.post(`http://localhost/api/tickets/${testTicket.id}/transfer-team`, () =>
        HttpResponse.json({ error: 'Dữ liệu đã bị thay đổi bởi người khác.' }, { status: 409 }),
      ),
    );

    const onReload = vi.fn();
    renderDialog(true, vi.fn(), onReload);

    const applyBtn = screen.getByText('Áp dụng gợi ý');
    await userEvent.click(applyBtn);

    const reasonInput = screen.getByLabelText('Lý do chuyển đội');
    await userEvent.type(reasonInput, 'Sự cố chuyển sang đội mạng xử lý gấp');

    const submitBtn = screen.getByRole('button', { name: /Xác nhận chuyển đội/i });
    await userEvent.click(submitBtn);

    expect(await screen.findByText(/Ticket vừa được người khác cập nhật/i)).toBeInTheDocument();

    const reloadBtn = screen.getByRole('button', { name: 'Tải lại' });
    await userEvent.click(reloadBtn);
    expect(onReload).toHaveBeenCalled();
  });
});
