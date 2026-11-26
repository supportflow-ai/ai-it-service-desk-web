# Đề xuất hợp đồng AI còn thiếu: RAG, semantic search, lý do override

> Trạng thái: **đề xuất**, chưa được backend hay ai-service duyệt. Không sinh client từ tài liệu này.
> Ngày soạn: 2026-11-26.

## Nguồn đã đối chiếu

| Nguồn | Vị trí | Nội dung liên quan |
| --- | --- | --- |
| Hợp đồng phân loại ai-service v1 | `ai-service`, nhánh `origin/ai-service`, `contracts/ai/v1/openapi.yaml` | `POST /v1/ticket-classifications`, service-to-service |
| Hợp đồng knowledge-index v1 | `ai-service`, nhánh `origin/dev`, `contracts/ai/knowledge-index/v1/` | `POST /v1/knowledge-indexes:prepare`: chia chunk và trả embedding |
| Đối chiếu enum G1 | `ai-service`, nhánh `origin/docs/g1-bang-doi-chieu-enum`, `docs/g1-doi-chieu-enum.md` | Impact/Urgency khớp; ai-service chưa gợi ý hai trường này |
| Kiểu frontend | `src/features/ai-assistance/model/ai.types.ts`, `rag.types.ts`; `src/features/knowledge/model/knowledge.types.ts` | `SuggestionDecisionRequest`, `RagSuggestionView`, `RagCitation`, `SemanticMatch` |

## Hiện trạng

- **Phân loại:** đã có hợp đồng ai-service. 11 mã danh mục (`ACC`, `NET`, `VPN`, `MAIL`, `SW`, `HW`, `PRINT`, `ACCESS`, `EQUIP`, `SEC`, `OTHER`) khớp đúng `TicketCategory`. Backend cần map `field` chữ thường sang `SuggestionType` PascalCase và `score` sang `modelScore`. Endpoint `/tickets/{id}/ai-analysis` mà frontend gọi vẫn chưa có trong OpenAPI backend.
- **Knowledge-index:** ai-service chỉ có nửa nạp dữ liệu. Mỗi chunk có `chunkId`, `text`, `headingPath`, `startChar/endChar`, `startLine/endLine`, `tokenCount`, `embedding` (tối đa 384 phần tử). Không có endpoint truy vấn.
- **RAG, semantic search, lý do override:** chưa có hợp đồng ở cả backend lẫn ai-service.

## Nguyên tắc chung cho cả ba đề xuất

1. **Backend giữ quyền truy cập và truy xuất.** Backend lưu chunk và embedding, tự tìm passage, và chỉ chọn passage của phiên bản đang Published. ai-service không biết về quyền người dùng.
2. **Frontend chỉ gọi backend.** Hợp đồng ai-service là service-to-service và không lộ ra trình duyệt.
3. **Điểm số là điểm thô**, không phải xác suất đã hiệu chỉnh (Spec §11.3). Band `Low/Medium/High` do backend suy ra theo ngưỡng cấu hình.
4. **Không lộ lỗi của nhà cung cấp.** Backend ánh xạ lỗi ai-service sang `outcome` cố định; frontend chỉ hiển thị thông báo trong allowlist (TC-277).
5. **Mọi embedding cùng một `profileId`.** Embedding câu hỏi phải sinh bằng đúng profile đã dùng khi lập chỉ mục, nếu không điểm tương đồng vô nghĩa.

---

## 1. Semantic search (TC-223, TC-360)

### 1a. ai-service: embedding câu truy vấn

`POST /v1/query-embeddings` (service-to-service, cùng `serviceBearer` như các hợp đồng khác)

Request:

```json
{
  "requestId": "uuid",
  "profileId": "string, giống profile của knowledge-index",
  "text": "string, 1–1000 ký tự"
}
```

Response `200`:

```json
{
  "requestId": "uuid",
  "profileId": "string",
  "embedding": [0.0123, -0.0456]
}
```

- `embedding` cùng số chiều với knowledge-index (hiện `maxItems: 384`).
- Lỗi: `400`, `401`, `403`, `429`, `503`, giống hợp đồng phân loại.

### 1b. Backend: tìm kiếm cho frontend

`GET /knowledge/semantic-search?q={text}&limit={1..20}`

Response `200`:

```json
{
  "query": "string",
  "matches": [
    {
      "articleId": "string",
      "title": "string",
      "section": "string | null",
      "snippet": "string (Markdown)",
      "score": 0.82,
      "tags": ["string"],
      "version": 3,
      "publishedAt": "ISO-8601"
    }
  ]
}
```

- `matches[]` khớp nguyên `SemanticMatch`. Frontend tự gom theo `articleId` thành `SemanticArticleGroup`.
- `section` = phần tử cuối của `headingPath`, hoặc `null` khi `headingPath` rỗng.
- `snippet` = `text` của chunk. `version` = `versionNumber` của chunk.
- Chỉ trả chunk của phiên bản đang Published mà người gọi được xem.
- Sắp xếp theo `score` giảm dần.
- Khi ai-service lỗi: trả `503` với mã lỗi cố định. Frontend nên lùi về tìm kiếm từ khoá hiện có.

---

## 2. RAG gợi ý trả lời (TC-229: TC-384, TC-385, TC-386)

### 2a. ai-service: sinh câu trả lời từ passage cho trước

