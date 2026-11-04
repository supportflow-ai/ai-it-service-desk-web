import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { knowledgeApi } from '../api/knowledgeApi';
import { knowledgeKeys } from '../api/knowledgeQueries';
import { isArticleId } from '../model/articleId';
import { canManageKnowledge } from '../model/knowledgePermissions';

export function useArticle(id: string) {
  const { sessionVersion, status, user } = useAuth();
  return useQuery({
    queryKey: knowledgeKeys.detail(sessionVersion, id),
    queryFn: ({ signal }) => knowledgeApi.getArticle(id, signal),
    enabled: status === 'authenticated' && canManageKnowledge(user) && isArticleId(id),
  });
}
