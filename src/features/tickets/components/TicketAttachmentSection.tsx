import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Alert, Button, Card, Empty, Progress, Space, Typography } from 'antd';
import { DownloadOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { useAttachmentDownload } from '../hooks/useAttachmentDownload';
import { useUploadAttachment } from '../hooks/useUploadAttachment';
import { useAttachments } from '../hooks/useAttachments';
import { normalizeError } from '@/shared/api/httpError';
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
  const files = useAttachments(ticketId);
  const accessLost = files.isError && [403, 404].includes(normalizeError(files.error).status ?? 0);
  const attachments = accessLost ? [] : files.data ?? [];
  const upload = useUploadAttachment(ticketId);
  const download = useAttachmentDownload(ticketId);

  const uploadFailure = upload.validationError
    ?? (upload.error ? describeTicketError(upload.error, attachmentMessages)?.message ?? null : null);
  const downloadFailure = download.error ? describeTicketError(download.error)?.message ?? null : null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    upload.upload(file);
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
            disabled={!!upload.pendingConfirmation || accessLost}
            onClick={() => fileInputRef.current?.click()}
            style={{ borderRadius: 6 }}
          >
            Đính kèm tệp
          </Button>
        </>
      }
      style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
    >
      {files.isPending && <Typography.Paragraph>Đang tải danh sách tệp…</Typography.Paragraph>}
      {files.isError && <Alert type="error" showIcon message="Không tải được danh sách tệp đính kèm."
        action={<Button onClick={() => { void files.refetch(); }}>Thử lại</Button>} style={{ marginBottom: 12 }} />}
      {upload.pendingConfirmation && !upload.isUploading && <Alert type="warning" showIcon
        message="Tệp đã tải lên nhưng chưa xác nhận lưu. Hãy thử xác nhận lại."
        action={<Space><Button onClick={upload.retryConfirmation}>Xác nhận lại</Button>
          <Button onClick={upload.discardConfirmation}>Chọn tệp khác</Button></Space>} style={{ marginBottom: 12 }} />}

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

      {attachments.length === 0 && !files.isPending && !files.isError ? (
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
