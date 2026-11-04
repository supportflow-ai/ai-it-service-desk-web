import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { knowledgeApi } from '../api/knowledgeApi';
import { knowledgeKeys } from '../api/knowledgeQueries';
import type { ArticleListFilters } from '../model/knowledge.types';
import { canManageKnowledge } from '../model/knowledgePermissions';

/** The staff list; not requested for anyone else, who would get only Published articles. */
export function useKnowledgeArticles(filters: ArticleListFilters) {
  const { sessionVersion, status, user } = useAuth();
  return useQuery({
    queryKey: knowledgeKeys.list(sessionVersion, filters),
    queryFn: ({ signal }) => knowledgeApi.listArticles(filters, signal),
    enabled: status === 'authenticated' && canManageKnowledge(user),
  });
}
