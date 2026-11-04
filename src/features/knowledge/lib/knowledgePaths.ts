export const KNOWLEDGE_ADMIN_PATH = '/knowledge/manage';
export const NEW_ARTICLE_PATH = `${KNOWLEDGE_ADMIN_PATH}/new`;

export function editArticlePath(articleId: string) {
  return `${KNOWLEDGE_ADMIN_PATH}/${encodeURIComponent(articleId)}/edit`;
}
