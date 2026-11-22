import type { QueryClient, QueryKey } from '@tanstack/react-query';

export const supportTeamKeys = {
  all: (version: number) => ['support-teams', version] as const,
  list: (version: number) => ['support-teams', version, 'list'] as const,
  detail: (version: number, id: string) => ['support-teams', version, 'detail', id] as const,
  members: (version: number, id: string) => ['support-teams', version, 'members', id] as const,
};

export const supportTeamInvalidation = {
  teams: (version: number): QueryKey[] => [
    supportTeamKeys.list(version),
  ],
  teamDetail: (version: number, teamId: string): QueryKey[] => [
    supportTeamKeys.detail(version, teamId),
    supportTeamKeys.list(version),
  ],
  members: (version: number, teamId: string): QueryKey[] => [
    supportTeamKeys.members(version, teamId),
    supportTeamKeys.detail(version, teamId),
    supportTeamKeys.list(version),
  ],
};

export async function invalidateSupportTeamQueries(queryClient: QueryClient, keys: QueryKey[]) {
  await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}
