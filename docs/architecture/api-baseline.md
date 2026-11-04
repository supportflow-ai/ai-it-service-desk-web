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
write is never retried. The backend's revision is the PostgreSQL `xmin`. An upload is done only
after confirm succeeds; the list is then refreshed from the server.

### Priority, agent directory and ended tickets

Pinned to backend `dev` commit `f82f0b2` (PR #38, `fix/sprint2-backend-review`, 2026-11-04),
source `ServiceDesk.Api/Endpoints/{AuthEndpoints,TicketEndpoints}.cs`,
`ServiceDesk.Application/Identity/GetUsersByRole/*`, `ServiceDesk.Application/Ticketing/*UseCase.cs`
and `ServiceDesk.Infrastructure/Ticketing/PostgresTicketQueries.cs`. This changes the rows above:

| Method/path | Request | Success response | Notes |
| --- | --- | --- | --- |
| Every TicketDto response | — | nullable `priority`: `P1`–`P4` | Computed by the backend (impact × urgency); any other value is an invalid response |
| GET /tickets/queue | adds optional `priority` (`P1`–`P4`) and `sortByPriority` (bool) | unchanged | Sorted P1 → P4, then newest; unknown priority → 400 |
| GET /users | `role=Agent` (Agent or Admin only) | `{ userId, fullName }[]`, no email | 403 for a requester; `fullName` may be null |
| Every status and assignment command | `expectedRevision` now required | unchanged | Missing or 0 → 400 |
| POST /tickets/{id}/claim | unchanged | unchanged | An Assigned ticket held by another agent → 403, unless Admin |
| POST /tickets/{id}/unassign | unchanged | unchanged | Only an Assigned ticket |
| POST /tickets/{id}/comments, attachments/upload-url, attachments/confirm | unchanged | unchanged | Closed or Cancelled ticket → 400. Internal notes and downloads are still accepted |
| POST /auth/register | unchanged | unchanged | `fullName` is now stored, so it comes back from login and `/auth/me` |
| POST /tickets | optional `Idempotency-Key` header | unchanged | Same key and content within 10 minutes returns the ticket already created; same key, other content → 409 |
| POST /tickets/{id}/update | title, description, categoryId, expectedRevision (body) | TicketDto | Owner or Admin; only Submitted (else 400); same field rules as create; stale revision → 409 |

Rejected lifecycle transitions return 400, permission failures 403 and out-of-scope
tickets 404. The UI explains each case and offers a reload for 400/409; it never retries a write.

How the UI follows backend `007a258` (TicketDto also carries `requesterId` and nullable
`assignedToId`, both required by the reader):
- Close/reopen/cancel are shown to the ticket's requester (`requesterId` = the signed-in user,
  whatever their role) and to Admin, as the use cases allow.
- Claim and self-assign are shown to Agent and Admin. Claim is offered on Submitted tickets and
  on Assigned tickets held by the viewer; an Admin may also claim one held by someone else.
- "Phụ trách" reads `assignedToId`: none → "Chưa phân công", the signed-in user → "Bạn",
  anyone else → their name from `GET /api/users?role=Agent` (staff only), or "Đã phân công"
  if they are not listed. An agent without a name is shown with the start of their id.
- Staff can assign any ticket that has not ended to an agent picked by name from that list.
- Unassign is offered only on Assigned tickets, as the backend requires.
- On a Closed or Cancelled ticket the requester screen takes no reply and no new file; the
  workspace keeps internal notes only. Existing files stay downloadable.
- Creating a ticket sends an `Idempotency-Key`: the same key while the content is unchanged (so
  resending after a failure or a lost response cannot create a duplicate), a new one once the
  content changes or a ticket was created.
- Login answers a bare 401 for a wrong password and for an account locked after 5 failures (15
  minutes), so the login page says both in one message.
- "Sửa yêu cầu" is offered to the requester on their screen and to Admin on the workspace while
  the ticket is Submitted. The dialog opens on the ticket as loaded and saves with its revision;
  on 400/409 it keeps the typed changes and offers a reload.
