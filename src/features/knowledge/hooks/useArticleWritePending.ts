import { useIsMutating } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { knowledgeKeys } from '../api/knowledgeQueries';

/** True while any write to this article (save, publish, archive) is in flight, from any component. */
export function useArticleWritePending(articleId: string) {
  const { sessionVersion } = useAuth();
  return useIsMutating({ mutationKey: knowledgeKeys.writes(sessionVersion, articleId) }) > 0;
}
