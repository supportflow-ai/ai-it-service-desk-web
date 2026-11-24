import type { TicketDto, TicketAttachmentDto, UploadUrlResult } from '../../src/features/tickets/model/ticket.types';
import type * as Backend from './backend.generated';

// Compile against the generated wire shape. Runtime readers retain their own validation.
// The backend can send `sla`, `firstResponse` and `resolution` as null (TicketProjection sets them
// explicitly), but OpenAPI cannot express a nullable object reference, so the generated types omit `null`.
// Widen only these three fields; everything else is still compared strictly.
type SlaWire = Omit<Backend.SlaSummaryDto, 'firstResponse' | 'resolution'> & {
  firstResponse?: Backend.SlaClockSummaryDto | null;
  resolution?: Backend.SlaClockSummaryDto | null;
};
type TicketWire = Omit<Backend.TicketDto, 'sla'> & { sla?: SlaWire | null };
export const ticketWire = (value: TicketDto): TicketWire => value;
export const attachmentWire = (value: TicketAttachmentDto): Backend.TicketAttachmentDto => value;
export const uploadWire = (value: UploadUrlResult): Backend.UploadUrlResult => value;
