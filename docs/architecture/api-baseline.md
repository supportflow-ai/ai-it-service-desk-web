# Frontend API compatibility baseline

This is a pinned compatibility baseline, **not a claim about the latest backend**.
Source backend commit: `f6a0adae01bd642753f02d2beae10abff6f410e3`, preserved in this repository's Git history.
Frontend starting commit: `e6186246e7d01c4dab699eae121a7fda1a5314df`.

## Implemented endpoints

All paths below are relative to the build-time API base URL (`/api` by default).

| Method/path | Request | Success response | Authentication |
| --- | --- | --- | --- |
| POST /auth/login | email, password | token, user | Anonymous |
| POST /auth/register | email, password, fullName | token, user | Anonymous |
| GET /auth/me | None | userId, email, nullable fullName, roles | Session |
| GET /tickets/me | page, pageSize query | items, page, pageSize, totalCount | All three roles; own tickets |
| GET /tickets/{id} | GUID path | TicketDto | All three roles; server enforces visibility |
| POST /tickets | title, description, categoryId | Full TicketDto, status Submitted | All three roles |

TicketDto contains id, ticketNumber, title, description, categoryId, numeric status,
createdAt and optional/nullable requesterDepartmentId; since backend dev `007a258` it also
carries `revision` (see below). The UI does not invent priority, assignment or resolution
data, and never makes up a revision. DTOs already suit the current UI; there is no identity
mapper. Runtime readers validate required response fields.

Source files at the pinned SHA:
- `src/backend/ServiceDesk.Api/Endpoints/{AuthEndpoints,TicketEndpoints}.cs`
- `src/backend/ServiceDesk.Application/Identity/Models/{LoginRequest,UserInfo}.cs`
- `src/backend/ServiceDesk.Application/Ticketing/{Commands/CreateTicketCommand,Dtos/TicketDto}.cs`
- `src/backend/ServiceDesk.Domain/{Identity/RoleNames,Ticketing/Ticket,Ticketing/TicketStatus}.cs`
- `src/backend/ServiceDesk.Api/Program.cs` for policy role unions.

`tests/contracts/ticket-status.json` pins numeric enum values. Auth compile contracts and
MSW response fixtures are handwritten checks against this baseline, not generated OpenAPI.
Keep the source SHA with any coordinated contract update. An approved, versioned OpenAPI
can replace this mechanism later; do not silently switch to another document's wire shape.

## Sprint 2 ticket collaboration endpoints

Pinned to backend `dev` commit `8fe5c43a6832dd22908d8162b94fab6e3bee4735` (PR #31, 2026-10-28),
source `src/backend/ServiceDesk.Api/Endpoints/TicketEndpoints.cs` and the matching
`ServiceDesk.Application/Ticketing/*UseCase.cs`. Used by TC-291, TC-297, TC-302, TC-306 and TC-310.

| Method/path | Request | Success response | Who may call (use case check) |
| --- | --- | --- | --- |
| GET /tickets/queue | page, pageSize (1–100), optional status, category, scope (`unassigned`/`my`) | items, page, pageSize, totalCount; newest first | Agent or Admin |
| POST /tickets/{id}/assign | agentId (GUID) | TicketDto | Agent or Admin; not Closed/Cancelled; Submitted → Assigned |
| POST /tickets/{id}/unassign | None | TicketDto | Agent or Admin; not Closed/Cancelled; Assigned → Submitted |
| POST /tickets/{id}/claim | None | TicketDto | Agent role only; Submitted/Assigned → InProgress |
| POST /tickets/{id}/resolve | None | TicketDto | Agent or Admin; InProgress → Resolved |
| POST /tickets/{id}/close | None | TicketDto | Owner or Admin; Resolved → Closed |
| POST /tickets/{id}/reopen | None | TicketDto | Owner or Admin; Resolved → InProgress |
| POST /tickets/{id}/cancel | None | TicketDto | Owner or Admin; Submitted → Cancelled |
| GET /tickets/{id}/timeline | None | TimelineItemDto[] | All three roles; internal notes only for Agent/Admin |
| POST /tickets/{id}/comments | content (2–4000 chars) | TimelineItemDto, 201 | All three roles |
| POST /tickets/{id}/internal-notes | content (2–4000 chars) | TimelineItemDto, 201 | Agent or Admin |
| POST /tickets/{id}/attachments/upload-url | fileName, fileSizeBytes, contentType | uploadUrl, storageKey, expirySeconds | All three roles; PDF/PNG/JPG/DOCX/TXT/ZIP, ≤ 10 MB |
| GET /tickets/{id}/attachments/download-url | storageKey query | downloadUrl | All three roles |

TimelineItemDto contains id, ticketId, authorId, authorName, authorRole, content, isInternal
and createdAt. Presigned URLs must be absolute http(s); uploads go straight to storage with
a separate HTTP client so the API bearer token is never sent there.

### Revision and attachment metadata

Pinned to backend `dev` commit `007a2589086970157a99f51d7792b9a418ed0487` (2026-11-03), same
source files plus `ServiceDesk.Application/Ticketing/{Contracts/AttachmentContracts,ConfirmAttachmentUpload/*,GetTicketAttachments/*}.cs`
and `ServiceDesk.Infrastructure/Storage/MinioObjectStorageService.cs`. This changes the rows above:

| Method/path | Request | Success response | Notes |
| --- | --- | --- | --- |
| Every TicketDto response | — | adds `revision` (non-negative integer) | Required by the reader; a ticket without it is an invalid response |
| POST /tickets/{id}/assign | agentId, expectedRevision (body) | TicketDto | Stale revision → 409 |
| POST /tickets/{id}/{unassign,claim,resolve,close,reopen,cancel} | `expectedRevision` query, no body | TicketDto | Stale revision → 409 |
| POST /tickets/{id}/attachments/upload-url | unchanged | adds nullable `formData` (string map) | Present: multipart POST of every field, then `file`. Absent/null: raw PUT |
| POST /tickets/{id}/attachments/confirm | fileName, fileSizeBytes, contentType, storageKey (as sent to upload-url) | TicketAttachmentDto, 201 | Required: without it the file is not attached to the ticket |
| GET /tickets/{id}/attachments | None | TicketAttachmentDto[], newest first | All three roles, same ticket scope as detail |

TicketAttachmentDto contains id, ticketId, fileName, fileSizeBytes, contentType, storageKey
(the confirmed, ticket-owned key used for download-url), uploadedBy and createdAt.

Status and assignment commands send the revision of the ticket on screen. A 409 shows
"ticket was changed by someone else" with a reload button; reloading clears that error, and the
write is never retried. The backend's revision is the PostgreSQL `xmin` and it skips the check
when the expected or current revision is 0, so 0 gives no conflict protection: a backend gap.
An upload is done only after confirm succeeds; the list is then refreshed from the server.

Rejected lifecycle transitions return 400, permission failures 403 and out-of-scope
tickets 404. The UI explains each case and offers a reload for 400/409; it never retries a write.

How the UI follows backend `007a258` (TicketDto also carries `requesterId` and nullable
`assignedToId`, both required by the reader):
- Close/reopen/cancel are shown to the ticket's requester (`requesterId` = the signed-in user,
  whatever their role) and to Admin, as the use cases allow.
