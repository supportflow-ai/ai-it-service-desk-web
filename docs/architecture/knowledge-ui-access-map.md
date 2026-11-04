# Knowledge Base UI access map (TC-332)

Bản đồ màn hình (route) và thao tác của UI Kho tri thức, đối chiếu với quyền mà backend thực
sự kiểm tra. Đây là đầu vào cho phần cài đặt UI Kho tri thức và cho ma trận test lifecycle/visibility
(TC-333). Thuộc TC-216 "Chốt Knowledge Article lifecycle, versioning và permissions".

**Nguồn đối chiếu**
- Backend `supportflow-ai/ai-it-service-desk`, nhánh `dev`, commit `1506a5b` (PR #39
  `feature/sprint3-knowledge-base`, Tuannll, 2026-11-04):
  - `src/backend/ServiceDesk.Api/Endpoints/KnowledgeEndpoints.cs`
  - `src/backend/ServiceDesk.Application/Knowledge/**` (use case, read scope, DTO)
  - `src/backend/ServiceDesk.Domain/Knowledge/{Article,ArticleStatus,ArticleTag,ArticleVersion}.cs`
  - `src/backend/ServiceDesk.Infrastructure/Knowledge/PostgresKnowledgeQueries.cs`
  - `tests/ServiceDesk.IntegrationTests/KnowledgeLifecycleEndpointTests.cs`
- Hợp đồng quyền mục tiêu: `docs/architecture/02-rbac-permission-matrix.md` (KB-01…KB-07) và
  `01-actor-use-cases.md` (ACT-08, UC-K01) trong repo backend, đang chờ TC-330 chốt.
- PRD v1.1 (PR-08, UX-04) và Implementation Spec v1.2 (FR-KB-01…07, §8.3, US-024…029).

Bằng chứng đã chạy: unit test Kho tri thức của backend tại `1506a5b` đạt (Application 28/28,
Domain 30/30). Chưa chạy được trên DB dùng chung vì DB đó chưa có bảng `articles` (xem G8).

Quy ước bên dưới: **R** = Requester, **A** = Agent, **M** = Admin. "Tác giả" là `authorId` của bài
trùng người đang đăng nhập.

## 1. Vòng đời bài viết (theo code backend)

```
Draft (0) ──publish──▶ Published (1) ──archive──▶ Archived (2)
  ▲ sửa được                không sửa được             không khôi phục, không xoá
```

| Quy tắc | Backend thực tế |
| --- | --- |
| Tạo | Luôn là Draft, `version = 1`, tác giả là người gọi. Client không chọn được trạng thái hay tác giả |
| Sửa | Chỉ khi Draft (khác Draft → 422). Ghi đè title, content, tags |
| Xuất bản | Chỉ từ Draft (khác → 422). Ghi `publishedAt`, lưu một bản `ArticleVersion` bất biến |
| Lưu trữ | Chỉ từ Published (khác → 422). Ghi `archivedAt` |
| Phiên bản mới cho bài đã xuất bản | **Không có** (G3). `version` luôn là 1 |
| Khôi phục, xoá | **Không có** |
| Tiêu đề | Bắt buộc, sau khi trim tối đa 200 ký tự |
| Nội dung | Bắt buộc, sau khi trim tối thiểu 10 ký tự |
| Tags | Tối đa 10, mỗi tag 1–50 ký tự, backend trim + chữ thường + bỏ trùng; tag rỗng → 400 |
| Revision | `revision` (xmin) có trong ArticleDto. Từ `ced117c`, `expectedRevision` **bắt buộc** khi sửa nháp, xuất bản, lưu trữ: thiếu hoặc 0 → 400 (G6 đã sửa). Lệch → 409 |
| Trạng thái trong JSON | Số nguyên `0/1/2` (OpenAPI baseline: enum integer); UI gửi query `status` dạng số |

ArticleDto: `id, title, content, status, authorId, version, revision, tags[], createdAt,
updatedAt, publishedAt?, archivedAt?`. Không có tên tác giả (G9). Kết quả danh sách:
`items, page, pageSize, totalCount, totalPages`; `pageSize` được kẹp trong 1–100.

## 2. Ai đọc được gì (read scope)

| Truy vấn | R | A | M |
| --- | --- | --- | --- |
| `GET /api/knowledge/articles/{id}` | Chỉ Published; còn lại → 404 | Published **hoặc** bài mình là tác giả (mọi trạng thái); bài người khác chưa Published → 404 | Mọi bài, mọi trạng thái |
| `GET /api/knowledge/articles/search` và `GET /api/knowledge/articles` (cùng một use case) | Chỉ Published; tham số `status` bị bỏ qua | Published + bài của mình, lọc được theo `status` (từ `ced117c`; trước đó trả mọi bài, G1) | Mọi bài, lọc được theo `status` |

Tìm kiếm: `query` khớp không phân biệt hoa thường trên title hoặc content (ILIKE), `tag` khớp tag
đã chuẩn hoá. Published xếp theo `publishedAt` mới nhất; danh sách staff xếp theo `updatedAt`.

