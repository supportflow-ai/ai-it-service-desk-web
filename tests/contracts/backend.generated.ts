// Generated from backend-openapi.json by tools/backend-contract.mjs. Do not edit.

export type AddCommentRequest = {
  "content"?: string | null;
};

export type AddInternalNoteRequest = {
  "content"?: string | null;
};

export type ArchiveArticleRequest = {
  "expectedRevision"?: number | null;
};

export type ArticleDto = {
  "id"?: string;
  "title"?: string | null;
  "content"?: string | null;
  "status"?: ArticleStatus;
  "authorId"?: string;
  "version"?: number;
  "revision"?: number;
  "tags"?: Array<string> | null;
  "createdAt"?: string;
  "updatedAt"?: string;
  "publishedAt"?: string | null;
  "archivedAt"?: string | null;
};

export type ArticleStatus = 0 | 1 | 2;

export type AssignRolesRequest = {
  "roles"?: Array<string> | null;
};

export type AssignTicketRequest = {
  "agentId"?: string;
  "expectedRevision"?: number | null;
};

export type ChangePasswordRequest = {
  "currentPassword"?: string | null;
  "newPassword"?: string | null;
};

export type ConfirmAttachmentUploadRequest = {
  "fileName"?: string | null;
  "fileSizeBytes"?: number;
  "contentType"?: string | null;
  "storageKey"?: string | null;
};

export type CreateDraftArticleRequest = {
  "title"?: string | null;
  "content"?: string | null;
  "tags"?: Array<string> | null;
};

export type CreateTicketCommand = {
  "title"?: string | null;
  "description"?: string | null;
  "categoryId"?: string | null;
};

export type DepartmentDto = {
  "id"?: string;
  "code"?: string | null;
  "name"?: string | null;
  "description"?: string | null;
};

export type DownloadUrlResult = {
  "downloadUrl"?: string | null;
};

export type ForgotPasswordRequest = {
  "email"?: string | null;
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

export type PagedArticleResult = {
  "items"?: Array<ArticleDto> | null;
  "page"?: number;
  "pageSize"?: number;
  "totalCount"?: number;
  "totalPages"?: number;
};

export type PagedTicketResult = {
  "items"?: Array<TicketDto> | null;
  "page"?: number;
  "pageSize"?: number;
  "totalCount"?: number;
};

export type PublishArticleRequest = {
  "expectedRevision"?: number | null;
};

export type RefreshAuthRequest = {
  "refreshToken"?: string | null;
};

export type RegisterRequest = {
  "email": string | null;
  "password": string | null;
  "fullName"?: string | null;
  "role"?: string | null;
};

export type ResetPasswordRequest = {
  "email"?: string | null;
  "otpCode"?: string | null;
  "newPassword"?: string | null;
};

export type RevokeTokenRequest = {
  "refreshToken"?: string | null;
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

export type UpdateDraftArticleRequest = {
  "title"?: string | null;
  "content"?: string | null;
  "tags"?: Array<string> | null;
  "expectedRevision"?: number | null;
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
