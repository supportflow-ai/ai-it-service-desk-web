# Ghi chú giao diện cho hợp đồng sản phẩm P0

**Phiên bản:** 0.2.0 · **Cập nhật:** 05/11/2026 · **Đặt tại:** repo `ai-it-service-desk-web`, thư mục `docs/`
**Trạng thái:** đề xuất chờ duyệt, đi kèm bộ hợp đồng sản phẩm ở repo backend: [`docs/product-contract/`](https://github.com/supportflow-ai/ai-it-service-desk/tree/main/docs/product-contract).

Tài liệu này chỉ chứa phần riêng của giao diện. Phạm vi, quyền và API thuộc bộ hợp đồng ở repo backend; khi khác nhau, bộ hợp đồng thắng. Quy tắc kiến trúc giao diện vẫn theo `AGENTS.md` của repo này.

## 1. Route và vai trò

| Màn hình | Route | Vai trò | API chính |
| --- | --- | --- | --- |
| Đăng nhập | `/login` | Công khai | `POST /auth/login` |
| Đăng ký | `/register` | Công khai | `POST /auth/register` |
| Phiếu của tôi | `/requester-dashboard/tickets` | Requester, Agent, Admin | `GET /tickets/me` |
| Chi tiết phiếu | `/requester-dashboard/tickets/:id` | Requester, Agent, Admin | `GET /tickets/{id}` |
| Tạo phiếu | `/tickets/new` | Requester, Agent, Admin | `POST /tickets` |
| Hàng đợi | `/agent-workspace` | Agent, Admin | `GET /tickets/queue` |
| Không gian xử lý phiếu | `/agent-workspace/tickets/:id` | Agent, Admin | `GET /tickets/{id}` và các lệnh của nhân viên |
| Quản trị | `/admin-panel` | Admin | Chưa có; hiển thị `UnavailablePage`, ngoài MVP |

Guard route chỉ để điều hướng. Backend luôn kiểm tra lại quyền.

## 2. Việc cần sửa ở giao diện theo sổ quyết định

| Mã | Việc ở giao diện | Tệp liên quan |
| --- | --- | --- |
| QD-01 | Bỏ yêu cầu `email` trong `readAgents`; hiển thị `fullName`, nếu không có thì dùng `userId` (sau khi chủ dự án duyệt) | `src/features/tickets/api/ticketContract.ts` |
| QD-02 | Cho Admin thấy nút nhận xử lý, nếu chủ dự án chọn theo backend | `src/features/tickets/model/ticketPermissions.ts` (`canClaimTicket`) |
| QD-03 | Chỉ hiện "hủy phân công" khi trạng thái là `Assigned` | `ticketPermissions.ts` (`canUnassignTicket`) |
| QD-04 | Giữ tắt ô lọc ưu tiên; sửa câu "chưa hỗ trợ" thành "chưa thuộc MVP" nếu cần | `AgentQueueToolbar.tsx` |
| QD-07 | Sinh lại kiểu sau khi backend xuất bản chuẩn mới (`npm run contract:generate`) | `tests/contracts/` |

Chưa có màn hình sửa phiếu (F-TK-05). Chỉ làm khi chủ dự án xác nhận chức năng này thuộc phạm vi nghiệm thu.

## 3. Trạng thái giao diện cần hỗ trợ cho mỗi luồng

| Trạng thái | Hành vi tối thiểu | Ví dụ |
| --- | --- | --- |
| Đang tải | Hiển thị chỗ giữ; không gửi thao tác ghi lặp | Tải danh sách, tải phiếu |
| Rỗng | Phân biệt "không có dữ liệu" với "lỗi API" | Hàng đợi rỗng |
| Thành công | Làm mới hoặc vô hiệu cache liên quan sau khi máy chủ trả thành công | Phân công, bình luận, xác nhận tệp |
| Lỗi nhập liệu | Đánh dấu trường sai, không gửi request | Tiêu đề quá 100 ký tự, bình luận dưới 2 ký tự |
| 401 hoặc hết hạn | Xóa phiên, về trang đăng nhập | JWT hết hạn |
| 403 | Báo không có quyền | Requester gọi lệnh của nhân viên |
| 404 | Không suy luận phiếu có tồn tại | ID sai hoặc phiếu người khác |
| 409 | Giữ dữ liệu đã nhập, báo xung đột, tải lại revision; không tự gửi lại | Phiếu đã bị người khác sửa |
| 503 hoặc lỗi mạng | Báo lỗi; không coi thao tác ghi đã thành công | DB hoặc lưu tệp không khả dụng |
| Chờ xác nhận tệp | Cho xác nhận lại bằng `storageKey` hiện có; không tải nội dung lên lần hai | Đã tải lên nhưng xác nhận lỗi |

## 4. Đối chiếu với mã giao diện trên `dev` (06/11/2026)

Mục này do nhóm giao diện thêm sau khi đọc mã; phần 1–3 ở trên giữ nguyên theo bản đề xuất. Các mục ở bảng 2 được viết theo `main` cũ, nên nhiều việc đã xong.

| Mã | Hiện trạng trên `dev` | Cần chủ dự án quyết định? |
| --- | --- | --- |
| QD-01 | Xong. `readAgentDirectory` chỉ cần `userId`, `fullName` có thể null; không còn đòi `email`. | Không |
| QD-02 | Xong. `canClaimTicket` cho Agent và Admin; phiếu `Assigned` cho Agent khác chỉ Admin được nhận (như backend). | Không |
| QD-03 | Xong. `canUnassignTicket` chỉ cho phép khi phiếu đang `Assigned`. | Không |
| QD-04 | **Khác đề xuất.** Ô lọc "Ưu tiên" và sắp xếp theo ưu tiên đang **bật** và gọi `priority`, `sortByPriority` của `GET /tickets/queue` (đã có ở backend). Đề xuất của tài liệu là tắt. | **Có.** Giữ bật, hoặc tắt theo đề xuất |
| QD-05 | Mục "Kho tri thức" và các route `/knowledge/*` vẫn hiển thị và gọi API. | **Có**, chặn phát hành |
| QD-06 | Giao diện **có** gửi `Idempotency-Key` khi tạo phiếu (`useCreateTicket`), cùng một khóa cho cùng nội dung. | Không; nên cập nhật tài liệu 01, 02, 03 |
| QD-07 | Bản OpenAPI của backend `main` (`bf38ef9`) có cùng SHA-256 với bản giao diện đang ghim (`4820b424…`); kiểm tra bằng `node tools/backend-contract.mjs --backend-file …`. Chưa cần sinh lại kiểu. | Không |
| F-TK-05 | **Đã có** hộp thoại sửa phiếu (`TicketEditDialog`), gửi `expectedRevision`; chỉ chủ phiếu hoặc Admin, và chỉ khi `Submitted`. | Có: xác nhận chức năng thuộc nghiệm thu |
| Chờ xác nhận tệp | Xong. Khi bước xác nhận lỗi tạm thời (mất kết nối, 5xx), giao diện giữ `storageKey`, hiện "Xác nhận lại" và không tải tệp lên lần hai. Lỗi 4xx (hết hạn, không khớp) thì phải chọn lại tệp. | Không |
