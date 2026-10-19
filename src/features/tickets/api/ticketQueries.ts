export const ticketKeys = {
  session: (version: number) => ['tickets', version] as const,
  list: (version: number, page: number, pageSize: number) => ['tickets', version, 'mine', { page, pageSize }] as const,
  detail: (version: number, id: string) => ['tickets', version, 'detail', id] as const,
};
