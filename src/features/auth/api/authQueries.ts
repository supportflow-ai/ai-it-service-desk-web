export const authKeys = {
  session: (version: number) => ['auth', 'session', version] as const,
  departments: (version: number) => ['auth', 'departments', version] as const,
  users: (version: number, role?: string) => ['auth', 'users', version, role ?? 'all'] as const,
};
