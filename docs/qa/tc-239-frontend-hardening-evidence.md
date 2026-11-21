# Bằng chứng TC-239: hardening giao diện, trợ năng, vai trò/phiên và bản production

Trạng thái: bằng chứng của nhóm giao diện, chưa phải biên bản nghiệm thu của QA. Nhánh `feature/tc-239-hardening-frontend`, tách từ `dev@89eabc4`. Mã kiểm chứng: commit `59c78d3`. Backend dùng cho mọi kiểm tra bên dưới là **API giả** của bộ E2E (`e2e/fixtures.ts`), nên chưa chứng minh gì với backend thật.

## 1. Phạm vi và commit

| Việc | Commit | Thay đổi chính |
| --- | --- | --- |
| TC-426 Rà trạng thái loading/error/empty | `f5271bf` | Hàng đợi xử lý không ghi "Không có ticket nào phù hợp" khi tải lỗi hoặc đang tải; danh sách yêu cầu của tôi không ghi "Bạn chưa có ticket nào" lúc đang tải; trang phân quyền người dùng có "Thử lại" và không ghi "Không tìm thấy người dùng" khi lỗi |
| TC-427 Rà form và trợ năng | `e4c889b` | Focus nhảy tới ô lỗi đầu tiên ở mọi form chính; `autocomplete` đúng loại; ô "Danh mục sự cố" có placeholder; số ticket ở "Yêu cầu gần đây" là liên kết dùng được bằng bàn phím; chữ phụ, placeholder, menu, tab, liên kết và nút "Đăng xuất" đạt 4.5:1 ở cả giao diện sáng và tối |
| TC-428 Rà vai trò, phiên, đăng xuất, 401 | `ca4bfe8` | Trang đăng nhập báo "Phiên đăng nhập đã hết hạn" sau khi máy chủ từ chối phiên; màn "không kiểm tra được phiên" có nút "Đăng xuất" |
| TC-429 Responsive laptop/tablet | `fe273da` | Thanh bên thu gọn dưới 992px; header không vỡ; bảng cuộn ngang trong thẻ; tiêu đề thẻ xuống dòng; thẻ đăng nhập không rộng cố định |
| TC-430 Bản production và smoke | `59c78d3` | Favicon và meta; tách chunk `react` và `antd`; tài liệu này |

## 2. Cách kiểm tra

- Bản kiểm tra là **bản build production** (`npm run build`, chạy bằng `vite preview`), Chromium qua Playwright.
- Trợ năng: axe-core 4.10.2, bộ luật WCAG 2.0 A và AA, quét sau khi trang đã yên (tránh số liệu giữa lúc chuyển màu).
- Phạm vi quét: 16 trang theo vai trò (đăng nhập, đăng ký, quên mật khẩu, trang chủ khách, và các màn của Requester, Agent, Admin) × 3 khung nhìn (laptop 1366×768, tablet ngang 1024×768, tablet dọc 768×1024) × 2 giao diện (sáng, tối) = 96 lượt tải trang.
- Mỗi lượt đo thêm: cuộn ngang của cả trang, thông báo `console` mức error và warning, lỗi trang (`pageerror`).

## 3. Kết quả

| Chỉ số | Kết quả |
| --- | --- |
| Cuộn ngang cả trang | 0 trong 96 lượt |
| Lỗi hoặc cảnh báo console, lỗi trang | 0 trong 96 lượt |
| axe: `color-contrast` | Ban đầu có lỗi mức serious ở chữ phụ và placeholder (giao diện sáng) và ở mục menu đang chọn, tab, liên kết, nút "Đăng xuất" (giao diện tối); sau sửa còn 0 ở cả hai giao diện |
| axe: `aria-allowed-attr` | 1 điểm còn lại, xem mục 4 |
| Lint và kiểm tra kiến trúc | Đạt |
| `tsc` (ứng dụng, test, hợp đồng) | Đạt |
| `contract:check` | Đạt |
| Test đơn vị | 58 tệp, 427 test đạt |
| E2E (API giả) | 70 test đạt, gồm 33 test responsive (11 trang × 3 khung nhìn) và 2 luồng phiên hết hạn |
| Build production | Đạt; không có source map, không có `console.log`, không có địa chỉ `localhost` của ứng dụng; `VITE_API_BASE_URL` mặc định `/api`; build thử với `VITE_API_BASE_URL=https://api.example.test` thì giá trị đó có trong bundle và không lọt vào bản build mặc định |
| Dung lượng | Tổng 1,6 MB, gzip 0,5 MB. Chunk `antd` 949 kB (gzip 296 kB) còn lớn hơn 500 kB nên cảnh báo của Vite vẫn xuất hiện |

## 4. Còn lại và giới hạn

1. **`aria-allowed-attr` ở ô chọn danh mục (`/tickets/new`).** Ant Design gắn `aria-required` lên thẻ bọc `.ant-select` (không có vai trò) ngoài ô `combobox` bên trong. Ô `combobox` thật có `aria-required` đúng và test xác nhận `toBeRequired`. Đây là lỗi của thư viện, chưa có cách sửa gọn trong mã của dự án.
2. **Chưa nghiệm thu với backend thật.** Mọi luồng chạy trên API giả. Cần một lượt thủ công với tài khoản Requester, Agent, Admin trên môi trường dev, ghi SHA web và SHA backend.
3. **Chưa chứng nhận WCAG đầy đủ** (ngoài phạm vi). axe chỉ bắt được một phần lỗi; chưa có kiểm tra thủ công bằng trình đọc màn hình.
4. **Phông chữ tải từ Google Fonts** (`index.html`). Môi trường chặn mạng ngoài hoặc cần tuân thủ riêng tư sẽ rơi về phông hệ thống. Nên tự lưu phông khi chốt môi trường chính thức.
5. **`nginx.conf` của web chưa được chỉnh.** Chưa có nén `gzip`, `Cache-Control` dài cho `/assets/` (tên tệp có mã băm) và không lưu đệm `index.html`, cũng như các tiêu đề `X-Content-Type-Options`, `Referrer-Policy`. Không chỉnh trong đợt này vì không chạy được `nginx -t` hay build image tại máy kiểm tra (Docker chưa chạy). Kho infra nên quyết định ở lớp cổng NGINX hoặc bổ sung tại đây kèm kiểm thử image.
6. **Test "requests OTP and resets password successfully"** (`ForgotPasswordPage.test.tsx`) chạy khoảng 10 giây, gần mức timeout 15 giây khi chạy song song; từng một lần báo hỏng khi máy tải nặng và đạt khi chạy riêng. Chưa thuộc phạm vi sửa.
7. **Thanh bên thu gọn** chỉ kiểm bằng E2E (jsdom không có điểm ngắt); tên của mục menu khi thu gọn nằm trong tooltip.

## 5. Chạy lại

```sh
npm ci
npm run lint && npm run typecheck && npm test
npm run build && npm run test:e2e
```
