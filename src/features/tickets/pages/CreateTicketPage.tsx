import { useState } from 'react';
import type { ReactNode } from 'react';
import { Card, Col, Form, Progress, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '@/shared/ui/ErrorState';
import { useCreateTicket } from '../hooks/useCreateTicket';
import { useUploadNewTicketFiles } from '../hooks/useUploadNewTicketFiles';
import { CreateTicketForm } from '../components/CreateTicketForm';
import type { CreatedTicketState } from '../lib/createdTicketState';
import type { CreateTicketPayload } from '../model/ticket.types';

const { Title } = Typography;

interface CreateTicketPageProps {
  /** Composed by the App: tickets must not depend on ai-assistance, so the AI side panel is injected. */
  aiPanel?: ReactNode;
}

export function CreateTicketPage({ aiPanel }: CreateTicketPageProps = {}) {
  const [form] = Form.useForm<CreateTicketPayload>();
  const create = useCreateTicket();
  const uploads = useUploadNewTicketFiles();
  const [files, setFiles] = useState<File[]>([]);
  const navigate = useNavigate();

  // The ticket comes first: a file can only be attached to a ticket that exists. A file that
  // fails does not undo the ticket; its page says which ones to attach again.
  const submit = async (payload: CreateTicketPayload) => {
    let ticketId: string;
    try {
      ticketId = (await create.mutateAsync(payload)).id;
    } catch {
      return; // The mutation error is rendered above; the chosen files are kept for a retry.
    }
    let failedUploads: string[];
    try {
      failedUploads = await uploads.uploadAll(ticketId, files);
    } catch {
      return; // The session changed: this screen belongs to the previous account.
    }
    const state: CreatedTicketState | undefined = failedUploads.length > 0 ? { failedUploads } : undefined;
    navigate(`/requester-dashboard/tickets/${ticketId}`, { state });
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Title level={2} style={{ margin: '0 0 20px', fontWeight: 700 }}>
        Tạo yêu cầu
      </Title>

      {create.error && <ErrorState error={create.error} />}

      <Row gutter={[24, 24]} align="top">
        <Col xs={24} lg={aiPanel ? 15 : 24}>
          <Card
            bordered
            style={{
              borderRadius: 8,
              borderColor: 'var(--bd)',
              background: 'var(--sf)',
            }}
          >
            <CreateTicketForm
              form={form}
              pending={create.isPending || uploads.progress !== null}
              files={files}
              onFilesChange={setFiles}
              onCancel={() => navigate('/requester-dashboard/tickets')}
              onSubmit={submit}
            />
            {uploads.progress && (
              <div style={{ marginTop: 12 }} role="status">
                <Typography.Text style={{ fontSize: 13 }}>
                  Đã tạo yêu cầu. Đang tải tệp {uploads.progress.current}/{uploads.progress.total}: {uploads.progress.fileName}
                </Typography.Text>
                <Progress percent={uploads.progress.percent} size="small" status="active" />
              </div>
            )}
          </Card>
        </Col>

        {/* AI is side assistance (PRD UX-02): submitting never depends on it. */}
        {aiPanel && <Col xs={24} lg={9}>{aiPanel}</Col>}
      </Row>
    </div>
  );
}
