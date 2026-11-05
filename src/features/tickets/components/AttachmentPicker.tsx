import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Alert, Button, Space, Typography } from 'antd';
import { DeleteOutlined, PaperClipOutlined } from '@ant-design/icons';
import { formatFileSize } from '../lib/formatFileSize';
import { ATTACHMENT_ACCEPT, validateAttachmentFile } from '../validation/attachmentRules';

interface AttachmentPickerProps {
  files: readonly File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

const sameFile = (a: File, b: File) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;

/** Files are checked against the backend limits as they are chosen; only valid ones are kept. */
export function AttachmentPicker({ files, onChange, disabled }: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rejected, setRejected] = useState<string[]>([]);

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = '';
    const kept = [...files];
    const problems: string[] = [];
    for (const file of picked) {
      const invalid = validateAttachmentFile(file);
      if (invalid) problems.push(`${file.name}: ${invalid}`);
      else if (!kept.some((existing) => sameFile(existing, file))) kept.push(file);
    }
    setRejected(problems);
    onChange(kept);
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <input
        type="file"
        multiple
        ref={inputRef}
        onChange={pick}
        style={{ display: 'none' }}
        accept={ATTACHMENT_ACCEPT}
        aria-label="Chọn tệp đính kèm"
        data-testid="create-attachment-input"
      />
      <Button icon={<PaperClipOutlined />} disabled={disabled} onClick={() => inputRef.current?.click()} style={{ borderRadius: 6 }}>
        Đính kèm tệp
      </Button>
      <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 6 }}>
        PDF, PNG, JPG, DOCX, TXT, ZIP, tối đa 10 MB mỗi tệp. Tệp được tải lên ngay sau khi yêu cầu được tạo.
      </Typography.Text>

      {rejected.length > 0 && (
        <Alert
          type="error"
          showIcon
          closable={{ closeIcon: true, 'aria-label': 'Đóng thông báo' }}
          onClose={() => setRejected([])}
          message="Không thêm được tệp"
          description={rejected.map((problem) => <div key={problem}>{problem}</div>)}
          style={{ marginTop: 8 }}
        />
      )}

      {files.length > 0 && (
        <Space direction="vertical" style={{ width: '100%', marginTop: 8 }} size={6}>
          {files.map((file) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--sf2)', borderRadius: 6, border: '1px solid var(--bd)' }}
            >
              <span>
                <PaperClipOutlined style={{ color: 'var(--pr)', marginRight: 8 }} />
                <span style={{ fontWeight: 500 }}>{file.name}</span>
                <span style={{ color: 'var(--tx3)', fontSize: 12 }}> ({formatFileSize(file.size)})</span>
              </span>
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                disabled={disabled}
                aria-label={`Bỏ tệp ${file.name}`}
                onClick={() => onChange(files.filter((existing) => !sameFile(existing, file)))}
              />
            </div>
          ))}
        </Space>
      )}
    </div>
  );
}
