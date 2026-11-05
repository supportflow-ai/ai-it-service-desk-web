import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { knowledgeApi } from '../api/knowledgeApi';
import { knowledgeKeys } from '../api/knowledgeQueries';
import { isArticleId } from '../model/articleId';

/**
 * One article for anyone signed in: GET /knowledge/articles/{id} scopes it by role (a Requester
 * gets Published ones only, else 404), and the routes keep requesters out of the staff pages.
 */
export function useArticle(id: string) {
  const { sessionVersion, status } = useAuth();
  return useQuery({
    queryKey: knowledgeKeys.detail(sessionVersion, id),
    queryFn: ({ signal }) => knowledgeApi.getArticle(id, signal),
    enabled: status === 'authenticated' && isArticleId(id),
  });
}
