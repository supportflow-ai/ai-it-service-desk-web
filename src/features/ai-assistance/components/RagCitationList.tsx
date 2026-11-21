import { Card, Space, Tooltip, Typography } from 'antd';
import { Link } from 'react-router-dom';
import type { RagCitation, RagSourceAdapter } from '../model/rag.types';
import {
  citationSectionLabel,
  formatEvidenceDate,
  formatEvidenceScore,
  plainExcerpt,
  ragCitationLimits,
} from '../model/ragDisplay';

interface Props {
  citations: readonly RagCitation[];
  sources?: RagSourceAdapter;
}

function CitationMeta({ citation }: { citation: RagCitation }) {
  const parts = [
    citation.version !== null && `Phiên bản ${citation.version}`,
    citation.publishedAt !== null && `Xuất bản ${formatEvidenceDate(citation.publishedAt)}`,
  ].filter(Boolean);
  return (
    <Space size={8} wrap className="meta">
      {parts.length > 0 && <span>{parts.join(' · ')}</span>}
      {citation.score !== null && (
        <Tooltip title="Điểm mô hình dùng để xếp hạng nguồn, không phải xác suất đúng.">
          <span tabIndex={0}>Điểm mô hình: {formatEvidenceScore(citation.score)}</span>
        </Tooltip>
      )}
    </Space>
  );
}

/**
 * The evidence behind a suggestion (TC-385): each cited passage with its article, section and
 * version, and a way to open the article at that section. A passage is plain text, never rendered
 * as Markdown, so stored markup cannot run in the agent's browser.
 */
export function RagCitationList({ citations, sources }: Props) {
  return (
    <section aria-label="Nguồn tham chiếu">
      <Typography.Text strong>Nguồn tham chiếu ({citations.length})</Typography.Text>
      <ol style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 8 }}>
        {citations.map((citation, index) => {
          const section = citationSectionLabel(citation.section);
          const link = sources?.link(citation) ?? null;
          const excerpt = (sources?.excerpt ?? plainExcerpt)(citation.snippet, ragCitationLimits.snippet);
          return (
            <li key={`${citation.articleId}-${citation.section ?? ''}-${index}`}>
              <Card size="small" style={{ borderRadius: 8, borderColor: 'var(--bd)' }}>
                <div style={{ fontWeight: 600 }}>
                  <span aria-hidden="true">[{index + 1}] </span>
                  {link
                    ? <Link to={link.to} state={link.state} aria-label={`Mở bài ${citation.title} tại mục ${section}`}>{citation.title}</Link>
                    : citation.title}
                </div>
                <div className="meta" style={{ marginTop: 2 }}>Mục: {section}</div>
                {excerpt && <Typography.Paragraph style={{ margin: '6px 0 0', fontSize: 13 }}>{excerpt}</Typography.Paragraph>}
                <div style={{ marginTop: 6 }}><CitationMeta citation={citation} /></div>
                {!link && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>Không mở được bài viết nguồn này.</Typography.Text>
                )}
              </Card>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