## 3. Route UI đề xuất

| Route | Màn hình | R | A | M | API dùng |
| --- | --- | --- | --- | --- | --- |
| `/knowledge` | Tra cứu kho tri thức (chỉ bài đã xuất bản) — TC-342 | ✓ | ✓ | ✓ | `GET …/search?query&tag&page&pageSize`; UI **luôn gửi `status=1`** (A/M nếu không sẽ lẫn nháp của mình; R thì backend bỏ qua) |
| `/knowledge/:id` | Đọc bài — TC-343 | ✓ (Published) | ✓ (Published + bài của mình) | ✓ | `GET …/{id}`; 404 → màn "Không tìm thấy bài viết" không nói bài có tồn tại hay không (UX-04) |
| `/knowledge/manage` | Quản lý bài viết: tab Nháp / Đã xuất bản / Lưu trữ, lọc tag, tìm | ✗ → trang 403 | ✓ | ✓ | `GET …/articles?status&tag&query&page&pageSize` |
| `/knowledge/manage/:id` | Xem bài phía staff (mọi trạng thái backend cho đọc) kèm Sửa / Xuất bản / Lưu trữ | ✗ → 403 | ✓ Published + bài của mình | ✓ | `GET …/{id}` |
| `/knowledge/manage/new` | Tạo bản nháp | ✗ → 403 | ✓ | ✓ | `POST …/articles` |
| `/knowledge/manage/:id/edit` | Sửa bản nháp | ✗ → 403 | ✓ chỉ tác giả, chỉ Draft | ✓ chỉ Draft | `GET …/{id}` rồi `PUT …/{id}/draft` |

Menu (giữ cách tách góc nhìn hiện có của UI):
- Requester: thêm **Kho tri thức** → `/knowledge`. Ô "Kho tri thức" ở trang Tổng quan mở `/knowledge?q=…`
  (URL dùng `q` như trang quản lý; API vẫn nhận `query`) và liệt kê 3 bài mới xuất bản (TC-342).
- Agent/Admin: thêm **Kho tri thức** → `/knowledge/manage`. Tiêu đề trên danh sách mở `/knowledge/manage/:id`
  (TC-341); trang đọc `/knowledge/:id` để dành cho tra cứu bài đã xuất bản.
- Route guard theo role chỉ là UX; backend vẫn kiểm từng request (ACT-10).

## 4. Ma trận thao tác

Mỗi ô ghi: nút có hiện trên UI không / backend trả gì nếu vẫn gọi.

| Thao tác | API | R | A – bài của mình | A – bài người khác | M | Trạng thái cho phép |
| --- | --- | --- | --- | --- | --- | --- |
| Tìm, đọc bài Published | `GET …/search?status=1`, `GET …/{id}` | hiện / 200 | hiện / 200 | hiện / 200 | hiện / 200 | Published |
| Đọc bài Draft hoặc Archived | `GET …/{id}` | không hiện / 404 | hiện / 200 | không hiện / **404** | hiện / 200 | — |
| Tạo bản nháp | `POST …/articles` `{ title, content, tags? }` | không hiện / 403 | hiện / 201 | — | hiện / 201 | — |
| Sửa bản nháp | `PUT …/{id}/draft` `{ title, content, tags?, expectedRevision }` | không hiện / 403 | hiện khi Draft / 200 | không hiện / 403 | hiện khi Draft / 200 | Draft (khác → 422) |
| Xuất bản | `POST …/{id}/publish` `{ expectedRevision }` | không hiện / 403 | hiện khi Draft / 200 | không hiện / 403 | hiện khi Draft / 200 | Draft (khác → 422) |
| Lưu trữ | `POST …/{id}/archive` `{ expectedRevision }` | không hiện / 403 | hiện khi Published / 200 | không hiện / 403 | hiện khi Published / 200 | Published (khác → 422) |
| Sửa bài đã xuất bản, tạo phiên bản mới | không có API | — | — | — | — | G3 |
| Khôi phục bài lưu trữ, xoá bài | không có API | — | — | — | — | — |

Ghi chú:
- Với bài người khác, Agent bị 403 khi ghi (backend kiểm tác giả trước trạng thái), nhưng 404
  khi đọc chi tiết bài chưa Published. UI dựa vào `authorId === user.userId` để ẩn nút.
- Publish/archive nhận `expectedRevision` ở query hoặc body (backend dùng body trước). UI gửi trong
  body, để không phụ thuộc cách backend xử lý body rỗng.
- Trong màn sửa nháp, nút Xuất bản bị khoá khi form còn thay đổi chưa lưu: chỉ nội dung đã lưu
  được xuất bản, và bài đã xuất bản không sửa được nữa (G3).
- UI luôn gửi revision đang hiển thị (backend bắt buộc từ `ced117c`, G6); revision lấy lúc mở form sửa,
  không lấy lại khi trang tự tải lại ở nền (cùng cách đã làm cho "Sửa yêu cầu").

## 5. UI xử lý lỗi

