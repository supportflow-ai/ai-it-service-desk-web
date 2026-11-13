## 1. Nội dung và lý do thay đổi

<!-- Nêu vấn đề, hành vi sau thay đổi và phạm vi chịu ảnh hưởng (màn hình, feature, hook, API adapter). -->

- Loại thay đổi: [ ] Tính năng  [ ] Sửa lỗi  [ ] Tái cấu trúc  [ ] Bảo trì  [ ] Tài liệu
- Mã công việc hoặc liên kết (nếu có, không bắt buộc):

## 2. Bằng chứng kiểm thử

<!-- Ghi lệnh thực sự đã chạy, kết quả và SHA được kiểm chứng. Không chỉ đánh dấu ô. -->

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e   # khi đổi route, đăng nhập hoặc luồng người dùng
```

- SHA đã kiểm chứng:
- Kết quả, số kiểm thử đạt/thất bại/bỏ qua:
- Kiểm tra không chạy và lý do, nếu có:

## 3. Ảnh hưởng tới kho khác

Đối chiếu [cẩm nang chung](../docs/team-handbook.md#4-thay-đổi-ảnh-hưởng-kho-khác).

- [ ] Không ảnh hưởng kho khác
- [ ] Hợp đồng API backend: đã cập nhật snapshot OpenAPI (`contract:generate`, `contract:check`) hoặc ghi rõ việc đồng bộ chưa làm
- [ ] Hạ tầng (cổng, proxy `/api`, Dockerfile, `VITE_API_BASE_URL`): đã báo kho infra

## 4. Điều kiện hoàn thành

- [ ] CI đạt trên commit mới nhất của PR
- [ ] Có ít nhất một người khác đánh giá; không tự phê duyệt PR của mình
- [ ] Tài liệu liên quan đã cập nhật bằng tiếng Việt, hoặc nêu lý do không cần: 
- [ ] Không có bí mật, token hay dữ liệu thật trong mã, log, fixture
- [ ] Không sửa snapshot, contract, test hay nới lint để làm CI xanh
- [ ] Tương thích hợp đồng API được giữ, hoặc thay đổi đã nêu rõ
