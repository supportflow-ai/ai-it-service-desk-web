# AGENTS.md — Frontend Architecture and Engineering Rules

## 1. Mục tiêu và phạm vi

Frontend này sử dụng **Feature-Based Architecture + Modular Boundaries + SOLID
+ Contract-Driven Development + TanStack Query**.
Mục tiêu là ownership rõ, dependency một chiều, page mỏng, dữ liệu nhất quán
và code dễ kiểm thử. Không áp dụng máy móc kiến trúc bốn tầng backend vào React.
Quy định này áp dụng cho mọi thay đổi code frontend.

## 2. Dependency rule

Hướng dependency: `main/App → app → features → shared`. App được dùng Shared trực tiếp.

- Shared không import App hoặc Features. Feature không import App.
- Bên ngoài feature chỉ import qua `index.ts` gốc, kể cả import type.
- Không deep import, dependency cycle hoặc dùng relative path, re-export,
  dynamic import để vượt boundary.
- File nội bộ không import ngược public index của chính feature.
- Dependency liên feature được phép: `tickets → auth`, `ai-assistance → tickets`.
- Dependency liên feature mới phải có lý do, tài liệu và lint/test tương ứng.
  Ưu tiên composition tại App hoặc props thay vì thêm dependency.

## 3. Trách nhiệm các vùng

`app/`: configuration/bootstrap, providers, router/guards, layouts, navigation
và trang cấp ứng dụng. Không chứa business rules hay services của feature.

`features/`: mỗi feature sở hữu một khu vực chức năng. Không tạo components,
pages, services hoặc types ở cấp src để trộn nghiệp vụ nhiều feature.

`shared/`: hạ tầng hoặc code không thuộc riêng feature:
- `api/`: HTTP và chuẩn hóa lỗi.
- `ui/`: UI không biết nghiệp vụ.
- `hooks/`, `lib/`, `types/`, `constants/`: code dùng chung có ownership rõ.

Không đưa ticket status, AI rules hoặc knowledge logic vào Shared. Chỉ chuyển
code vào Shared khi có nhu cầu thực tế hoặc trách nhiệm hạ tầng rõ ràng.

## 4. Cấu trúc chuẩn của feature

```text
features/<feature>/
├── api/
├── model/
├── hooks/
├── components/
├── pages/
├── validation/
├── lib/
└── index.ts
```

Chỉ tạo thư mục có trách nhiệm thực sự.
- api: DTO, HTTP adapter, mapper khi cần, query keys/options.
- model: types, metadata, constants, pure permission helpers.
- hooks: Query, mutation và điều phối use case.
- components: UI thuộc feature; pages: route orchestration/composition.
- validation: validation nghiệp vụ dùng lại; lib: logic nội bộ còn lại.

Model phải thuần: không HTTP, browser storage, React, Ant Design hoặc router.
Component dùng PascalCase.tsx, hook dùng useX.ts, hàm dùng camelCase.ts,
types dùng <feature>.types.ts. Ưu tiên @/ qua module; relative trong cùng feature.

## 5. Public feature API

index.ts là hợp đồng công khai; export có chủ đích pages/components/hooks/types.
Dùng named export và export type, không export *, không barrel ở mọi thư mục,
không re-export nội bộ feature khác, không side effect khi import.
HTTP adapter mặc định là nội bộ. Thay public API phải cập nhật caller và tests.

## 6. Thin pages và component decomposition

Page chỉ đọc/kiểm tra params, gọi hooks, chọn trạng thái và compose/điều hướng.
Page/component không gọi HTTP hoặc feature API trực tiếp. Không gom fetch,
mutation, mapping, permission, form, notification và layout vào một component.
Tách theo responsibility. Khoảng 100–200 dòng là tín hiệu review, không hard limit.
Local state dành cho form, modal, tab và tương tác tạm thời.

## 7. TanStack Query và remote state

TanStack Query là nguồn remote state duy nhất.
- Không fetch bằng useEffect + useState; không sao chép Query data sang state/Context.
- Query keys tập trung theo feature, chứa mọi tham số ảnh hưởng dữ liệu.
- Phân vùng dữ liệu riêng tư theo tài khoản/phiên; không đặt token trong key.
- Truyền AbortSignal xuống HTTP; không hiển thị dữ liệu ID cũ dưới ID mới.
- Mutation thành công cập nhật/invalidate cache liên quan; mặc định không tự retry.
- Không retry lỗi quyền hoặc request không hợp lệ.
- Logout/đổi phiên phải hủy request và xóa cache riêng tư.