`POST /v1/rag-answers` (service-to-service)

Request:

```json
{
  "requestId": "uuid",
  "ticketId": "string",
  "ticketRevision": 5,
  "question": "string: tiêu đề + mô tả ticket do backend ghép",
  "passages": [
    {
      "chunkId": "string",
      "text": "string",
      "score": 0.82
    }
  ]
}
```

Response `200`:

```json
{
  "requestId": "uuid",
  "status": "answered | abstained",
  "answer": "string | null",
  "citedChunkIds": ["string"],
  "model": "string | null",
  "score": 0.71
}
```

Ràng buộc:

- `status = answered` ⇒ `answer` khác `null` **và** `citedChunkIds` có ít nhất một phần tử.
- `status = abstained` ⇒ `answer = null`, `citedChunkIds = []`.
- Mọi `citedChunkIds` phải thuộc `passages` của request. Backend loại bỏ id lạ; nếu sau đó không còn trích dẫn nào thì coi như `abstained`.
- `passages` rỗng ⇒ ai-service trả `abstained` mà không gọi mô hình.

### 2b. Backend: gợi ý cho frontend

`POST /tickets/{id}/ai-rag-suggestion` (hoặc `GET` nếu backend cache theo `ticketRevision`)

Response `200`, khớp `RagSuggestionView`:

```json
{
  "outcome": "Answered | NoEvidence | Unavailable | Timeout",
  "answer": "string | null",
  "citations": [
    {
      "articleId": "string",
      "title": "string",
      "section": "string | null",
      "snippet": "string (Markdown)",
      "score": 0.82,
      "version": 3,
      "publishedAt": "ISO-8601"
    }
  ],
  "model": "string | null",
  "confidence": "Low | Medium | High | null",
  "score": 0.71,
  "generatedAt": "ISO-8601 | null"
}
```

Ánh xạ của backend:

| Tình huống | `outcome` | `answer` | `citations` |
| --- | --- | --- | --- |
| ai-service `answered`, còn ≥ 1 trích dẫn hợp lệ | `Answered` | câu trả lời | passage được trích |
| Truy xuất không có passage vượt ngưỡng, hoặc ai-service `abstained` | `NoEvidence` | `null` | `[]` |
| ai-service `503`, lỗi mạng, response sai schema | `Unavailable` | `null` | `[]` |
| Quá thời gian chờ cấu hình | `Timeout` | `null` | `[]` |

- `NoEvidence` là trạng thái bình thường, không phải lỗi. Trả `200`.
- `citations[]` lấy từ chunk backend đang lưu, không lấy text do mô hình viết lại. Vì vậy `score`, `version`, `publishedAt` của citation luôn có giá trị. `RagCitation` phía frontend vẫn cho phép `null` ở ba trường này, nên không cần đổi kiểu.
- `confidence` do backend suy ra từ `score`; `null` khi không phải `Answered`.

---

## 3. Lý do override gợi ý phân loại

Frontend đã gửi `reason?: string` trong `SuggestionDecisionRequest`, nhưng `AISuggestion.Override` chưa có chỗ lưu. Việc này chỉ thuộc backend, không liên quan ai-service.

Đề xuất:

- Thêm cột `OverrideReason` (nullable, tối đa 500 ký tự) vào `AISuggestion`.
- Chấp nhận `reason` khi `decision` là `Overridden` hoặc `Rejected`; bỏ qua khi `Accepted`.
- Trả lại trong `SuggestionDto` dưới tên `reason: string | null`.
- Ghi vào audit log cùng `reviewedBy` và `reviewedAt`.
- Validation: quá 500 ký tự ⇒ `400` với `validationErrors.reason`.

Phía frontend cần sửa khi backend chốt: thêm `reason: string | null` vào `SuggestionDto` và xoá chú thích "AISuggestion.Override has no reason field yet".

---

## Câu hỏi cần chốt

| # | Câu hỏi | Người chốt | Ảnh hưởng nếu đổi |
| --- | --- | --- | --- |
| Q1 | Embedding và chunk lưu ở đâu (pgvector trong DB backend hay kho riêng)? | Backend | Mục 1b, 2b. Nếu ai-service giữ kho vector thì cần thêm endpoint truy xuất và cách lọc theo quyền. |
| Q2 | Số chiều embedding có cố định 384 không? Tài liệu mới chỉ có `maxItems: 384`. | ai-service | Schema cột vector. |
| Q3 | Ngưỡng `score` cho `NoEvidence` và cho các band `Low/Medium/High`. | Backend + nghiệp vụ | Mục 2b. Cần đo trên dữ liệu thật. |
| Q4 | Thời gian chờ cho RAG và semantic search. | Backend | Khi nào trả `Timeout`. |
| Q5 | `reason` có bắt buộc khi `Overridden` không? Frontend hiện để tuỳ chọn. | Nghiệp vụ | Validation mục 3 và form frontend. |
| Q6 | RAG gọi theo yêu cầu hay sinh sẵn khi ticket đổi revision? | Backend | Chọn `POST` hay `GET` ở 2b, và cờ `stale`. |
| Q7 | Ai-service khi nào bắt đầu gợi ý Impact/Urgency (rubric G1)? | ai-service + nghiệp vụ | Frontend phải chịu được danh sách gợi ý chỉ có Category. |
