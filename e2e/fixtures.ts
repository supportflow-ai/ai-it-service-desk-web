import { test as base, expect } from '@playwright/test';
import { ticketA, user } from '../tests/fixtures';

interface ApiFixture {
  roles: string[];
  meStatus: number;
  detailStatus: number;
  tickets: typeof ticketA[];
  requests: string[];
  createdPayload: unknown;
}

export const test = base.extend<{ api: ApiFixture }>({
  api: async ({ page }, provide) => {
    const api: ApiFixture = { roles: ['Requester'], meStatus: 200, detailStatus: 200, tickets: [ticketA], requests: [], createdPayload: null };
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
      if (key === 'POST /api/tickets') {
        api.createdPayload = request.postDataJSON();
        return route.fulfill({ status: 201, json: ticketA });
      }
      const detail = api.tickets.find((ticket) => key === `GET /api/tickets/${ticket.id}`);
      if (detail) return route.fulfill({ status: api.detailStatus, ...(api.detailStatus === 200 ? { json: detail } : {}) });
      unexpected.push(key);
      return route.fulfill({ status: 501 });
    });
    await provide(api);
    expect(unexpected, 'Unexpected API requests must fail the browser smoke test').toEqual([]);
  },
});
export { expect } from '@playwright/test';
