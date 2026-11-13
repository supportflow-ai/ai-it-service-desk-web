# Kế hoạch chuyển tải tệp sang Cloudflare R2 (giao diện web)

Trạng thái: kế hoạch đề xuất chờ chủ dự án duyệt, chưa triển khai. Cập nhật 2026-11-13, đối chiếu `dev` tại `386d709`. Quyết định và thiết kế nằm ở ADR-017 của kho backend (`docs/adr/ADR-017-cloudflare-r2-object-storage.md`). Kế hoạch các kho khác: backend (`docs/architecture/r2-storage-plan.md`), infra (`docs/infra/r2-storage-plan.md`), ai-service (`docs/r2-impact.md`).

## 1. Tóm tắt

Web đã gửi tệp thẳng tới URL ký sẵn và **đã có sẵn nhánh PUT thô**: khi `formData` trống thì `uploadToPresignedUrl` gọi `PUT` với `Content-Type`. R2 chỉ hỗ trợ presigned PUT (không có presigned POST), nên về chức năng web gần như không phải đổi gì để hoạt động với backend dùng R2. Phần việc của web là: dọn nhánh POST không còn dùng, gửi đúng tiêu đề đã ký, xử lý lỗi của R2 cho rõ ràng, cập nhật kiểm thử, snapshot hợp đồng và tài liệu, và phối hợp CORS với hạ tầng.

Web **không giữ khóa hay endpoint R2 nào**. Không có biến môi trường mới cho web; `VITE_*` vẫn không được chứa bí mật.

## 2. Hiện trạng trong mã

| Tệp | Vai trò hiện tại |
| --- | --- |
| `src/shared/api/uploadClient.ts` | `uploadToPresignedUrl`: client axios riêng (không gửi bearer token của API); nếu có `formData` thì `POST multipart` (trường `file` đặt cuối), ngược lại `PUT` với `Content-Type = contentType || file.type || application/octet-stream`; lỗi nào cũng chuẩn hóa thành "Không tải được tệp lên kho lưu trữ. Vui lòng thử lại." |
| `src/features/tickets/lib/uploadAttachment.ts` | Cấp URL, tải lên, gọi checkpoint, ghi nhận chưa xác nhận (`onUploaded`), rồi xác nhận. `contentType` của yêu cầu cấp URL và của PUT đều là `file.type || 'application/octet-stream'`, nên khớp nhau |
| `src/features/tickets/api/ticketApi.ts`, `ticketContract.ts`, `model/ticket.types.ts` | `UploadUrlResult { uploadUrl, storageKey, expirySeconds, formData? }`; bộ đọc phản hồi chấp nhận `formData` trống hoặc là map chuỗi |
| `src/features/tickets/hooks/useAttachmentDownload.ts` | Xin URL tải xuống ngay khi bấm (mutation), rồi mở bằng `openDownloadUrl(url, fileName)` |
| Kiểm thử | `uploadClient.test.ts`, `uploadPolicyBody.test.ts` (nhánh POST), `ticketApi.test.ts` (ba dạng `formData`), `TicketAttachmentSection.test.tsx`, `CreateTicketPage.test.tsx`, `e2e/attachments.spec.ts`, `e2e/fixtures.ts` (`presign.formData`) |

## 3. Thay đổi

### 3.1 Mã

1. **`uploadClient.ts`:** bỏ tùy chọn `formData` và nhánh `POST/FormData`; luôn `PUT`. Tiêu đề gửi đi lấy từ `requiredHeaders` do backend trả (gồm `Content-Type`); nếu backend chưa trả thì dùng `Content-Type` hiện tại. Giữ client axios riêng không có `Authorization`. Giữ báo tiến trình và hủy bằng `AbortSignal`.
2. **`ticket.types.ts`, `ticketContract.ts`:** `UploadUrlResult` bỏ `formData`, thêm `requiredHeaders?: Record<string, string>`. Bộ đọc kiểm tra mọi giá trị là chuỗi và `uploadUrl` là http(s). Trong giai đoạn chuyển tiếp vẫn chấp nhận và **bỏ qua** `formData` để không vỡ khi gặp backend cũ; gỡ hẳn ở giai đoạn 4.
3. **`uploadAttachment.ts`:** truyền `requiredHeaders` cho bước tải lên; không đổi thứ tự cấp URL, tải lên, xác nhận và cơ chế xác nhận lại không gửi lại tệp.
4. **Thông báo lỗi tải lên:** URL hết hạn trả 403 `ExpiredRequest` **không kèm tiêu đề CORS**, và thiếu CORS cũng khiến trình duyệt chỉ báo lỗi mạng. Hai tình huống không phân biệt được ở phía trình duyệt, nên thông báo nêu cả khả năng "liên kết đã hết hạn" và hướng dẫn chọn lại tệp để tạo liên kết mới. Không tự thử lại (giữ quy tắc không tự lặp thao tác ghi).
5. **Tải xuống:** URL xin ngay khi bấm nên hạn ngắn (đề xuất 300 giây) không ảnh hưởng. Tên tệp tải về: khóa cuối `tickets/{id}/attachments/{guid}` không có tên và đuôi tệp gốc, và thuộc tính `download` của liên kết bị bỏ qua với URL khác origin, nên tên tệp phải đến từ tiêu đề `Content-Disposition` của R2. Backend cần kiểm chứng khả năng đặt `response-content-disposition` khi ký URL tải xuống (mục kiểm chứng của ADR-017); web chỉ mở URL, không tự dựng tên.
6. Không đọc, lưu hay hiển thị URL ký ngoài lúc dùng; không ghi vào log, fixture thật hay ảnh chụp.

