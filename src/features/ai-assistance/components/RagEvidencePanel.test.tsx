import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { createTestWrapper } from '../../../../tests/render';
import type { RagSuggestionView } from '../model/rag.types';
import { RagEvidencePanel } from './RagEvidencePanel';

const answered: RagSuggestionView = {
  outcome: 'Answered', answer: 'Hãy cài lại VPN rồi đăng nhập.\nNếu vẫn lỗi, đổi máy chủ.', citations: [],
  model: 'model-x', confidence: 'Medium', score: 0.6, generatedAt: '2026-11-05T09:30:00Z',
};

function renderPanel(result: RagSuggestionView | null) {
  const { Wrapper } = createTestWrapper();
  return render(<RagEvidencePanel result={result} />, { wrapper: Wrapper });
}

it('shows the suggestion with its model, confidence band and a no-auto-send note', () => {
  renderPanel(answered);
  expect(screen.getByText(/Hãy cài lại VPN rồi đăng nhập\./)).toBeInTheDocument();
  expect(screen.getByText('Mô hình: model-x')).toBeInTheDocument();
  expect(screen.getByText('Độ tin cậy: Trung bình')).toBeInTheDocument();
  expect(screen.getByText('Nên rà soát')).toBeInTheDocument();
  expect(screen.getByText(/không tự gửi cho người yêu cầu/)).toBeInTheDocument();
  // A band, and the plain score only in a tooltip, never a percentage.
  expect(screen.queryByText(/%/)).not.toBeInTheDocument();
});

it('omits the model and confidence the service did not report, instead of inventing them', () => {
  renderPanel({ ...answered, model: null, confidence: null, score: null, generatedAt: null });
  expect(screen.getByText(/Hãy cài lại VPN/)).toBeInTheDocument();
  expect(screen.queryByText(/Mô hình:/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Độ tin cậy/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Tạo lúc/)).not.toBeInTheDocument();
});

it('renders model output as plain text, never as markup', () => {
  renderPanel({ ...answered, answer: '<img src=x onerror=alert(1)> **đậm**' });
  expect(screen.getByText('<img src=x onerror=alert(1)> **đậm**')).toBeInTheDocument();
  expect(document.querySelector('img')).toBeNull();
});

it('says the feature is not enabled when there is no result', () => {
  renderPanel(null);
  expect(screen.getByText('Gợi ý trả lời từ tri thức chưa được bật cho ticket này.')).toBeInTheDocument();
  expect(screen.getByText('Bạn vẫn xử lý ticket như bình thường.')).toBeInTheDocument();
});

it('shows no answer text when the outcome is not an answer', () => {
  renderPanel({ ...answered, outcome: 'NoEvidence' });
  expect(screen.queryByText(/Hãy cài lại VPN/)).not.toBeInTheDocument();
  expect(screen.getByText('Chưa có gợi ý trả lời cho ticket này.')).toBeInTheDocument();
});
