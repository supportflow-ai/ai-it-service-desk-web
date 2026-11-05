// Generated from backend-openapi.json by tools/backend-contract.mjs. Do not edit.

export type AddCommentRequest = {
  "content"?: string | null;
};

export type AddInternalNoteRequest = {
  "content"?: string | null;
};

export type AssignTicketRequest = {
  "agentId"?: string;
  "expectedRevision"?: number | null;
};

export type ConfirmAttachmentUploadRequest = {
  "fileName"?: string | null;
  "fileSizeBytes"?: number;
  "contentType"?: string | null;
  "storageKey"?: string | null;
};

export type CreateTicketCommand = {
  "title"?: string | null;
  "description"?: string | null;
  "categoryId"?: string | null;
};

export type DownloadUrlResult = {
  "downloadUrl"?: string | null;
};

export type GenerateUploadUrlRequest = {
  "fileName"?: string | null;
  "fileSizeBytes"?: number;
  "contentType"?: string | null;
};

export type LoginRequest = {
  "email": string | null;
  "password": string | null;
};

export type PagedTicketResult = {
  "items"?: Array<TicketDto> | null;
  "page"?: number;
  "pageSize"?: number;
  "totalCount"?: number;
};

export type RegisterRequest = {
  "email": string | null;
  "password": string | null;
  "fullName"?: string | null;
  "role"?: string | null;
};

export type TicketAttachmentDto = {
  "id"?: string;
  "ticketId"?: string;
  "fileName"?: string | null;
  "fileSizeBytes"?: number;
  "contentType"?: string | null;
  "storageKey"?: string | null;
  "uploadedBy"?: string;
  "createdAt"?: string;
};

export type TicketDto = {
  "id"?: string;
  "ticketNumber"?: string | null;
  "title"?: string | null;
  "description"?: string | null;
  "categoryId"?: string | null;
  "status"?: number;
  "createdAt"?: string;
  "requesterDepartmentId"?: string | null;
  "requesterId"?: string;
  "assignedToId"?: string | null;
  "assignedAt"?: string | null;
  "updatedAt"?: string | null;
  "revision"?: number;
  "priority"?: string | null;
  "impact"?: string | null;
  "urgency"?: string | null;
};

export type TimelineItemDto = {
  "id"?: string;
  "ticketId"?: string;
  "authorId"?: string;
  "authorName"?: string | null;
  "authorRole"?: string | null;
  "content"?: string | null;
  "isInternal"?: boolean;
  "createdAt"?: string;
};

export type UpdateTicketRequest = {
  "title"?: string | null;
  "description"?: string | null;
  "categoryId"?: string | null;
  "expectedRevision"?: number | null;
};

export type UploadUrlResult = {
  "uploadUrl"?: string | null;
  "storageKey"?: string | null;
  "expirySeconds"?: number;
  "formData"?: Record<string, string> | null;
};

export type UserInfo = {
  "userId": string | null;
  "email": string | null;
  "fullName"?: string | null;
  "roles"?: Array<string> | null;
};
