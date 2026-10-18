# AI IT Service Desk Web

Frontend React 19, TypeScript 5.7, Vite 6 và Ant Design 5 của AI IT Service Desk.

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
npm run build
npm test
```

Test chạy độc lập với checkout backend. `tests/contracts/ticket-status.json`
là bản chụp enum backend tại commit `f6a0adae01bd642753f02d2beae10abff6f410e3`;
cần cập nhật có phối hợp khi hợp đồng API thay đổi. Các test này kiểm tra
hợp đồng đã ghim, không tự phát hiện thay đổi mới trong repo backend.

## Docker

[Frontend CI](.github/workflows/ci.yml) dùng GitHub Actions để chạy npm ci, lint, build, test và build Docker image trên PR hoặc push vào main/dev/codex/feature. Có thể chạy thủ công từ tab Actions sau khi workflow có trên nhánh mặc định. Job `frontend` chỉ cần quyền đọc mã nguồn; không cần Jenkins, không push image hay tự deploy production. Smoke toàn hệ thống nằm trong repo supportflow-ai-infra và ghim SHA frontend/backend.

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

Các nhánh `archive/*` chỉ dùng tra cứu lịch sử. Phát triển frontend trên `main`
hoặc nhánh tạo từ `main`. Không merge các nhánh lưu trữ vào frontend.
Repo nguồn không bị thay đổi trong lần chuyển này.