### 3.2 Kiểm thử

- `uploadClient.test.ts`: cập nhật; xóa `uploadPolicyBody.test.ts`.
- `ticketApi.test.ts`: thay ba dạng `formData` bằng các dạng `requiredHeaders` hợp lệ, thiếu và sai kiểu; kiểm bộ đọc bỏ qua `formData` cũ.
- `TicketAttachmentSection.test.tsx`, `CreateTicketPage.test.tsx`: sửa chú thích nhắc POST; thêm ca tiêu đề đã ký được gửi nguyên.
- `e2e/attachments.spec.ts`, `e2e/fixtures.ts`: chuyển giả lập kho lưu trữ từ POST policy sang PUT (phản hồi 200 và 403 không kèm CORS), giữ ca "tải lên xong nhưng xác nhận lỗi thì xác nhận lại không gửi lại tệp".
- Chạy `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, và `npm run test:e2e` (đổi luồng người dùng). E2E dùng API giả nên **không chứng minh** R2 thật; kiểm chứng với R2 thật là bước tay ở môi trường dev (mục 5).

### 3.3 Hợp đồng

Sau khi backend đổi phản hồi `upload-url`, cập nhật snapshot theo mục 22 của [AGENTS.md](../../AGENTS.md): lấy baseline từ đúng SHA backend, cập nhật `tests/contracts/backend-openapi.json` và `backend-source.json`, chạy `npm run contract:generate` rồi `npm run contract:check`. Snapshot hiện ghim backend `0f189b5` và đã lệch baseline hiện tại ở sáu thao tác (xem [api-baseline.md](api-baseline.md)); nên đồng bộ cả hai phần trong cùng một lần để không tách thành hai đợt.

## 4. Phối hợp CORS với hạ tầng

Trình duyệt `PUT` thẳng tới R2 nên bucket phải cho phép origin của web:

| Môi trường | Origin cần liệt kê |
| --- | --- |
| Máy lập trình viên | `http://localhost:5173` |
| Staging, production | Origin triển khai của web (một giá trị chính xác mỗi môi trường) |
| Bản xem trước (preview) của Vercel | Có địa chỉ tên miền phụ thay đổi theo từng bản triển khai; chỉ dùng được nếu bucket `dev` cho phép rộng hơn. Để chủ dự án quyết định (mục 7) |

Yêu cầu tối thiểu: `AllowedMethods: PUT`, `AllowedHeaders: Content-Type`, `ExposeHeaders: ETag`. Web không đọc `ETag` hiện nay, nhưng giữ để dùng sau. Cấu hình do hạ tầng áp dụng; web chỉ báo khi đổi origin triển khai. Web không đặt CSP ở `index.html`, `vercel.json` hay NGINX của kho này, nên không có `connect-src` nào cần sửa (đã kiểm tra); nếu sau này thêm CSP phải cho phép `https://*.r2.cloudflarestorage.com`.

## 5. Kiểm chứng với R2 thật (tay, môi trường dev)

Sau khi backend và bucket `dev` sẵn sàng: tải lên tệp nhỏ, tệp sát 10 MiB và tệp loại không có `type` (`application/octet-stream`); thử tệp tải lên thành công nhưng xác nhận lỗi rồi xác nhận lại; để liên kết hết hạn rồi tải lên; bấm tải xuống và kiểm tên tệp lưu về; kiểm tab Network trình duyệt chỉ thấy `PUT` tới R2 không kèm `Authorization`. Ghi kết quả (SHA web, SHA backend, thời điểm) vào bàn giao.

## 6. Lộ trình (phần web)

| Giai đoạn | Việc của web | Điều kiện xong |
| --- | --- | --- |
| 0–1 | Không đổi mã; theo dõi kết quả kiểm chứng ở backend | – |
| 2 | Chuẩn bị nhánh: `requiredHeaders`, bỏ qua `formData`, cập nhật kiểm thử và snapshot khi backend xuất baseline mới | Lint, typecheck, test, build, E2E đạt |
| 3 | Kiểm chứng tay với R2 thật; đồng bộ CORS với hạ tầng | Mục 5 đạt |
| 4 | Gỡ hẳn xử lý `formData`; cập nhật README, AGENTS, [api-baseline.md](api-baseline.md) và cẩm nang chung (bốn kho cùng lúc) | Tài liệu khớp mã |
| 5 | Cập nhật origin cho staging, production | Chủ dự án duyệt |

Web không cần chờ hạ tầng gỡ MinIO để hoạt động, nhưng phải đi cùng backend (giai đoạn 2) vì nhánh PUT thô chỉ đúng khi backend ký PUT.

## 7. Rủi ro và quyết định còn mở

| Chủ đề | Nội dung |
| --- | --- |
| Tiêu đề không khớp chữ ký | Chữ ký có `Content-Type`; gửi khác thì R2 từ chối. Giảm thiểu: dùng `requiredHeaders` từ backend, một nguồn duy nhất |
| Lỗi hết hạn không đọc được | Không có CORS trên phản hồi lỗi hết hạn; chỉ phân biệt được bằng thông báo chung (mục 3.1.4) |
| Tên tệp khi tải xuống | Phụ thuộc kết quả kiểm chứng `response-content-disposition` ở backend |
| Origin của bản xem trước Vercel | Quyết định: mở rộng origin cho bucket `dev` (rủi ro thấp vì mọi PUT cần URL ký) hay chỉ cho phép `localhost` và không thử tải tệp trên bản xem trước |
| Snapshot hợp đồng lệch | Đồng bộ chung với thay đổi `upload-url` (mục 3.3) |
