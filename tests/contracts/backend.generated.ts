// Generated from backend-openapi.json by tools/backend-contract.mjs. Do not edit.

export type AddCommentRequest = {
  "content"?: string | null;
};

export type AddInternalNoteRequest = {
  "content"?: string | null;
};

export type AddTeamMemberRequest = {
  "userId"?: string;
  "isLead"?: boolean;
};

export type AgentTriageView = {
  "outcome": TriageOutcome;
  "suggestedCategory"?: TicketCategory;
  "suggestedImpact"?: Impact;
  "suggestedUrgency"?: Urgency;
  "categoryScore"?: number | null;
  "impactScore"?: number | null;
  "urgencyScore"?: number | null;
  "categoryConfidence"?: ConfidenceBand;
  "impactConfidence"?: ConfidenceBand;
  "urgencyConfidence"?: ConfidenceBand;
  "requiresManualTriage"?: boolean;
  "failureReason"?: string | null;
  "validationErrors"?: Array<string> | null;
};

export type AgentWorkloadDto = {
  "agentId"?: string;
  "agentName"?: string | null;
  "activeTicketCount"?: number;
  "resolvedTicketCount"?: number;
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

export type ArticleVersionDto = {
  "id"?: string;
  "articleId"?: string;
  "versionNumber"?: number;
  "title"?: string | null;
  "content"?: string | null;
  "publishedById"?: string;
  "publishedAt"?: string;
};

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

export type ConfidenceBand = 0 | 1 | 2;

export type ConfirmAttachmentUploadRequest = {
  "fileName"?: string | null;
  "fileSizeBytes"?: number;
  "contentType"?: string | null;
  "storageKey"?: string | null;
};

export type CreateDepartmentRequest = {
  "code"?: string | null;
  "name"?: string | null;
  "description"?: string | null;
};

export type CreateDraftArticleRequest = {
  "title"?: string | null;
  "content"?: string | null;
  "tags"?: Array<string> | null;
};

export type CreateSupportTeamRequest = {
  "code"?: string | null;
  "name"?: string | null;
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

export type Impact = 0 | 1 | 2;

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

export type PendingTicketRequest = {
  "status"?: TicketStatus;
  "expectedRevision"?: number | null;
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

export type RepublishArticleRequest = {
  "title"?: string | null;
  "content"?: string | null;
  "tags"?: Array<string> | null;
  "expectedRevision"?: number | null;
};

export type RequesterTriageView = {
  "outcome": TriageOutcome;
  "suggestedCategory"?: TicketCategory;
  "categoryConfidence"?: ConfidenceBand;
  "requiresManualTriage"?: boolean;
  "failureReason"?: string | null;
};

export type ResetPasswordRequest = {
  "email"?: string | null;
  "otpCode"?: string | null;
  "newPassword"?: string | null;
};

export type ResolveTicketRequest = {
  "resolutionNote"?: string | null;
  "expectedRevision"?: number | null;
};

export type RevokeTokenRequest = {
  "refreshToken"?: string | null;
};

export type SlaClockSummaryDto = {
  "targetMinutes"?: number | null;
  "elapsedMinutes"?: number | null;
  "remainingMinutes"?: number | null;
  "deadline"?: string | null;
  "isBreached"?: boolean;
  "state"?: string | null;
};

export type SlaPerformanceReportDto = {
  "totalTickets"?: number;
  "resolvedTickets"?: number;
  "firstResponseBreachedCount"?: number;
  "firstResponseComplianceRate"?: number;
  "resolutionBreachedCount"?: number;
  "resolutionComplianceRate"?: number;
  "averageMttaMinutes"?: number;
  "averageMttrMinutes"?: number;
};

export type SlaSummaryDto = {
  "isApplicable"?: boolean;
  "evaluatedAt"?: string;
  "overallStatus"?: string | null;
  "firstResponse"?: SlaClockSummaryDto;
  "resolution"?: SlaClockSummaryDto;
};

export type SupportTeamDto = {
  "id"?: string;
  "code"?: string | null;
  "name"?: string | null;
  "isTriageQueue"?: boolean;
  "isActive"?: boolean;
  "members"?: Array<SupportTeamMemberDto> | null;
};

export type SupportTeamMemberDto = {
  "userId"?: string;
  "displayName"?: string | null;
  "isLead"?: boolean;
};

export type TagSummaryDto = {
  "name"?: string | null;
  "articleCount"?: number;
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

export type TicketCategory = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type TicketCategoryMetadataDto = {
  "code"?: string | null;
  "name"?: string | null;
  "description"?: string | null;
  "defaultPriority"?: string | null;
};

export type TicketDistributionReportDto = {
  "byStatus"?: Record<string, number> | null;
  "byPriority"?: Record<string, number> | null;
  "byCategory"?: Record<string, number> | null;
  "byAssignee"?: Array<AgentWorkloadDto> | null;
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
  "sla"?: SlaSummaryDto;
};

export type TicketStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

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

export type TransferTicketRequest = {
  "targetTeamId"?: string;
  "reason"?: string | null;
  "expectedRevision"?: number | null;
};

export type TriageDecisionRequest = {
  "decision"?: TriageDecisionType;
  "impact"?: Impact;
  "urgency"?: Urgency;
  "categoryId"?: string | null;
  "reason"?: string | null;
  "expectedRevision"?: number | null;
};

export type TriageDecisionResultDto = {
  "ticketId"?: string;
  "decision"?: TriageDecisionType;
  "appliedToTicket"?: boolean;
  "message"?: string | null;
};

export type TriageDecisionType = 1 | 2 | 3;

export type TriageOutcome = 0 | 1 | 2 | 3 | 4;

export type TriageTicketRequest = {
  "impact"?: Impact;
  "urgency"?: Urgency;
  "expectedRevision"?: number | null;
};

export type UpdateCurrentUserProfileRequest = {
  "fullName"?: string | null;
  "phoneNumber"?: string | null;
};

export type UpdateDepartmentRequest = {
  "name"?: string | null;
  "description"?: string | null;
};

export type UpdateDraftArticleRequest = {
  "title"?: string | null;
  "content"?: string | null;
  "tags"?: Array<string> | null;
  "expectedRevision"?: number | null;
};

export type UpdateSupportTeamRequest = {
  "name"?: string | null;
  "isActive"?: boolean;
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
  "requiredHeaders"?: Record<string, string> | null;
};

export type Urgency = 0 | 1 | 2;

export type UserInfo = {
  "userId": string | null;
  "email": string | null;
  "fullName"?: string | null;
  "phoneNumber"?: string | null;
  "roles"?: Array<string> | null;
};
