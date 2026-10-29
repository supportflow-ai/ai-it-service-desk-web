import { useRef, useState } from 'react';
import { Alert, Button, Card, Empty, Space } from 'antd';
import { DownloadOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { useUploadAttachment } from '../hooks/useUploadAttachment';
import type { UploadedAttachment } from '../hooks/useUploadAttachment';

interface TicketAttachmentSectionProps {
  ticketId: string;
}

export function TicketAttachmentSection({ ticketId }: TicketAttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const { uploadFile, isUploading, uploadError, downloadAttachment } = useUploadAttachment(ticketId);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploaded = await uploadFile(file);
      setAttachments((prev) => [...prev, uploaded]);
    } catch {
      // Error handled by hook state
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
            accept=".pdf,.png,.jpg,.jpeg,.docx,.txt,.zip"
          />
          <Button
            size="small"
            icon={<UploadOutlined />}
            loading={isUploading}
            onClick={() => fileInputRef.current?.click()}
            style={{ borderRadius: 6 }}
          >
            Đính kèm tệp
          </Button>
        </>
      }
      style={{ borderRadius: 8, borderColor: 'var(--bd)', background: 'var(--sf)' }}
    >
      {uploadError && (
        <Alert
          type="error"
          showIcon
          message={uploadError}
          style={{ marginBottom: 12 }}
        />
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
                onClick={() => downloadAttachment(att.storageKey, att.fileName)}
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
