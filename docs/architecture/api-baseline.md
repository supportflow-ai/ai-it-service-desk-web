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

## Not enabled

Timeline, comments/internal notes, assignment, lifecycle commands, attachments and AI HTTP
endpoints are not confirmed in this baseline. Their UI remains visibly unsupported/disabled.
There is no production mock, endpoint probing, guessed `If-Match`, self-assignment identity
or default ticket revision. AI panels remain available as presentation components with async
callbacks for a later reviewed integration. Missing revision, stale and manual-only suggestions
cannot be applied.

The existing create endpoint supports optional Idempotency-Key, but this refactor preserves
the existing request behavior and disables automatic write retries. Create is not advertised
as retry-safe. A future idempotency change needs stable per-intent keys and dedicated tests.

## Architecture and validation

Read the root AGENTS.md for ownership and agent workflow. App bootstrap injects HTTP config
and Auth callbacks; Shared never imports App or accesses session storage. Query keys include a
monotonic session version, never the token. Session transitions cancel and clear private queries.

Feature dependency allowlist: tickets → auth; ai-assistance → tickets. External consumers
use feature-root index.ts. ESLint Boundaries and TypeScript AST/resolved-module graph checks
enforce imports, re-exports, dynamic/type imports and cycles. Component/unit tests are colocated;
test HTTP fixtures live outside production source.

Vitest/MSW integration and Playwright/HTTP-fixture browser smoke tests do not prove a live
backend integration. Run backend acceptance separately against an explicitly selected version.
