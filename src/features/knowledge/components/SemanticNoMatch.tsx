import { Button, Empty, Space } from 'antd';

interface SemanticNoMatchProps {
  /** `weak`: passages came back, but none close enough to show; `none`: nothing came back at all. */
  kind: 'weak' | 'none';
  /** Runs the same words as a keyword search, when the page offers one. */
  onKeywordSearch?: () => void;
  onAskForHelp: () => void;
}

const messages = {
  weak: 'Chưa có bài viết nào đủ liên quan tới câu hỏi của bạn.',
  none: 'Không tìm thấy nội dung nào gần với câu hỏi của bạn.',
} as const;

/**
 * The semantic search's own empty state (TC-362): below the relevance threshold nothing is shown,
 * so loosely related passages are never offered as an answer. It says what to try next.
 */
export function SemanticNoMatch({ kind, onKeywordSearch, onAskForHelp }: SemanticNoMatchProps) {
  return (
    <Empty
      description={(
        <>
          <div>{messages[kind]}</div>
          <div className="meta" style={{ marginTop: 4 }}>
            Thử hỏi cụ thể hơn, ví dụ tên phần mềm hoặc mã lỗi, tìm theo từ khóa, hoặc gửi yêu cầu để kỹ thuật viên hỗ trợ.
          </div>
        </>
      )}
    >
      <Space wrap style={{ justifyContent: 'center' }}>
        {onKeywordSearch && <Button onClick={onKeywordSearch}>Tìm theo từ khóa</Button>}
        <Button type="primary" onClick={onAskForHelp}>Tạo yêu cầu hỗ trợ</Button>
      </Space>
    </Empty>
  );
}
