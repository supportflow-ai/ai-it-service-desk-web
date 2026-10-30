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
createdAt and optional/nullable requesterDepartmentId. The UI does not invent priority,
assignment, resolution, revision or concurrency data. DTOs already suit the current UI;
there is no identity mapper. Runtime readers validate required response fields.

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

Rejected lifecycle transitions return 400, permission failures 401/403 and out-of-scope
tickets 404. The UI explains each case and offers a reload for 400/409; it never retries a write.
TicketDto has no requester id, so close/reopen/cancel are shown only to Admin and to Requester
accounts without a staff role, whose ticket reads the server scopes to their own tickets.

Known backend gaps at this commit, reflected in the UI rather than papered over:
- No attachment list/metadata endpoint: the UI lists only files uploaded in the current
  session and says so.
- Timeline entries are kept in memory on the server and carry the user id as `authorName`;
  the UI shows a role label instead of an id. Status transitions are not recorded as
  timeline events.
- Claim by an Admin-only account is rejected with 401, so the UI hides claim for Admin.
- Queue scopes are status-based: `unassigned` returns Submitted tickets and `my` returns every
  InProgress ticket, not only the caller's. The "Của tôi" tab says so. There is no priority
  field, priority filter or sort parameter, so the priority filter stays locked and the order
  is fixed to newest first.
- TicketDto has no assignee id or name and there is no agent directory endpoint. The UI only
  offers self-assign (agentId = the signed-in Agent's userId) on Submitted tickets and
  unassign on Assigned tickets, reads "assigned/unassigned" from those two statuses, and keeps
  "assign to another agent" locked. The server does not validate agentId, any staff member can
  unassign, Claim does not record an assignee, and no assignment audit event exists. The
  historical TC-294 policy (team membership, revision, 409) is not implemented.

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
a new ticket refreshes the two lists.

Feature dependency allowlist: tickets → auth; ai-assistance → tickets. External consumers
use feature-root index.ts. ESLint Boundaries and TypeScript AST/resolved-module graph checks
enforce imports, re-exports, dynamic/type imports and cycles. Component/unit tests are colocated;
test HTTP fixtures live outside production source.

Vitest/MSW integration and Playwright/HTTP-fixture browser smoke tests do not prove a live
backend integration. Run backend acceptance separately against an explicitly selected version.
