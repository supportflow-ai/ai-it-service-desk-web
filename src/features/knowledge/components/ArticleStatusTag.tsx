import type { ArticleStatus } from '../model/knowledge.types';
import { articleStatusMeta } from '../model/articleStatus';

export function ArticleStatusTag({ status }: { status: ArticleStatus }) {
  const meta = articleStatusMeta[status];
  return <span className={`status-tag ${meta.tone}`} style={{ verticalAlign: 'middle' }}>{meta.label}</span>;
}
