# Frontend API compatibility baseline

## Đối chiếu ngày 2026-11-13

Snapshot OpenAPI trong `tests/contracts/` đang ghim backend `0f189b5e2befd214f8cf50ce330e6f13e0380c64` (sha256 `3884d37d…`, khớp với tệp `backend-openapi.json`). Baseline của backend `dev` tại `07ce07a` có hash khác (`c60fa717…`). Không có đường dẫn hay schema mới, nhưng sáu thao tác đã đổi chi tiết phản hồi hoặc ràng buộc: `POST /api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/forgot-password`, `/api/auth/reset-password` và `POST /api/tickets/{id}/attachments/confirm`. Các thay đổi đến từ hai commit backend chạm baseline sau mốc ghim: `bb1577c` (Identity) và `dcd104e` (PR #65, hạn mức tệp đính kèm và lock timeout). **Chưa đồng bộ vào snapshot**; cần cập nhật có phối hợp theo mục 22 của [AGENTS.md](../../AGENTS.md) trước khi nghiệm thu với backend `dev`.

Từ backend PR #64 (B1-PR3, [ADR-016](https://github.com/supportflow-ai/ai-it-service-desk/blob/main/docs/adr/ADR-016-support-team-routing-and-agent-scope.md)), Agent chỉ đọc phiếu thuộc nhóm hỗ trợ đang hoạt động mà mình là thành viên hoặc phiếu được phân công trực tiếp; Admin đọc toàn hệ thống; phiếu ngoài phạm vi trả 404. Các đoạn bên dưới nói hàng đợi trả mọi phiếu cho mọi nhân viên, hoặc Lead và phạm vi nhóm chưa có, mô tả mốc backend cũ hơn. Giao diện hàng đợi đã có lời giải thích theo quyền đọc mới (commit `eb7d0e5`); chưa kiểm lại từng màn hình với backend thật.

## Đối chiếu tích hợp MVP ngày 05/11/2026

Đối chiếu [Web `main@ade7af4`](https://github.com/supportflow-ai/ai-it-service-desk-web/commit/ade7af4e1b88e7834c8d9b225f68eb7ebd75f9fe) với [Backend `main@bf38ef9`](https://github.com/supportflow-ai/ai-it-service-desk/commit/bf38ef903f46f6ea21f80da44c11d437391a9efb). Snapshot Web ghim Backend `dev@febb4d7` và khớp từng byte với OpenAPI trên Backend `main@bf38ef9`. [Mốc nguồn và checksum](../../tests/contracts/backend-source.json)

| Luồng | Điểm đối chiếu |
| --- | --- |
| Danh bạ Agent | Bộ đọc chấp nhận `userId` và `fullName` tùy chọn theo dữ liệu trả về từ `GET /api/users?role=Agent` |
| Nhận và hủy phân công | Agent và Admin nhận phiếu theo trạng thái và người phụ trách. Giao diện chỉ cho hủy phân công ở trạng thái `Assigned` |
| Revision | `update` và `assign` gửi `expectedRevision` trong body. Các lệnh vòng đời và hủy phân công gửi qua query. Khi nhận `409`, giao diện cho tải lại phiếu |
| Hàng đợi | Giao diện hỗ trợ lọc và sắp xếp theo độ ưu tiên qua `priority` và `sortByPriority` |
| Knowledge và AI | Knowledge đã có giao diện đọc và quản trị theo quyền. Phạm vi Knowledge cần quyết định riêng. Luồng AI xử lý và lưu quyết định gợi ý từ đầu đến cuối thuộc giai đoạn sau |

Nghiệm thu theo phiên bản Backend thực tế với tài khoản Requester, Agent và Admin. Kiểm tra phân công, nhận phiếu, ghi chú nội bộ và vòng đời tệp trên môi trường tích hợp. [Bộ đọc phản hồi](../../src/features/tickets/api/ticketContract.ts) · [Điều kiện hiển thị thao tác](../../src/features/tickets/model/ticketPermissions.ts) · [Bản đồ truy cập Kho tri thức](knowledge-ui-access-map.md)

## Mốc đối chiếu 03/11/2026

Phạm vi là working tree của đợt W2–W3 sau hợp nhất backend tại `659289c3a1cf8e4b9da86a15ea890ee59bcc3e6d`, cộng thay đổi `UploadUrlResult.formData`. Backend dùng thống nhất AttachmentUploadGrant, giữ confirm idempotent và nhận grant PUT cũ còn hạn; đường dẫn/payload frontend không thay đổi qua bước hợp nhất. Nguồn và checksum tại [backend-source.json](../../tests/contracts/backend-source.json), bản OpenAPI tại [backend-openapi.json](../../tests/contracts/backend-openapi.json). SHA nền chưa phải SHA của thay đổi chưa commit. Các phần tiếng Anh bên dưới giữ mốc lịch sử cũ để truy vết.

| Luồng | Hành vi hiện tại |
| --- | --- |
| DTO | Đọc requesterId, assignedToId/At, updatedAt, revision, priority, impact, urgency khi backend cung cấp; dữ liệu thiếu không được thay bằng số revision giả |
| Danh sách Agent | `GET /users?role=Agent`, chọn người phụ trách và dùng ID backend trả |
| Ghi trạng thái/phân công | Revision bắt buộc ở frontend; assign gửi body expectedRevision, các lệnh còn lại gửi query; 409 giữ input và cho tải lại, không retry ghi tự động |
| Attachment | Xin URL → POST multipart khi có formData (tương thích PUT nếu không có) → confirm → danh sách từ `GET /attachments` |
| Confirm lỗi | Giữ yêu cầu chờ và cho xác nhận lại, không upload lại binary, không báo hoàn tất trước confirm |
| Phiên/ticket | Query key gồm phiên và ticket; kết quả từ phiên cũ bị bỏ, các panel có state được remount khi đổi ticket |
| AI | UI vẫn ở trạng thái chưa nối backend; HTTP adapter backend vừa có chưa cung cấp endpoint analysis/review |

Kiểm tra contract: `npm run contract:check`. Sinh lại kiểu sau review: `npm run contract:generate`. Kiểm tra với đúng checkout backend: `node tools/backend-contract.mjs --backend-file ../ai-it-service-desk/contracts/backend/openapi-baseline.json`. CI kiểm tra checksum và kiểu sinh; kiểm tra xuyên repo cần cung cấp đúng checkout tương ứng. Không tự lấy nhánh di động rồi gán là contract đã duyệt.

Các trường DTO được bổ sung vẫn optional để nhận diện backend cũ. Khi thiếu revision, frontend khóa lệnh trạng thái/phân công. Backend đang giữ ExpectedRevision tùy chọn cho caller cũ; việc bắt buộc phía server còn cần lộ trình tương thích.

OpenAPI giữ một số chuỗi nullable do metadata C#; runtime reader vẫn yêu cầu các trường bắt buộc dùng để hiển thị hợp lệ. Kiểu trong `backend.generated.ts` do công cụ sinh; các kiểu trong feature và kiểm tra runtime được viết tay. Browser test mock HTTP chứng minh luồng trình duyệt, còn nghiệm thu backend/storage thật phải chạy riêng.

## Historical baseline before hardening

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

Backend dev `1506a5b` (PR #39) adds `/api/knowledge/articles`; `ced117c` (PR #40) fixes gaps G1 and G6. The routes, actions and permissions
the UI will follow, and the gaps against the team contract, are in
[knowledge-ui-access-map.md](knowledge-ui-access-map.md) (TC-332). The Agent/Admin UI (TC-218) is
built against them:
- `/knowledge/manage` (Agent, Admin) lists `GET /knowledge/articles` with status/tag/query filters
  kept in the URL. Since `ced117c` an Agent's list holds Published articles and their own, an Admin's
  every article. A row the user could only open on 404 (what `1506a5b` listed, gap G1) stays locked.
- `/knowledge/manage/new` and `/knowledge/manage/:id/edit` (TC-338) create with `POST /knowledge/articles`
  and save with `PUT /knowledge/articles/{id}/draft`, checked like the Article domain (title ≤ 200,
  content ≥ 10, ≤ 10 tags of ≤ 50, tags lower case without duplicates). The revision is always sent,
  and required since `ced117c` (gap G6; missing or 0 is a 400); it is the one the form opened on, so a background
  refetch cannot turn a save into an overwrite. 409 and 422 offer a reload that keeps the typed text.
  Only the author or an Admin edits, and only a Draft: published articles cannot be versioned (gap G3).
- The editor's "Xem trước" tab (TC-339) renders the Markdown as readers will see it with
  `react-markdown` + `remark-gfm` (tables, task lists, strikethrough). The backend stores content as
  typed, so the preview is the XSS boundary (NFR-SEC-04): React elements only, never innerHTML; raw
  HTML is shown as text (not dropped, so "Nhấn <Enter>" keeps its words); links and images keep only
  http(s), mailto, irc(s), xmpp and relative URLs, so `javascript:`, `data:` and `vbscript:` lose their
  target; links open in a new tab with `rel="noopener noreferrer nofollow"`. `rehype-raw` must not be added.
- Publish and archive (TC-340) are offered on the list rows and, for publish, in the draft editor,
  each after a confirmation: `POST /knowledge/articles/{id}/publish|archive` with `{ expectedRevision }`
  in the body. Author or Admin only, as the use cases do (the contract's Admin-only default, KB-05/06,
  awaits TC-330). The editor holds publishing back while the form has unsaved changes, and ends on
  the article's page. 409/422 explain and offer a reload; status and version come from the returned
  article (version stays 1, gap G3).
- `/knowledge/manage/:id` (TC-341) is the staff view of one article in any status the backend serves
  (`GET /knowledge/articles/{id}`): rendered Markdown, status, tags, dates, and the edit, publish and
  archive actions the user may take. 403 and 404 read the same (UX-04); a failed refresh keeps the
  article on screen with a retry. List → article → editor carry the list's normalized search in router
  state (`{ listSearch }`, accepted only as `?…`), so "back" returns to the same filters. The list tells
  apart an empty base, filters that match nothing, a page past the end and a failed load. Unsaved
  changes ask before the tab closes or reloads (`beforeunload`); moves inside the app are not
  intercepted, since `BrowserRouter` has no navigation blocker.

The reader side (TC-219) is open to every signed-in role, as `GET /knowledge/articles/search` and
`GET /knowledge/articles/{id}` are (RequireRequester admits Requester, Agent and Admin):
- `/knowledge` (TC-342, in the Requester menu) searches `GET /knowledge/articles/search` with
  `status=1` always: an Agent would otherwise also get their own drafts, and a Requester's status is
  ignored by the backend. Keyword (`q` in the URL, `query` to the API: ILIKE on title or content), tag
  and paging live in the URL. Results are cards, newest published first, with a plain-text excerpt
  (never rendered as Markdown), the tags (each narrowing the search) and the publish date. Empty
  states tell apart nothing published, nothing matching (clear the search, or ask for help with a
  request, PRD J-03) and a page past the end; a failed search offers a retry. The requester overview
  hosts a knowledge card (search box, the 3 newest articles) through a slot, so tickets does not
  depend on knowledge.
- `/knowledge/:id` (TC-343) reads `GET /knowledge/articles/{id}` and shows a Published article only:
  title, tags (each opening the search for it), "Phiên bản N · Xuất bản … · Cập nhật …" and the
  Markdown through the same safe renderer as the editor preview (NFR-SEC-04). No author is shown (the
  DTO has no name, G9). A Requester gets 404 for anything else, shown like a missing article (UX-04);
  an unpublished article that is served anyway (staff: their drafts; Admin: archived ones) opens its
  management page instead, and anyone else sees not found. "Back" returns to the results it was
  opened from (`{ resultsSearch }` router state, `?…` only); a reader it did not help goes on to a
  request (PRD J-03).

Semantic search (TC-223) has no backend yet: backend dev `febb4d7` has only a NoOp
`IEmbeddingService` and no search endpoint, and `ai-service` has only ticket classification; the
embedding model, dimension and retrieval contract are still open (ai-service
`docs/backend-alignment.md`). The UI is built against its own `SemanticMatch` shape, onto which the
client of TC-360 will map the endpoint of AISD-S3-07-T03. What the UI needs per hit, for that contract:
- `articleId`, `title`, `tags`, `version` and `publishedAt` of the Published version the passage
  comes from (Spec §8.3: the current published version only; drafts and archived excluded, FR-KB-06);
- `section` (the heading the chunk sits under, or null) and `snippet` (the chunk text,
  `KnowledgeEmbedding.Content`);
- `score`, higher is closer, with its scale stated.
- Still to agree with backend AI: the no-match threshold and the High/Medium/Low cut-offs (the UI
  uses provisional 0.55 / 0.75 on a [0, 1] similarity, `relevancePolicy`), whether the backend drops
  hits below the threshold itself, and Top-K.

TC-361 shows the hits as one card per source article: its closest passage first (section and the
passage as plain text, never rendered as Markdown), the other passages that matched, and the source
line (title, version, publish date, tags). Relevance is "Độ liên quan: Cao/Trung bình/Thấp"; the
model score appears only in the tooltip, as "Điểm mô hình 0.82" with the note that it ranks results
and is not a probability, never as a percentage (Spec §11.3, PRD §8.1).

TC-362 opens each source from its card: the title at the closest passage's section, and every other
passage at its own (`/knowledge/:id` with `{ resultsSearch, section }` router state; a section is
only a string of up to 200 characters, or null for the opening). The reader checks the section
against the article's own headings: found, it scrolls to the heading, marks and focuses it, and says
where the match is ("Tới mục này" scrolls again); gone from the current version, it says so and
shows the whole article; the opening is named as such. Hits below the relevance threshold are never
shown (provisional 0.35, `relevancePolicy.threshold`), so loosely related passages are not offered as
an answer: when some came back but none clears it, and when none came back, the results area has its
own empty state with "Tìm theo từ khóa" (when the page offers it) and "Tạo yêu cầu hỗ trợ" — apart
from the keyword search's empty states and from a failed search.

## Not enabled

AI HTTP endpoints are not used yet: backend dev febb4d7 still exposes no triage result or review
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

Confidence and decision states (TC-367) follow the backend domain at dev `febb4d7`, which still has
no AI endpoint: the band comes from `ConfidencePolicy` (Low < 0.4, High ≥ 0.75), never recomputed
in the UI, and each band gets the reviewer guidance `ConfidenceBand` documents: Low "Cần xem xét
kỹ", Medium "Nên rà soát", High no flag; a missing band (no score, or one the policy rejects) reads
like Low and says the score is missing. The panel counts what needs a careful check and how many
suggestions are decided. Each decision status has an icon and says what it did to the ticket
(applied the AI value; another value chosen instead, the AI value struck through; nothing applied;
expired because the ticket changed, with "phân tích lại"), with the review time when the backend
records one (`ReviewedAt`; Expired has none, `MarkExpired`). `ReviewedBy` is a user id with no name,
so it is not shown. A requester sees only the band and, when it is Low or missing, that a technician
will check the category; never a score. Blocked by AISD-S3-09-T03 (TC-365, held-out evaluation): if
it moves the band thresholds, only the backend policy changes.

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
