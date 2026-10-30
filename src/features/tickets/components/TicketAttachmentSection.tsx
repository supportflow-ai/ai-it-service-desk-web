import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Alert, Button, Card, Empty, Progress, Space, Typography } from 'antd';
import { DownloadOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { useAttachmentDownload } from '../hooks/useAttachmentDownload';
import { useUploadAttachment } from '../hooks/useUploadAttachment';
import type { UploadedAttachment } from '../hooks/useUploadAttachment';
import { describeTicketError } from '../lib/ticketErrorMessage';
import { ATTACHMENT_ACCEPT } from '../validation/attachmentRules';

interface TicketAttachmentSectionProps {
  ticketId: string;
}

const attachmentMessages = {
  400: 'Tệp không hợp lệ: chỉ chấp nhận PDF, PNG, JPG, DOCX, TXT, ZIP và tối đa 10 MB.',
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Callers must remount this section (key={ticketId}) when the ticket changes. */
export function TicketAttachmentSection({ ticketId }: TicketAttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // The backend has no attachment list/metadata endpoint yet, so only this session's uploads are known.
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const upload = useUploadAttachment(ticketId);
  const download = useAttachmentDownload(ticketId);

  const uploadFailure = upload.validationError
    ?? (upload.error ? describeTicketError(upload.error, attachmentMessages)?.message ?? null : null);
  const downloadFailure = download.error ? describeTicketError(download.error)?.message ?? null : null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    upload.upload(file, (uploaded) => setAttachments((prev) => [...prev, uploaded]));
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PaperClipOutlined style={{ color: 'var(--pr)' }} />
          <span>Tệp đính kèm ({attachments.length})</span>
        </div>
      }
      extra={
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept={ATTACHMENT_ACCEPT}
            aria-label="Chọn tệp đính kèm"
            data-testid="attachment-input"
          />
          <Button
            size="small"
            icon={<UploadOutlined />}
            loading={upload.isUploading}
            onClick={() => fileInputRef.current?.click()}
            style={{ borderRadius: 6 }}
          >
            Đính kèm tệp
          </Button>
        </>
      }
      style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
    >
      <Alert
        type="info"
        showIcon
        message="Danh sách chỉ gồm các tệp bạn tải lên trong phiên này. Hệ thống chưa hỗ trợ lưu danh sách tệp của ticket, nên tệp sẽ không hiển thị lại sau khi tải lại trang."
        style={{ marginBottom: 12 }}
      />

      {uploadFailure && (
        <Alert
          type="error"
          showIcon
          closable
          onClose={upload.clearError}
          message={uploadFailure}
          style={{ marginBottom: 12 }}
        />
      )}

      {downloadFailure && (
        <Alert
          type="error"
          showIcon
          closable
          onClose={download.clearError}
          message={`Không tải xuống được tệp. ${downloadFailure}`}
          style={{ marginBottom: 12 }}
        />
      )}

      {upload.isUploading && (
        <div style={{ marginBottom: 12 }}>
          <Typography.Text style={{ fontSize: 13 }}>Đang tải lên {upload.uploadingFileName}</Typography.Text>
          <Progress percent={upload.progress} size="small" status="active" />
        </div>
      )}

      {attachments.length === 0 ? (
        <Empty
          description="Chưa có tệp đính kèm nào (Tối đa 10 MB: PDF, PNG, JPG, DOCX, TXT, ZIP)."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          {attachments.map((att) => (
            <div
              key={att.storageKey}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'var(--sf2)',
                borderRadius: 6,
                border: '1px solid var(--bd)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PaperClipOutlined style={{ color: 'var(--pr)' }} />
                <span style={{ fontWeight: 500, color: 'var(--tx)' }}>{att.fileName}</span>
                <span style={{ color: 'var(--tx3)', fontSize: 12 }}>
                  ({formatFileSize(att.fileSizeBytes)})
                </span>
              </div>

              <Button
                size="small"
                type="link"
                icon={<DownloadOutlined />}
                loading={download.downloadingKey === att.storageKey}
                onClick={() => download.download({ storageKey: att.storageKey, fileName: att.fileName })}
              >
                Tải xuống
              </Button>
            </div>
          ))}
        </Space>
      )}
    </Card>
  );
}
