import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Alert, Button, Card, Empty, Progress, Skeleton, Space, Typography } from 'antd';
import { DownloadOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useAttachmentDownload } from '../hooks/useAttachmentDownload';
import { useTicketAttachments } from '../hooks/useTicketAttachments';
import { useUploadAttachment } from '../hooks/useUploadAttachment';
import { describeTicketError, isAccessLostError } from '../lib/ticketErrorMessage';
import type { TicketStatus } from '../model/ticket.types';
import { canAttachFiles } from '../model/ticketPermissions';
import { ATTACHMENT_ACCEPT } from '../validation/attachmentRules';

interface TicketAttachmentSectionProps {
  ticketId: string;
  /** An ended ticket keeps its files downloadable but takes no new ones. */
  status: TicketStatus;
}

const attachmentMessages = {
  400: 'Không thể đính kèm tệp: chỉ chấp nhận PDF, PNG, JPG, DOCX, TXT, ZIP tối đa 10 MB, hoặc yêu cầu tải lên đã hết hạn. Vui lòng chọn lại tệp.',
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Callers must remount this section (key={ticketId}) when the ticket changes. */
export function TicketAttachmentSection({ ticketId, status }: TicketAttachmentSectionProps) {
  const allowUpload = canAttachFiles({ status });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachments = useTicketAttachments(ticketId);
  const upload = useUploadAttachment(ticketId);
  const download = useAttachmentDownload(ticketId);
  const items = attachments.data && !isAccessLostError(attachments.error) ? attachments.data : [];

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
          <span>Tệp đính kèm ({items.length})</span>
        </div>
      }
      extra={allowUpload ? (
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
      ) : (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>Ticket đã kết thúc: không đính kèm thêm được</Typography.Text>
      )}
      style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
    >
      {attachments.error && (
        <div style={{ marginBottom: 12 }}>
          <ErrorState error={attachments.error} onRetry={() => { void attachments.refetch(); }} />
        </div>
      )}

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

      {attachments.isPending && <Skeleton active paragraph={{ rows: 1 }} />}

      {!attachments.isPending && !attachments.error && items.length === 0 && (
        <Empty
          description={allowUpload ? 'Chưa có tệp đính kèm nào (Tối đa 10 MB: PDF, PNG, JPG, DOCX, TXT, ZIP).' : 'Chưa có tệp đính kèm nào.'}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}

      {items.length > 0 && (
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          {items.map((att) => (
            <div
              key={att.id}
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
