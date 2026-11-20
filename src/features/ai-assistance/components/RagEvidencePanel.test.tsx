import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import type { RagCitation, RagSourceAdapter, RagSuggestionView } from '../model/rag.types';
import { RagEvidencePanel } from './RagEvidencePanel';

const citation: RagCitation = {
  articleId: '40000000-0000-0000-0000-000000000001', title: 'Cấu hình VPN', section: 'Cài đặt',
  snippet: 'Mở ứng dụng VPN rồi chọn máy chủ.', score: 0.82, version: 3, publishedAt: '2026-11-04T08:00:00Z',
};
const second: RagCitation = { ...citation, articleId: '40000000-0000-0000-0000-000000000002', title: 'Mạng công ty', section: null, snippet: 'Kết nối mạng nội bộ.', score: null, version: null, publishedAt: null };
const answered: RagSuggestionView = {
  outcome: 'Answered', answer: 'Hãy cài lại VPN rồi đăng nhập.\nNếu vẫn lỗi, đổi máy chủ.', citations: [citation, second],
  model: 'model-x', confidence: 'Medium', score: 0.6, generatedAt: '2026-11-05T09:30:00Z',
};
const sources: RagSourceAdapter = {
  link: (item) => (item.articleId === second.articleId ? null : { to: `/knowledge/${item.articleId}`, state: { section: item.section } }),
  excerpt: (text) => `trích: ${text}`,
};

function Probe() {
  const location = useLocation();
  return <p>article page, state: {JSON.stringify(location.state)}</p>;
}

function renderPanel(props: Partial<Parameters<typeof RagEvidencePanel>[0]> & { result: RagSuggestionView | null }) {
  const { Wrapper } = createTestWrapper();
  return render(
    <MemoryRouter initialEntries={['/ticket']}>
      <Routes>
        <Route path="/ticket" element={<RagEvidencePanel sources={sources} {...props} />} />
        <Route path="/knowledge/:id" element={<Probe />} />
        <Route path="/knowledge" element={<p>knowledge search</p>} />
      </Routes>
    </MemoryRouter>,
    { wrapper: Wrapper },
  );
}

it('shows the suggestion with its model, confidence band and a no-auto-send note', () => {
  renderPanel({ result: answered });
  expect(screen.getByText(/Hãy cài lại VPN rồi đăng nhập\./)).toBeInTheDocument();
  expect(screen.getByText('Mô hình: model-x')).toBeInTheDocument();
  expect(screen.getByText('Độ tin cậy: Trung bình')).toBeInTheDocument();
  expect(screen.getByText('Nên rà soát')).toBeInTheDocument();
  expect(screen.getByText(/không tự gửi cho người yêu cầu/)).toBeInTheDocument();
  // A band and a plain score in a tooltip, never a percentage.
  expect(screen.queryByText(/%/)).not.toBeInTheDocument();
});

it('renders model output as plain text, never as markup', () => {
  renderPanel({ result: { ...answered, answer: '<img src=x onerror=alert(1)> **đậm**' } });
  expect(screen.getByText('<img src=x onerror=alert(1)> **đậm**')).toBeInTheDocument();
  expect(document.querySelector('img')).toBeNull();
});

it('lists every source with article, section, version, date and score, and opens it at its section', async () => {
  renderPanel({ result: answered });
  const list = screen.getByRole('region', { name: 'Nguồn tham chiếu' });
  expect(within(list).getByText('Nguồn tham chiếu (2)')).toBeInTheDocument();
  expect(within(list).getByText('Mục: Cài đặt')).toBeInTheDocument();
  expect(within(list).getByText('trích: Mở ứng dụng VPN rồi chọn máy chủ.')).toBeInTheDocument();
  expect(within(list).getByText(/Phiên bản 3 · Xuất bản 04\/11\/2026/)).toBeInTheDocument();
  expect(within(list).getByText('Điểm mô hình: 0.82')).toBeInTheDocument();
  expect(within(list).getByText('Mục: Phần mở đầu')).toBeInTheDocument();

  await userEvent.click(within(list).getByRole('link', { name: 'Mở bài Cấu hình VPN tại mục Cài đặt' }));
  expect(screen.getByText('article page, state: {"section":"Cài đặt"}')).toBeInTheDocument();
});

