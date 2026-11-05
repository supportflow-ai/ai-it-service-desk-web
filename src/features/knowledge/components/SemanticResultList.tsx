import { Space, Typography } from 'antd';
import { groupMatches, semanticOutcome } from '../model/semanticResults';
import type { SemanticMatch } from '../model/knowledge.types';
import type { KnowledgeResultsState } from '../lib/knowledgePaths';
import { SemanticNoMatch } from './SemanticNoMatch';
import { SemanticResultCard } from './SemanticResultCard';

interface SemanticResultListProps {
  matches: readonly SemanticMatch[];
  resultsState: KnowledgeResultsState;
  onKeywordSearch?: () => void;
  onAskForHelp: () => void;
}

/** Semantic search results, one card per source article, the closest first (TC-361, TC-362). */
export function SemanticResultList({ matches, resultsState, onKeywordSearch, onAskForHelp }: SemanticResultListProps) {
  const outcome = semanticOutcome(matches);
  if (outcome.kind !== 'matches') {
    return <SemanticNoMatch kind={outcome.kind} onKeywordSearch={onKeywordSearch} onAskForHelp={onAskForHelp} />;
  }
  const groups = groupMatches(outcome.matches);
  return (
    <section aria-label="Kết quả tìm theo nghĩa">
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: '0 0 8px' }}>
        {groups.length} bài viết có nội dung gần với câu hỏi, xếp theo độ liên quan.
      </Typography.Paragraph>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {groups.map((group) => <SemanticResultCard key={group.articleId} group={group} resultsState={resultsState} />)}
      </Space>
    </section>
  );
}