- Claim and self-assign are shown to Agent and Admin. Claim is offered on Submitted and
  Assigned tickets, like the backend, which does not check who holds an Assigned ticket.
- "Phụ trách" reads `assignedToId`: none → "Chưa phân công", the signed-in user → "Bạn",
  anyone else → "Đã phân công". The backend sends no assignee name; `GET /api/users` exists
  but returns emails, so it is not used and "assign to another agent" stays locked.
- Unassign is offered only on Assigned tickets: the backend also accepts InProgress but then
  leaves the ticket in progress with nobody holding it.
- Queue scopes filter on the assignee and leave out Closed/Cancelled; the tab descriptions say so.
- Status and assignment changes appear in the timeline as `authorRole: "System"` entries,
  shown as "Hệ thống". `authorName` of people is the account's user name, today its email.
- TicketDto has `priority`, but every new ticket gets the default P3 and the queue cannot
  filter or sort by it, so priority is not shown and its filter stays locked.
- The historical TC-294 team-membership policy is not implemented.

## Not enabled

AI HTTP endpoints are not used yet: backend dev 8fe5c43 exposes no triage result or review
decision endpoint, persists no AIAnalysis/AISuggestion, and its classifier is a NoOp (TC-277
records "dev integration BLOCKED"). The workspace AI slot (`WorkspaceTriagePanel`, injected by
the App) therefore shows the not-enabled state. Review decisions (accept, override with a
required reason, reject) are built against an injected handler and stay locked with a stated
reason until a review endpoint and a ticket revision exist; `reason` has no backend field yet
(`AISuggestion.Override` takes only the final value). Their UI remains
visibly unsupported/disabled. There is no production mock, endpoint probing, guessed `If-Match`,
self-assignment identity or default ticket revision. AI panels remain available as presentation
components with async callbacks for a later reviewed integration. Missing revision, stale and
manual-only suggestions cannot be applied.

The existing create endpoint supports optional Idempotency-Key, but this refactor preserves
the existing request behavior and disables automatic write retries. Create is not advertised
as retry-safe. A future idempotency change needs stable per-intent keys and dedicated tests.

## Architecture and validation

Read the root AGENTS.md for ownership and agent workflow. App bootstrap injects HTTP config
and Auth callbacks; Shared never imports App or accesses session storage. Query keys include a
monotonic session version, never the token. Session transitions cancel and clear private queries.
Writes to an existing ticket go through `useTicketWrite` (never retried, mutation key
`['tickets', version, 'write', ticketId, change, action]`; while any `state` write for a ticket
is pending, every status and assignment control for it is disabled; a 404 reloads the ticket so
the workspace shows not-found instead of stale data) and invalidate per `ticketInvalidation` in
`api/ticketQueries.ts`: a status or assignment change refreshes the ticket, its timeline, the
requester list and the agent queue; a comment or internal note refreshes only the timeline;
a confirmed upload refreshes only the attachment list; a new ticket refreshes the two lists.
A 403/404 on a ticket, timeline or attachment read hides the cached copy on both the requester
detail page and the agent workspace.

Feature dependency allowlist: tickets → auth; ai-assistance → tickets. External consumers
use feature-root index.ts. ESLint Boundaries and TypeScript AST/resolved-module graph checks
enforce imports, re-exports, dynamic/type imports and cycles. Component/unit tests are colocated;
test HTTP fixtures live outside production source.

Vitest/MSW integration and Playwright/HTTP-fixture browser smoke tests do not prove a live
backend integration. Run backend acceptance separately against an explicitly selected version.