it('says so when a source cannot be opened, and shows its title without a link', () => {
  renderPanel({ result: answered });
  expect(screen.queryByRole('link', { name: /Mạng công ty/ })).not.toBeInTheDocument();
  expect(screen.getByText('Mạng công ty')).toBeInTheDocument();
  expect(screen.getByText('Không mở được bài viết nguồn này.')).toBeInTheDocument();
});

it('works without a source adapter: plain titles and excerpts', () => {
  renderPanel({ result: answered, sources: undefined });
  expect(screen.queryByRole('link', { name: /Mở bài/ })).not.toBeInTheDocument();
  expect(screen.getByText('Mở ứng dụng VPN rồi chọn máy chủ.')).toBeInTheDocument();
});

it('shows abstention as no evidence, not as an error, and offers the knowledge base', async () => {
  renderPanel({ result: { ...answered, outcome: 'NoEvidence', answer: null, citations: [] }, knowledgeSearchPath: '/knowledge' });
  expect(screen.getByText(/không tìm thấy bằng chứng đủ gần/)).toBeInTheDocument();
  expect(screen.getByText(/Đây không phải lỗi hệ thống/)).toBeInTheDocument();
  expect(screen.queryByText(/không khả dụng|quá thời gian/)).not.toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Nguồn tham chiếu' })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('link', { name: 'Tìm trong Kho tri thức' }));
  expect(screen.getByText('knowledge search')).toBeInTheDocument();
});

it('does not show an answer that has no source', () => {
  renderPanel({ result: { ...answered, citations: [] } });
  expect(screen.getByText(/không kèm nguồn nên không được hiển thị/)).toBeInTheDocument();
  expect(screen.queryByText(/Hãy cài lại VPN/)).not.toBeInTheDocument();
});

it.each([
  ['Unavailable', 'Dịch vụ AI tạm thời không khả dụng.'],
  ['Timeout', 'AI phản hồi quá thời gian cho phép.'],
] as const)('says the AI is unavailable on %s with fixed text, never a provider message', (outcome, message) => {
  renderPanel({ result: { ...answered, outcome, answer: 'secret provider text', citations: [] } });
  expect(screen.getByText(message)).toBeInTheDocument();
  expect(screen.getByText(/xử lý thủ công vẫn hoạt động/)).toBeInTheDocument();
  expect(screen.queryByText(/secret provider text/)).not.toBeInTheDocument();
  expect(screen.queryByText(/không tìm thấy bằng chứng/)).not.toBeInTheDocument();
});

it('offers a retry for an unavailable AI only when the host can run it', async () => {
  const onRetry = vi.fn();
  const unavailable: RagSuggestionView = { ...answered, outcome: 'Unavailable', citations: [] };
  const { unmount } = renderPanel({ result: unavailable });
  expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();
  unmount();
  renderPanel({ result: unavailable, onRetry });
  await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

it('shows a running request as its own state, hiding an older answer', () => {
  renderPanel({ result: answered, loading: true });
  expect(screen.getByRole('status')).toHaveTextContent('AI đang tìm bằng chứng');
  expect(screen.queryByText(/Hãy cài lại VPN/)).not.toBeInTheDocument();
  expect(screen.queryByText(/không khả dụng|không tìm thấy bằng chứng|chưa được bật/)).not.toBeInTheDocument();
});

it('says the feature is not enabled when there is no result', () => {
  renderPanel({ result: null });
  expect(screen.getByText('Gợi ý trả lời từ tri thức chưa được bật cho ticket này.')).toBeInTheDocument();
  expect(screen.getByText('Bạn vẫn xử lý ticket như bình thường.')).toBeInTheDocument();
});

it('omits the model and confidence the service did not report, instead of inventing them', () => {
  renderPanel({ result: { ...answered, model: null, confidence: null, score: null, generatedAt: null } });
  expect(screen.getByText(/Hãy cài lại VPN/)).toBeInTheDocument();
  expect(screen.queryByText(/Mô hình:/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Độ tin cậy/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Tạo lúc/)).not.toBeInTheDocument();
});
