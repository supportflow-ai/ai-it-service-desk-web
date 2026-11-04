import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { knowledgeApi } from '../api/knowledgeApi';
import { knowledgeKeys } from '../api/knowledgeQueries';
import type { PublishedSearchFilters } from '../model/knowledge.types';

/** Published articles for anyone signed in (GET /knowledge/articles/search allows Requester, Agent, Admin). */
export function usePublishedArticles(filters: PublishedSearchFilters) {
  const { sessionVersion, status } = useAuth();
  return useQuery({
    queryKey: knowledgeKeys.published(sessionVersion, filters),
    queryFn: ({ signal }) => knowledgeApi.searchPublished(filters, signal),
    enabled: status === 'authenticated',
  });
}