| Mã | Khi nào | UI |
| --- | --- | --- |
| 400 | Title/content/tags không hợp lệ | Frontend kiểm trước cùng giới hạn ở mục 1; nếu vẫn 400 thì báo "Nội dung chưa hợp lệ" |
| 403 | Không phải tác giả hoặc Admin, hoặc Requester gọi API ghi | "Bạn không có quyền thực hiện thao tác này với bài viết", không đăng xuất |
| 404 | Bài không tồn tại hoặc ngoài phạm vi đọc | "Không tìm thấy bài viết" (không phân biệt hai trường hợp) |
| 409 | Revision cũ | "Bài viết vừa được người khác cập nhật" + nút Tải lại, giữ nội dung đang gõ |
| 422 | Sai trạng thái (đã được xuất bản hoặc lưu trữ trong lúc đó) | "Trạng thái bài viết đã thay đổi" + nút Tải lại |

## 6. Lệch giữa code backend và hợp đồng/PRD (cần Backend Core và TC-330 chốt)

| # | Vấn đề | Code `1506a5b` | Hợp đồng/PRD | Ảnh hưởng UI |
| --- | --- | --- | --- | --- |
| G1 | **Đã sửa ở `ced117c` (TC-344).** Danh sách của staff lộ bản nháp người khác | `SearchStaffAsync` trả mọi bài, mọi trạng thái cho mọi Agent (có title + content) | KB-02, ACT-08: draft chỉ tác giả/editor; search không lộ bài bị ẩn | Agent thấy nháp người khác trong danh sách nhưng mở ra bị 404. Đề xuất backend: Agent chỉ thấy Published + bài của mình; Admin thấy tất cả |
| G2 | Ai được xuất bản/lưu trữ | Agent tác giả tự xuất bản và lưu trữ được | KB-05, KB-06: mặc định Admin, Agent cần quyền publisher riêng | UI làm theo code: hiện nút cho tác giả và Admin. Nếu TC-330 chốt theo hợp đồng thì chỉ cần đổi một hàm quyền |
| G3 | Không có phiên bản cho bài đã xuất bản | Không sửa được Published, `version` luôn là 1 | KB-04, §8.3, FR-KB-05 (Should); demo TC-216 có bước "update version" | Demo "update version" chưa làm được. Bài Published chỉ có thể lưu trữ rồi viết bài mới |
| G4 | Đọc bản nháp | Đọc qua `GET /{id}` theo scope tác giả/Admin; sửa dùng `PUT` | KB-07 `GET /{id}/draft`; KB-04 `PATCH /{id}/draft` | UI dùng đúng endpoint đang có |
| G5 | Lưu trữ không có lý do, không có lịch sử | Không có reason, audit hay history cho KB | KB-06 reason/audit; PR-12 truy vết thay đổi | UI không hỏi lý do vì backend không nhận |
| G6 | **Đã sửa ở `ced117c` (TC-336/373/374).** Revision không bắt buộc | Thiếu hoặc 0 → bỏ qua kiểm tra | FR-TKT-07 xmin → 409 (vé đã bắt buộc) | UI luôn gửi; đề xuất backend bắt buộc như vé |
| G7 | Chưa có | Semantic search (FR-KB-04 Must), helpful feedback (FR-KB-07), danh sách tag, gợi ý KB khi tạo vé (UX-01) | PRD/Spec | Ngoài phạm vi UI đợt này |
| G8 | DB dev dùng chung chưa có bảng Kho tri thức | Migration `20261104100000_AddKnowledgeArticles` chưa chạy | — | Mọi API Kho tri thức sẽ lỗi trên DB chung tới khi backend chạy migration |
| G9 | Không có tên tác giả | ArticleDto chỉ có `authorId` | — | UI ghi "Bạn" hoặc tên lấy từ danh sách Agent (chỉ staff đọc được); Requester không thấy tác giả |

## 7. Bàn giao cho TC-333 (ma trận test)

Đã có trong `KnowledgeLifecycleEndpointTests` của backend: tác giả tạo 201; Requester đọc nháp
404 và không thấy trong tìm kiếm; Agent khác và Requester sửa/xuất bản/lưu trữ 403; tác giả sửa,
xuất bản, lưu trữ 200; Requester đọc bài Published 200, bài Archived 404; revision cũ 409; lưu trữ
bản nháp và xuất bản lần hai 422.

Chưa có, nên thêm:
- Agent khác đọc chi tiết nháp của tác giả → 404.
- Agent khác **không** thấy nháp của tác giả trong danh sách (đạt từ `ced117c`; trước đó thất bại vì G1).
- Admin sửa, xuất bản, lưu trữ bài người khác → 200.
- Requester gửi `status=0` hoặc `status=2` khi tìm → chỉ nhận bài Published.
- 400 cho title > 200, content < 10, tag rỗng, quá 10 tag, tag > 50 ký tự; tag được chuẩn hoá chữ thường và bỏ trùng.
- UI: route `/knowledge/manage*` với Requester → trang 403; nút ghi chỉ hiện đúng ô "hiện" ở mục 4.
