import { test as base, expect } from '@playwright/test';
import { agentDirectory, articlePage, ticketA, user } from '../tests/fixtures';

interface ApiFixture {
  roles: string[];
  meStatus: number;
  detailStatus: number;
  tickets: typeof ticketA[];
  requests: string[];
  createdPayload: unknown;
  presign: { uploadUrl: string; storageKey: string; expirySeconds: number; formData?: Record<string, string> } | null;
  confirmedPayloads: unknown[];
  attachments: Record<string, unknown>[];
  articles: object[];
}

export const test = base.extend<{ api: ApiFixture }>({
  api: async ({ page }, provide) => {
    const api: ApiFixture = {
      roles: ['Requester'], meStatus: 200, detailStatus: 200, tickets: [ticketA], requests: [], createdPayload: null, presign: null,
      confirmedPayloads: [], attachments: [], articles: [],
    };
    const unexpected: string[] = [];
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const key = `${request.method()} ${url.pathname}`;
      api.requests.push(`${key}${url.search}`);
      const currentUser = { ...user, roles: api.roles };
      if (key === 'POST /api/auth/login' || key === 'POST /api/auth/register') {
        expect(request.headers().authorization).toBeUndefined();
        return route.fulfill({ json: { token: 'browser-session', user: currentUser }, status: key.endsWith('register') ? 201 : 200 });
      }
      if (!request.headers().authorization) return route.fulfill({ status: 401 });
      if (key === 'GET /api/auth/me') return route.fulfill({ status: api.meStatus, ...(api.meStatus === 200 ? { json: currentUser } : {}) });
      if (key === 'GET /api/tickets/me') {
        const pageNumber = Number(url.searchParams.get('page'));
        const pageSize = Number(url.searchParams.get('pageSize'));
        return route.fulfill({ json: { items: api.tickets.slice((pageNumber - 1) * pageSize, pageNumber * pageSize), page: pageNumber, pageSize, totalCount: api.tickets.length } });
      }
      if (key === 'GET /api/users' && url.searchParams.get('role') === 'Agent') return route.fulfill({ json: agentDirectory });
      if (key === 'GET /api/knowledge/articles') return route.fulfill({ json: articlePage(api.articles) });
      if (key === 'GET /api/tickets/queue') {
        const pageNumber = Number(url.searchParams.get('page'));
        const pageSize = Number(url.searchParams.get('pageSize'));
        return route.fulfill({ json: { items: api.tickets.slice((pageNumber - 1) * pageSize, pageNumber * pageSize), page: pageNumber, pageSize, totalCount: api.tickets.length } });
      }
      if (key === 'POST /api/tickets') {
        api.createdPayload = request.postDataJSON();
        return route.fulfill({ status: 201, json: ticketA });
      }
      const detail = api.tickets.find((ticket) => key === `GET /api/tickets/${ticket.id}`);
      if (detail) return route.fulfill({ status: api.detailStatus, ...(api.detailStatus === 200 ? { json: detail } : {}) });
      const timelineTicket = api.tickets.find((ticket) => key === `GET /api/tickets/${ticket.id}/timeline`);
      if (timelineTicket) return route.fulfill({ status: 200, json: [] });
      const commentTicket = api.tickets.find((ticket) => key === `POST /api/tickets/${ticket.id}/comments`);
      if (commentTicket) {
        const body = request.postDataJSON() as { content: string };
        return route.fulfill({
          status: 201,
          json: {
            id: '20000000-0000-0000-0000-000000000001',
            ticketId: commentTicket.id,
            authorId: user.userId,
            authorName: 'User',
            authorRole: api.roles[0] ?? 'Requester',
            content: body.content,
            isInternal: false,
            createdAt: new Date().toISOString(),
          },
        });
      }
      const noteTicket = api.tickets.find((ticket) => key === `POST /api/tickets/${ticket.id}/internal-notes`);
      if (noteTicket) {
        const body = request.postDataJSON() as { content: string };
        return route.fulfill({
          status: 201,
          json: {
            id: '20000000-0000-0000-0000-000000000002',
            ticketId: noteTicket.id,
            authorId: user.userId,
            authorName: 'Agent User',
            authorRole: api.roles[0] ?? 'Agent',
            content: body.content,
            isInternal: true,
            createdAt: new Date().toISOString(),
          },
        });
      }
      const attachmentsTicket = api.tickets.find((ticket) => key === `GET /api/tickets/${ticket.id}/attachments`);
      if (attachmentsTicket) return route.fulfill({ status: 200, json: api.attachments });
      const uploadTicket = api.tickets.find((ticket) => key === `POST /api/tickets/${ticket.id}/attachments/upload-url`);
      if (uploadTicket && api.presign) return route.fulfill({ status: 200, json: api.presign });
      const confirmTicket = api.tickets.find((ticket) => key === `POST /api/tickets/${ticket.id}/attachments/confirm`);
      if (confirmTicket && api.presign) {
        const body = request.postDataJSON() as { fileName: string; fileSizeBytes: number; contentType: string };
        api.confirmedPayloads.push(body);
        // Like the backend, the confirmed file moves from the pending key to a ticket-owned key.
        const attachment = {
          id: `30000000-0000-0000-0000-${String(api.attachments.length + 1).padStart(12, '0')}`,
          ticketId: confirmTicket.id, fileName: body.fileName, fileSizeBytes: body.fileSizeBytes, contentType: body.contentType,
          storageKey: `tickets/${confirmTicket.id}/attachments/${api.attachments.length + 1}`, uploadedBy: user.userId,
          createdAt: new Date().toISOString(),
        };
        api.attachments.unshift(attachment);
        return route.fulfill({ status: 201, json: attachment });
      }
      const downloadTicket = api.tickets.find((ticket) => key === `GET /api/tickets/${ticket.id}/attachments/download-url`);
      if (downloadTicket && api.presign) {
        const storageKey = url.searchParams.get('storageKey') ?? '';
        return route.fulfill({ status: 200, json: { downloadUrl: `${new URL(api.presign.uploadUrl).origin}/servicedesk/${storageKey}?signed=1` } });
      }
      unexpected.push(key);
      return route.fulfill({ status: 501 });
    });
    await provide(api);
    expect(unexpected, 'Unexpected API requests must fail the browser smoke test').toEqual([]);
  },
});
export { expect } from '@playwright/test';
