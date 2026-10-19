export const authKeys = {
  session: (version: number) => ['auth', 'session', version] as const,
};