Context dành cho session metadata/composition. Chưa thêm Redux/Zustand nếu chưa cần.

## 8. HTTP, API layer và contract

`Page/Component → Hook → Feature API → Shared HTTP client`.
Axios chỉ được khởi tạo trong Shared API; feature adapter dùng client chung.
Không gọi axios/fetch trong Page, Component hoặc model.
App truyền cấu hình xuống Shared khi bootstrap. Shared không import App,
không biết khóa lưu token, endpoint hay nghiệp vụ Auth.

Contract phải có nguồn/phiên bản. Khi spec khác implementation, ghi rõ khoảng lệch;
không tự đổi contract trong refactor cấu trúc.
Baseline tương thích: email/password, token/user, register và /auth/me,
/tickets/me với page/pageSize, create gửi title/description/categoryId,
ticket mới Submitted, roles Requester/Agent/Admin, numeric TicketStatus giữ nguyên.
Không tự thêm Lead, Draft/Submit hai bước, đổi tên trường hoặc If-Match chưa xác nhận.
Nếu có OpenAPI được duyệt, ghim nguồn và kiểm tra codegen/drift trong CI.
Không gọi types viết tay là generated contract.

## 9. DTO và frontend model

DTO là wire data; model là representation frontend. Chỉ mapper khi có khác biệt
thực tế về naming, cấu trúc, nullability hoặc representation. Mapping tại API boundary,
không trong JSX; không mapper sao chép DTO, không fake defaults cho trường không có.
TypeScript không thay runtime validation; không assertion để giả định payload hợp lệ.

## 10. SOLID trong React

- SRP: tách HTTP, remote state, validation, presentation, page composition.
- OCP: gom metadata/config khi có biến thể; giữ conditional đơn giản nếu phù hợp.
- LSP: mock/fake giữ semantic contract về lỗi, quyền, phân trang và side effects.
- ISP: API/hook/props nhỏ theo use case; không ServiceDeskService bao trùm.
- DIP: UI dùng hooks/hợp đồng feature, không Axios/HTTP implementation.

Hook không tự tạo dependency inversion. Chỉ interface/injection khi có nhu cầu
test, thay implementation hoặc boundary hạ tầng cụ thể.

## 11. Routing, navigation và permissions

Router/layout/navigation thuộc App; route và menu dùng cùng nguồn metadata/quyền.
Giữ URL trừ khi có yêu cầu sản phẩm. Guard phân biệt restoring, unavailable,
anonymous, forbidden. Unknown role không tự có quyền; multi-role hợp quyền đã khai báo.
Permission hiển thị là pure helper trong model, không lặp checks khắp JSX.
Ẩn nút không là security boundary; backend luôn kiểm tra quyền thực sự.
Baseline UI: ticket cá nhân cho cả ba role; workspace cho Agent/Admin; quản trị cho Admin.
Không suy luận team/ownership từ dữ liệu chưa đủ.

## 12. Error handling và session

Chuẩn hóa unknown error thành AppError; UI không phụ thuộc AxiosError.
- 401 session: xử lý tập trung; 401 login: lỗi đăng nhập, không logout chung.
- Response cũ không vô hiệu hóa phiên mới. 403 giữ phiên.
- 404 theo tài nguyên; 409 giữ input, giải thích xung đột, cho tải lại, không tự mutation retry.
- Network/5xx giữ phiên và cho thử lại; cancellation không hiện như lỗi người dùng.

Không nuốt lỗi thành dữ liệu rỗng/thành công. Không lộ stack/token/database trong UI/log.

## 13. Chức năng chưa có backend và AI

Không mock/fake fallback trong production adapter. Mock chỉ ở tests hoặc dev tách biệt.
Capability chưa xác nhận phải giải thích chưa hỗ trợ, khóa thao tác, không HTTP
đến endpoint dự kiến, không lịch sử/kết quả giả.
AI phải human-in-the-loop: suggested/final riêng, revision thực, không hard-code,
khóa khi thiếu revision/stale; callback async có pending/error; không tự áp dụng
thay người dùng; không chặn gửi yêu cầu vì AI không khả dụng.

