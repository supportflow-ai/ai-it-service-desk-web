# AI IT Service Desk Web

Frontend React 19, TypeScript 5.7, Vite 6 và Ant Design 5 của AI IT Service Desk.

Web cung cấp giao diện Identity và Ticketing. Theo `AI-02`, nghiệm thu phân loại AI có người duyệt cùng hai luồng nền tảng trên một cấu hình ứng viên. Giao diện duyệt AI hiện mới có khung, còn chờ nối với Backend. Bộ checkout liên kho có phạm vi và tiêu chí nghiệm thu trong `supportflow-ai-infra/docs/project/mvp.md`.

## Tài liệu tích hợp

Rà ngày 21/11/2026 tại Web `dev@89eabc4` và Backend `dev@3640c33`.

- Đối chiếu [quyền hiện hành](docs/architecture/api-baseline.md#quyền-hiện-hành), [snapshot đã ghim](tests/contracts/backend-source.json) và [điểm cần sửa trên giao diện](docs/product-contract-ui-notes.md).
- Khi chuẩn bị ứng viên R2, dùng [đối chiếu tải tệp](docs/architecture/r2-upload-plan.md) để kiểm phương thức, thông tin grant và bước xác nhận cùng bản Backend.
- Truy vết qua [bản đồng bộ Backend ngày 06/11](docs/architecture/frontend-sync-backend-2026-11-06.md) và [bản đối chiếu Knowledge UI tại Backend `1506a5b`](docs/architecture/knowledge-ui-access-map.md). Hai bảng lưu kết quả tại mốc ghi trong từng hồ sơ.

## Phát triển

Cần Node.js 22 và npm. Chạy từ thư mục gốc:

```sh
npm ci
npm run dev
```

Vite chạy tại http://localhost:5173 và chuyển tiếp `/api` đến backend tại
http://localhost:5000. Backend được quản lý riêng tại
https://github.com/supportflow-ai/ai-it-service-desk.
Nếu backend ở địa chỉ khác, cấu hình `VITE_API_BASE_URL` trong `.env.local`;
backend cần cho phép origin của frontend nếu gọi khác origin.

## Kiểm tra

```sh
npm run lint
npm run typecheck
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

Test chạy độc lập với checkout backend. `tests/contracts/ticket-status.json`
là bản chụp enum backend tại commit `f6a0adae01bd642753f02d2beae10abff6f410e3`;
cần cập nhật có phối hợp khi hợp đồng API thay đổi. Các test này kiểm tra
hợp đồng đã ghim, không tự phát hiện thay đổi mới trong repo backend.

Quy chuẩn kiến trúc và workflow coding agent nằm trong [AGENTS.md](AGENTS.md); quy trình nhánh, commit, PR của cả dự án nằm ở [cẩm nang chung](docs/team-handbook.md).
Nguồn contract, các endpoint được hỗ trợ và giới hạn kiểm thử được ghi tại
[API baseline](docs/architecture/api-baseline.md).
Unit/component/hook tests dùng Vitest và MSW. Browser smoke dùng Playwright Chromium
với API fixture trên production preview (cần chạy build trước), không thay thế nghiệm thu
backend thật. CI dùng Node 22 và chạy cả hai nhóm kiểm thử.

## Docker

```sh
docker build -t service-desk-web .
docker run --rm -p 8080:80 service-desk-web
```

Image phục vụ SPA bằng NGINX. Khi triển khai mặc định, gateway chung phải
chuyển `/api` tới backend và các đường dẫn giao diện tới container frontend.
Để dùng backend khác origin, truyền `--build-arg VITE_API_BASE_URL=https://api.example.com/api`
khi build và cấu hình CORS tương ứng ở backend.
Biến Vite được nhúng lúc build; không đặt khóa bí mật trong các biến này.

## Lịch sử chuyển repo

Repo này kế thừa nguyên lịch sử monorepo, giữ SHA commit cũ. Commit chuyển đổi
đưa frontend lên thư mục gốc và loại backend/hạ tầng khỏi phiên bản hiện tại.
Mã nguồn backend vẫn có thể được xem trong các commit cũ.

- Điểm tách: `f6a0adae01bd642753f02d2beae10abff6f410e3`.
- `archive/source/*`: các nhánh nguồn trên GitHub tại thời điểm chuyển.
- `archive/local/*`: các nhánh đã có trong bản sao local tại thời điểm chuyển.
- Danh sách 87 commit gốc: `docs/migration/source-commits.txt`.

Các nhánh `archive/*` chỉ dùng tra cứu lịch sử. Phát triển frontend trên nhánh
tạo từ `dev` và mở PR vào `dev`; `dev` được đưa vào `main` bằng PR tổng hợp.
Không merge các nhánh lưu trữ vào frontend.
Repo nguồn không bị thay đổi trong lần chuyển này.