- Files can be chosen on the create screen (US-062), checked against the upload limits as they
  are picked. Upload needs a ticket id, so the ticket is created first and each file then goes
  through upload-url → storage → confirm. A failed file does not undo the ticket: its page names
  the files to attach again.
- Queue scopes filter on the assignee and leave out Closed/Cancelled; the tab descriptions say so.
- Status and assignment changes appear in the timeline as `authorRole: "System"` entries,
  shown as "Hệ thống". `authorName` of people is the account's user name, today its email.
- Priority is shown in the queue and the workspace sidebar ("Chưa có" when null). The queue
  filters by it and can sort highest priority first; both are kept in the URL
  (`priority=P1`, `sort=priority`). New tickets get the default P3.
- The historical TC-294 team-membership policy is not implemented.

## Screens and roles

Product source: PRD v1.1 and Implementation Specification v1.2 (baseline 28/08/2026), mapped onto
what backend `007a258` implements. Every screen shows one perspective, whatever roles the viewer has.

| Screen | Who | What it offers |
| --- | --- | --- |
| `/` Tổng quan | Requester-only accounts (Agent/Admin are sent to `/agent-workspace`, PRD J-02) | Own tickets from `GET /tickets/me` (up to 100, counted by status); empty/loading/error states, never sample data; knowledge base locked |
| `/tickets/new`, `/requester-dashboard/tickets` | Every role | Create (with files, attached once the ticket exists) and list own tickets (PR-01, US-062) |
| `/requester-dashboard/tickets/:id` | Every role, as the ticket's requester (US-021) | Owner commands only (edit/cancel while Submitted, close/reopen when Resolved, when `requesterId` is the viewer), public timeline and public comments, attachments. No internal notes, internal composer, claim or resolve, even for staff viewing their own request. Staff opening someone else's ticket here are sent to `/agent-workspace/tickets/:id` |
| `/agent-workspace`, `/agent-workspace/tickets/:id` | Agent, Admin | Queue, assignment, claim, resolve, public comment and internal note (UX-05); Admin may also close/reopen/cancel, as the backend allows |
| `/admin-panel` | Admin | Not supported yet: no admin endpoints |

The menu follows the same split (Requester: Tổng quan, Tạo yêu cầu, Yêu cầu của tôi; staff: Hàng
đợi xử lý, Yêu cầu của tôi, Tạo yêu cầu, plus Quản trị hệ thống for Admin) and the sidebar names the
real roles. Signing out returns to a clean login page, so the next account never lands on the
previous one's page; only an expired session returns to where it was. Every tab follows a sign-in,
account switch or sign-out made in another tab.

Required by the PRD/Spec but not implemented by the backend, so not offered in the UI: the Lead
role and team scope (FR-AUTH-05/06; the queue returns every ticket to any staff member), Draft and
Submit as separate steps, Triage, Start, Request information/Resume, a required resolution summary
and reopen reason (FR-TKT-05/06), knowledge base, AI analysis and decisions, attachment delete
(FR-FILE-05). Accounts created before PR #38 have no stored full name, so they are greeted by
email.

## Knowledge Base

Backend dev `1506a5b` (PR #39) adds `/api/knowledge/articles`. The routes, actions and permissions
the UI will follow, and the gaps against the team contract, are in
[knowledge-ui-access-map.md](knowledge-ui-access-map.md) (TC-332). The Agent/Admin UI (TC-218) is
built against them:
- `/knowledge/manage` (Agent, Admin) lists `GET /knowledge/articles` with status/tag/query filters
  kept in the URL. The backend returns other authors' unpublished articles to Agents (gap G1); those
  rows are shown locked, since opening them would only give 404.
- The requester dashboard knowledge card stays locked: reading for requesters is not part of TC-218.

## Not enabled

AI HTTP endpoints are not used yet: backend dev f82f0b2 still exposes no triage result or review
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
