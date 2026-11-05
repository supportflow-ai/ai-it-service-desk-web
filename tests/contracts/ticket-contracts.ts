import type { TicketDto, TicketAttachmentDto, UploadUrlResult } from '../../src/features/tickets/model/ticket.types';
import type * as Backend from './backend.generated';

// Compile against the generated wire shape. Runtime readers retain their own validation.
export const ticketWire = (value: TicketDto): Backend.TicketDto => value;
export const attachmentWire = (value: TicketAttachmentDto): Backend.TicketAttachmentDto => value;
export const uploadWire = (value: UploadUrlResult): Backend.UploadUrlResult => value;
