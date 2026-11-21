# Kế hoạch chuyển tải tệp sang Cloudflare R2 (giao diện web)

Trạng thái: **Đã chốt · chờ triển khai**. ADR-017 của Backend được chấp nhận ngày 16/11/2026, áp dụng R2 cho local, kiểm thử, CI, staging và production. Đợt D5 đối chiếu `dev@89eabc4` ngày 21/11/2026. Kế hoạch phối hợp nằm ở Backend (`docs/architecture/r2-storage-plan.md`), Infra (`docs/infra/r2-storage-plan.md`) và AI Service (`docs/r2-impact.md`).

## 1. Tóm tắt

Web hiện có hai nhánh tải tệp thẳng tới URL ký. Backend MinIO hiện trả `formData` để client gửi multipart POST. Nhánh PUT thô hoạt động khi phản hồi là URL ký cho PUT. Chuyển R2 cần đồng bộ cặp Backend/Web, quyền tải, header đã ký, snapshot hợp đồng và CORS trước khi gỡ POST. Các cấu hình ghim MinIO tiếp tục dùng hướng dẫn hiện có đến khi được chuyển. [URL ký của R2](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)

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
2. **`ticket.types.ts`, `ticketContract.ts`:** phản hồi R2 dự kiến bỏ `formData`, thêm `requiredHeaders?: Record<string, string>`. Bộ đọc kiểm tra hợp đồng và URL do Backend cấp. Chuyển luồng tệp theo cặp SHA/digest tương thích. Giữ nhánh POST ở phiên bản phục vụ backend MinIO. Ứng viên chỉ hỗ trợ PUT từ chối phản hồi chứa POST policy để tránh gửi sai phương thức.
3. **`uploadAttachment.ts`:** truyền `requiredHeaders` cho bước tải lên; không đổi thứ tự cấp URL, tải lên, xác nhận và cơ chế xác nhận lại không gửi lại tệp.
4. **Thông báo lỗi tải lên:** Cloudflare ghi URL hết hạn trả `403 ExpiredRequest` và thiếu header CORS, nên browser JavaScript có thể chỉ thấy lỗi mạng như khi CORS cấu hình sai. Thông báo nêu khả năng hết hạn và cách xin liên kết mới, giữ việc thử lại do người dùng chủ động. Confirm bị gián đoạn sau PUT dùng lại grant còn hợp lệ, không mặc định gửi lại tệp. [CORS của R2](https://developers.cloudflare.com/r2/buckets/cors/)
5. **Tải xuống:** xin URL mới khi bấm. Hạn 300 giây là đề xuất cần đo. Khóa cuối chỉ có ID. Việc giữ tên gốc phụ thuộc phản hồi `Content-Disposition` của ứng viên. Kiểm trên trình duyệt thật với tên Unicode, gồm cả tham số `response-content-disposition` nếu Backend dùng cách đó.
6. Không đọc, lưu hay hiển thị URL ký ngoài lúc dùng; không ghi vào log, fixture thật hay ảnh chụp.

### 3.2 Kiểm thử

- `uploadClient.test.ts`: cập nhật; xóa `uploadPolicyBody.test.ts`.
- `ticketApi.test.ts`: kiểm `requiredHeaders` hợp lệ, thiếu và sai kiểu. Kiểm rằng client chỉ hỗ trợ PUT từ chối phản hồi POST policy.
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
| Bản xem trước (preview) của Vercel | Chờ quyết định có đưa preview vào phạm vi thử tệp và origin nào được phép (mục 7) |

Luồng PUT cần origin đúng `scheme://host[:port]`, phương thức PUT và danh sách header khớp hợp đồng. `Content-Type` có trong phương án đã ký. `ExposeHeaders: ETag` có thể giữ theo mẫu Infra. Web hiện chưa đọc ETag. Nếu ingress áp CSP, kiểm `connect-src` cho host S3 đúng môi trường. Tải xuống bằng điều hướng chưa cần mở GET cho `fetch`. [CORS của R2](https://developers.cloudflare.com/r2/buckets/cors/)

## 5. Kiểm chứng với R2 thật (tay, môi trường dev)

Sau khi Backend và bucket `dev` sẵn sàng, kiểm từ origin Web thực tế trên ứng viên. Dùng tệp giả lập, ghi thời điểm, SHA/digest Web và Backend, trình duyệt và mã trạng thái đã che dữ liệu nhạy cảm.

| Ca cần đo | Kỳ vọng |
| --- | --- |
| Cấp grant → PUT → confirm → tải xuống | Tệp nhỏ, sát 10 MiB và tệp thiếu MIME từ trình duyệt đi đúng metadata đã ký. PUT dùng đúng header và client lưu trữ không gửi JWT. GET cần đổi URL sau khi hết hạn và lưu đúng tên. |
| Hết hạn hoặc gián đoạn | URL hoặc grant hết hạn hiện lỗi phù hợp với bước. Nếu PUT đã thành công và confirm bị gián đoạn, thử lại confirm với grant còn hiệu lực. Sau commit chỉ có một attachment. |
| Quyền đọc và CORS | Origin Web hợp lệ qua preflight. Origin ngoài danh sách không qua CORS. Backend vẫn kiểm quyền cấp link tải xuống. Kết quả E2E mô phỏng giữ riêng với kết quả bucket thật. |

## 6. Lộ trình (phần web)

| Giai đoạn | Việc của web | Điều kiện xong |
| --- | --- | --- |
| 0–1 | Không đổi mã; theo dõi kết quả kiểm chứng ở backend | – |
| 2 | Chuẩn bị ứng viên PUT và `requiredHeaders`, cập nhật kiểm thử và snapshot khi Backend xuất baseline mới | Lint, typecheck, test, build, E2E đạt |
| 3 | Kiểm chứng tay với R2 thật; đồng bộ CORS với hạ tầng | Mục 5 đạt |
| 4 | Khi phiên bản đã ghim chuyển sang R2, gỡ hỗ trợ POST ở nguồn đang phát hành R2 và chuyển chỉ dẫn cũ sang lịch sử. Cập nhật README, AGENTS, [api-baseline.md](api-baseline.md) và cẩm nang chung | Tài liệu khớp phiên bản đang chạy |
| 5 | Cập nhật origin cho staging, production | Chủ dự án duyệt |

Thử trước cặp ứng viên Web/Backend dùng R2 trên bucket thử. Chuyển chỉ dẫn multipart POST khỏi phần hiện hành khi cả hai image/SHA đã chuyển và kiểm thật đạt trên cấu hình đó. Khi cần lùi, quay về cặp phiên bản tương thích với storage và dữ liệu còn đọc được. Quyết định giữ dữ liệu và phương án phục hồi do Backend/Infra đối soát trước khi kích hoạt lại ghi.

## 7. Rủi ro và quyết định còn mở

| Chủ đề | Nội dung |
| --- | --- |
| Tiêu đề không khớp chữ ký | Chữ ký có `Content-Type`; gửi khác thì R2 từ chối. Giảm thiểu: dùng `requiredHeaders` từ backend, một nguồn duy nhất |
| Lỗi hết hạn không đọc được | Không có CORS trên phản hồi lỗi hết hạn; chỉ phân biệt được bằng thông báo chung (mục 3.1.4) |
| Tên tệp khi tải xuống | Phụ thuộc kết quả kiểm chứng `response-content-disposition` ở backend |
| Origin của bản xem trước Vercel | Nếu đưa preview vào phạm vi, duyệt origin cụ thể trên bucket `dev` và kiểm lại preflight. Bucket staging và production giữ danh sách origin riêng. |
| Snapshot hợp đồng lệch | Đồng bộ chung với thay đổi `upload-url` (mục 3.3) |
