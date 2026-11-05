import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  http.get('http://localhost/api/tickets/:id/attachments', () => HttpResponse.json([])),
  http.get('http://localhost/api/users', () => HttpResponse.json([])),
  http.get('http://localhost/api/departments', () => HttpResponse.json([])),
);
