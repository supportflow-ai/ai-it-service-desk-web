import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionStore, useAuth } from '@/features/auth';
import { AppError, normalizeError } from '@/shared/api/httpError';
import { knowledgeApi } from '../api/knowledgeApi';
import { knowledgeKeys } from '../api/knowledgeQueries';
import type { ArticleDraftPayload, ArticleDto } from '../model/knowledge.types';

interface ArticleWriteOptions<TVariables> {
  /** The article written to; `new` for a create. */
  articleId: string;
  action: string;
  write: (variables: TVariables) => Promise<ArticleDto>;
}

/**
 * The one write path for articles: never retried, a response from an ended session is discarded,
 * the article returned replaces its cached copy and every list is refreshed. A 404 refreshes the
 * article so its page shows that it is gone.
 */
export function useArticleWrite<TVariables>({ articleId, action, write }: ArticleWriteOptions<TVariables>) {
  const { sessionVersion } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...knowledgeKeys.writes(sessionVersion, articleId), action],
    mutationFn: async (variables: TVariables) => {
      const article = await write(variables);
      if (sessionStore.getSnapshot().version !== sessionVersion) {
        throw new AppError('Đã hủy yêu cầu của phiên cũ.', 'canceled');
      }
      return article;
    },
    retry: false,
    onSuccess: (article) => {
      queryClient.setQueryData(knowledgeKeys.detail(sessionVersion, article.id), article);
      return queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists(sessionVersion) });
    },
    onError: (error) => {
      if (normalizeError(error).status !== 404) return;
      void queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(sessionVersion, articleId) });
    },
  });
}

export function useCreateArticle() {
  return useArticleWrite({ articleId: 'new', action: 'create', write: (payload: ArticleDraftPayload) => knowledgeApi.createDraft(payload) });
}

interface UpdateDraftVariables {
  payload: ArticleDraftPayload;
  expectedRevision: number;
}

export function useUpdateDraft(articleId: string) {
  return useArticleWrite({
    articleId,
    action: 'update-draft',
    write: ({ payload, expectedRevision }: UpdateDraftVariables) => knowledgeApi.updateDraft(articleId, payload, expectedRevision),
  });
}
