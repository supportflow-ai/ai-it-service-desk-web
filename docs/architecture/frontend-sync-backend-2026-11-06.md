# Kế hoạch công việc Frontend đồng bộ Backend (06/11/2026)

Tài liệu này tổng hợp toàn bộ các thay đổi backend do **Tuannll** thực hiện và merge vào nhánh `dev` trong ngày 06/11/2026 (PR #46, PR #47, PR #48), kèm danh sách chi tiết các công việc phía frontend cần thực hiện để đồng bộ dữ liệu và tính năng theo đúng kiến trúc `AGENTS.md`.

---

## 1. Tóm tắt các commit của Tuannll ngày 06/11/2026 (Backend)

| Pull Request | Commit SHA | Thời gian | Tên commit / Nội dung tóm tắt |
|---|---|---|---|
| **PR #46** | `f6b321f` (merge `9652f00`) | 06/11/2026 01:06 | **`fix(backend): harden actor and attachment validation`**<br>- Thắt chặt validation upload tệp đính kèm: kiểm tra prefix `uploads/pending/{ticketId}/`, kiểm tra hạn quyền upload grant, verify kích thước byte & MIME type thực tế từ storage, copy sang đích lưu trữ chính thức trước khi commit DB.<br>- Bổ sung xác thực actor cho các use case Knowledge Base. |
| **PR #47** | `8c81a9f` (merge `b678160`) | 06/11/2026 03:00 | **`feat(identity): [TC-180] bo sung cac bang refresh tokens departments va otp codes`**<br>- Bổ sung migration và schema cơ sở dữ liệu cho 3 bảng: `refresh_tokens`, `departments`, `otp_codes`. |
| **PR #48** | `e75c4fb` (merge `0f189b5`) | 06/11/2026 04:02 | **`feat(identity): [TC-180] trien khai bo API refresh token departments otp va phan quyen`**<br>- Hoàn thiện và công bố 7 endpoints mới thuộc phân hệ Identity & Departments vào `contracts/backend/openapi-baseline.json`. |

---

## 2. Bảng đối chiếu các API Backend mới được công bố

| Endpoint | Method | Quyền hạn (Auth) | Request Payload | Response Body (200 / 201) | Mô tả nghiệp vụ |
|---|---|---|---|---|---|
| `/api/auth/login` | `POST` | Anonymous | `{ email, password }` | `{ token, refreshToken, user }` | Đăng nhập; bổ sung trả về `refreshToken`. |
| `/api/auth/register` | `POST` | Anonymous | `{ email, password, fullName }` | `{ token, refreshToken, user }` | Đăng ký; bổ sung trả về `refreshToken`. |
| `/api/auth/refresh` | `POST` | Anonymous | `{ refreshToken: string }` | `{ token, refreshToken, user }` | Cấp mới JWT Token khi token cũ hết hạn (401). |
| `/api/auth/revoke` | `POST` | Anonymous | `{ refreshToken: string }` | *204 No Content* | Thu hồi Refresh Token khi người dùng Logout. |
| `/api/departments` | `GET` | Bearer Token | *None* | `DepartmentDto[]` (`id, code, name, description`) | Lấy danh sách các phòng ban tổ chức. |
| `/api/auth/change-password` | `POST` | Bearer Token | `{ currentPassword, newPassword }` | `{ message: string }` | Đổi mật khẩu tài khoản đang đăng nhập. |
| `/api/auth/forgot-password` | `POST` | Anonymous | `{ email: string }` | `{ message: string }` | Yêu cầu gửi OTP đặt lại mật khẩu qua email. |
| `/api/auth/reset-password` | `POST` | Anonymous | `{ email, otpCode, newPassword }` | `{ message: string }` | Đặt lại mật khẩu mới bằng mã OTP. |
| `/api/users/{id}/roles` | `PUT` | RequireAdmin | `{ roles: string[] }` | `{ message: string }` | Quản trị viên cập nhật vai trò người dùng. |

---

## 3. Danh sách phần việc Frontend cần thực hiện (Chi tiết)

### Hạng mục 1: Cơ chế Refresh Token & Silent Re-authentication (Độ ưu tiên: Cao)
Mục tiêu: Đảm bảo người dùng không bị văng đăng xuất đột ngột khi JWT Bearer Token hết hạn (thời lượng JWT ngắn), đồng thời thu hồi token sạch sẽ khi logout.

- [ ] **1.1 Cập nhật Model & Contract (`src/features/auth/model/auth.types.ts`)**:
  - Bổ sung trường `refreshToken?: string` vào interface `AuthResponse`.
  - Khai báo các types payload:
    ```ts
    export interface RefreshAuthPayload { refreshToken: string }
    export interface RevokeTokenPayload { refreshToken: string }
    ```
- [ ] **1.2 Nâng cấp `sessionStore` (`src/features/auth/lib/sessionStore.ts`)**:
  - Quản lý đồng thời `token` và `refreshToken` trong local storage.
  - Cập nhật hàm `replace(token, refreshToken, signedOut)` và snapshot đồng bộ qua event storage giữa các tabs.
- [ ] **1.3 Bổ sung API adapter (`src/features/auth/api/authApi.ts`)**:
  - `authApi.refresh(payload: RefreshAuthPayload)`: gọi `POST /api/auth/refresh` với `authMode: 'anonymous'`.
  - `authApi.revoke(payload: RevokeTokenPayload)`: gọi `POST /api/auth/revoke`.
- [ ] **1.4 Cấu hình Silent Refresh Interceptor trong `shared/api/apiClient.ts`**:
  - Bắt lỗi HTTP 401 trên request có `authMode !== 'anonymous'`.
  - Kiểm tra nếu còn `refreshToken`: gọi refresh lấy token mới, cập nhật vào `sessionStore`, gắn token mới vào Authorization header và gửi lại (retry) request ban đầu.
  - Xử lý hàng đợi (queue) nếu có nhiều request cùng nhận 401 cùng lúc để tránh gọi refresh nhiều lần.
  - Nếu refresh thất bại (401): xóa phiên (`sessionStore.clear()`) và điều hướng về `/login`.
- [ ] **1.5 Nâng cấp hàm Đăng xuất (`logout`)**:
  - Gọi `authApi.revoke({ refreshToken })` trước khi xóa local storage để hủy token ở server.
- [ ] **1.6 Kiểm thử Unit Test**:
  - Viết test cho `sessionStore.test.ts`, `authApi.test.ts`, và `apiClient.ts`.

---

### Hạng mục 2: Tích hợp API Danh mục Phòng ban (Departments) (Độ ưu tiên: Trung bình)
Mục tiêu: Thay thế toàn bộ dữ liệu phòng ban tĩnh/giả lập bằng danh mục phòng ban thật từ backend.

- [ ] **2.1 Khai báo Model & Contract (`src/features/auth/model/department.types.ts` hoặc `auth.types.ts`)**:
  ```ts
  export interface DepartmentDto {
    id: string;
    code: string;
    name: string;
    description: string | null;
  }
  ```
- [ ] **2.2 Viết API adapter & Parser**:
  - Parser an toàn: `readDepartmentList(value: unknown): DepartmentDto[]`.
  - API method: `authApi.getDepartments(signal?: AbortSignal)`.
- [ ] **2.3 Viết custom hook `useDepartments` (`src/features/auth/hooks/useDepartments.ts`)**:
  - Dùng TanStack Query với query key: `['departments', sessionVersion]`.
- [ ] **2.4 Tích hợp vào UI**:
  - **Màn Tạo yêu cầu (`CreateTicketForm.tsx`)**: Bổ sung Select phòng ban người yêu cầu (`requesterDepartmentId`), tải trực tiếp từ `useDepartments()`.
  - **Màn Chi tiết Ticket (`TicketWorkspaceSidebar.tsx`)**: Khớp mã `departmentId` để hiển thị tên phòng ban chính xác thay vì fallback tĩnh.
- [ ] **2.5 Export qua public API (`src/features/auth/index.ts`)**:
  - Export `useDepartments`, `DepartmentDto` cho feature `tickets` sử dụng (tuân thủ ranh giới `tickets → auth`).

---

### Hạng mục 3: Luồng Quên mật khẩu & Đổi mật khẩu (OTP Flow) (Độ ưu tiên: Trung bình)
Mục tiêu: Cho phép người dùng tự khôi phục mật khẩu qua email OTP và đổi mật khẩu an toàn.

- [ ] **3.1 Model & Validation**:
  - Khai báo types: `ForgotPasswordPayload`, `ResetPasswordPayload`, `ChangePasswordPayload`.
  - Validation rules: kiểm tra định dạng email, mật khẩu tối thiểu 8 ký tự, mã OTP gồm chữ số.
- [ ] **3.2 API Adapter (`src/features/auth/api/authApi.ts`)**:
  - `authApi.forgotPassword(payload: ForgotPasswordPayload)`
  - `authApi.resetPassword(payload: ResetPasswordPayload)`
  - `authApi.changePassword(payload: ChangePasswordPayload)`
- [ ] **3.3 Xây dựng UI Quên mật khẩu**:
  - Tạo trang `/forgot-password` (`ForgotPasswordPage.tsx`).
  - Bước 1: Nhập email ➔ Gửi yêu cầu OTP.
  - Bước 2: Nhập OTP và mật khẩu mới ➔ Xác nhận đặt lại mật khẩu và chuyển hướng về đăng nhập.
  - Thêm liên kết "Quên mật khẩu?" tại form `LoginPage.tsx`.
- [ ] **3.4 Modal Đổi mật khẩu (`ChangePasswordModal.tsx`)**:
  - Gắn vào avatar header hoặc trang thông tin cá nhân.
  - Nhập mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu mới.

---

### Hạng mục 4: Quản lý phân quyền tài khoản Admin (`PUT /api/users/{id}/roles`) (Độ ưu tiên: Tiếp theo)
Mục tiêu: Hoàn thiện tính năng Quản trị người dùng cho vai trò Admin.

- [ ] **4.1 Model & API Adapter**:
  - `authApi.assignRoles(userId: string, roles: Role[])`.
  - Mutation hook `useAssignRoles()`.
- [ ] **4.2 Nâng cấp trang Admin Panel (`src/app/pages/AdminPanelPage.tsx` hoặc `features/auth/pages/AdminUsersPage.tsx`)**:
  - Hiển thị danh sách người dùng (`GET /api/users?role=Agent` và `role=Admin` hoặc all).
  - Modal chỉnh sửa vai trò: Checkbox `Requester`, `Agent`, `Admin`.
  - Cập nhật và invalidate danh sách sau khi lưu thành công.

---

### Hạng mục 5: Đồng bộ OpenAPI Contract & Baseline (Độ ưu tiên: Bắt buộc)
Mục tiêu: Đảm bảo tài liệu kiến trúc và bộ contract tests compile-time phản ánh đúng commit mới nhất của backend.

- [ ] **5.1 Cập nhật `docs/architecture/api-baseline.md`**:
  - Thêm bảng chi tiết 7 endpoint mới từ commit `e75c4fb`.
  - Cập nhật SHA đối chiếu lên `0f189b5`.
- [ ] **5.2 Cập nhật Contract Checks & Mock Fixtures**:
  - Cập nhật `tests/contracts/auth-contracts.ts` để kiểm tra compile-time các interfaces mới.
  - Bổ sung handlers trong MSW `tests/mocks/` và Playwright `e2e/fixtures.ts`.

---

## 4. Kế hoạch triển khai theo từng Pull Request (Đề xuất)

Để đảm bảo quy trình review sạch và dễ kiểm soát, nhóm công việc trên nên được chia làm 3 PR tuần tự:

1. **PR 1: `feat(auth): tích hợp refresh token silent-refresh và thu hồi token khi logout`**
   - Giải quyết Hạng mục 1.
   - Giúp toàn bộ ứng dụng duy trì phiên đăng nhập bền bỉ và đúng chuẩn bảo mật.
2. **PR 2: `feat(departments): tích hợp API danh mục phòng ban vào form tạo vé và sidebar`**
   - Giải quyết Hạng mục 2.
   - Loại bỏ hoàn toàn fallback tĩnh về phòng ban trên giao diện ticket.
3. **PR 3: `feat(identity): bổ sung trang quên mật khẩu OTP, đổi mật khẩu và phân quyền admin`**
   - Giải quyết Hạng mục 3 và Hạng mục 4.
   - Hoàn tất toàn bộ phạm vi còn lại của TC-180.

---

## 5. Tiêu chuẩn nghiệm thu (Definition of Done)
- [ ] Chạy `npm run typecheck` không có lỗi.
- [ ] Chạy `npm run lint` đạt: `Architecture boundaries and dependency graph: PASS`.
- [ ] Toàn bộ unit tests đạt 100% PASS (`npm test`).
- [ ] Build production thành công (`npm run build`).
- [ ] Playwright E2E tests đạt 100% PASS (`npx playwright test`).
- [ ] Không sử dụng dữ liệu giả (mock) trong production adapter.