## 14. TypeScript

Giữ strict, noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch,
noUncheckedIndexedAccess. Dùng unknown và guards ở boundary. Không any, @ts-ignore,
ép kiểu để vượt lỗi; ngoại lệ hẹp phải có lý do. Kiểm tra params thay vì non-null
assertion; phân biệt null/undefined/trường không được hỗ trợ. Dùng import type.
Không nới compiler/lint để build pass.

## 15. Testing architecture

Unit: mapper/metadata/validation/permission; hooks: keys/cancellation/invalidation;
component: hành vi và UI states; feature integration: page/hooks/HTTP mock;
E2E: browser flows. Tests cạnh code bằng *.test.ts(x); contract/architecture trong
tests/; E2E trong e2e/. Mỗi test có QueryClient độc lập. Mock HTTP boundary,
không mock hết hook rồi tuyên bố test flow. Test hành vi/invariant, không implementation.
Không test hình thức cho di chuyển/hiển thị thuần. Browser API-mock không là backend
acceptance. Không sửa snapshot/contract chỉ để test pass.

## 16. Architecture enforcement

Lint/tests kiểm tra sai chiều, deep import, dependency ngoài allowlist, API trong
Page/Component, model phụ thuộc UI/I/O, cycle, production import tests/mock.
Áp dụng cho import, import type, re-export, dynamic import, alias và relative.
Architecture tests phải có positive/negative examples; không chỉ tìm chuỗi import.
Không tắt rule hoặc ngoại lệ rộng để vượt kiến trúc.

## 17. Chống over-engineering và anti-patterns

Không thêm BaseApiService/BasePage/BaseHook, AbstractRepository/RepositoryFactory,
GenericUseCase/Mapper, DI container, global state/validation library, folder rỗng
hoặc wrapper/barrel vô ích khi chưa có use case rõ.
Tránh God Component, effect fetch, duplicate domain knowledge, Shared thành sọt rác,
import sai boundary, mock production, fake success, revision/identity/permission
hard-code, Axios/database errors trong UI, mutation retry không an toàn,
refactor làm thay đổi nghiệp vụ/API ngoài yêu cầu.

## 18. Workflow bắt buộc cho coding agent

### Trước khi sửa
1. Đọc AGENTS và chỉ dẫn liên quan; kiểm tra git status, bảo toàn thay đổi người dùng.
2. Đọc UI → API, types, tests và nguồn contract.
3. Xác định ownership, public API và permissions bị ảnh hưởng.
4. Với thay đổi đáng kể, nêu kế hoạch/tiêu chí kiểm chứng.
5. Ghi rõ contract gap, giữ baseline, tiếp tục việc không phụ thuộc quyết định thiếu.

### Trong khi sửa
1. Thay theo responsibility và dependency một chiều.
2. Cập nhật callers/types/cache keys/permissions/tests cùng nhau.
3. Không trộn nâng cấp lớn/feature mới vào refactor.
4. Không sửa contract, bỏ test/nới rule để che lỗi; không secrets/PII trong logs/fixtures.

### Sau khi sửa
1. Chạy checks phù hợp; trước bàn giao code chạy lint/typecheck/test/build.
2. Chạy E2E khi đổi routing/auth/user flow.
3. Kiểm tra diff/import cũ/code chết/ngoài phạm vi; cập nhật docs/contract manifest.
4. Báo kết quả, checks chưa chạy và giới hạn. Không tuyên bố pass khi chưa chạy thành công.

## 19. Definition of Done

- Đúng yêu cầu/contract, ownership/dependency/public API đúng, không callers cũ.
- Page/component responsibility rõ; remote state/cancellation/cache phù hợp.
- Đủ loading/error/empty/unsupported states và permissions/menu/route nhất quán.
- Không mock production, dữ liệu giả hoặc che lỗi; tests phù hợp hành vi/lỗi đã sửa.
- Lint/typecheck/test/build pass; E2E liên quan pass; CI đầy đủ trước merge.
- Docs cập nhật, không thay đổi ngoài phạm vi.

Nếu môi trường chặn check bắt buộc, báo bằng chứng/giới hạn; không coi phần chưa
kiểm chứng là đã nghiệm thu.
