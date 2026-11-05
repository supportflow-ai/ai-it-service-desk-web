# Frontend GHCR Artifact Traceability — Sprint 2 & 3

Tài liệu ghi nhận quy trình xuất bản hiện vật container image GHCR, khóa định danh chuẩn hóa và đối soát tương thích với hệ thống phát hành hạ tầng (`supportflow-ai-infra`).

## 1. Thông tin Cấu hình Xuất bản GHCR

Quy trình CI/CD của Frontend (`.github/workflows/ci.yml`) quản lý việc đóng gói và xuất bản hình ảnh Web SPA lên GitHub Container Registry:

| Thuộc tính | Giá trị chuẩn | Mục đích / Ghi chú |
| :--- | :--- | :--- |
| **Image Name** | `ghcr.io/supportflow-ai/servicedesk-web` | Container image Nginx phục vụ ứng dụng React SPA |
| **Image Tag** | `sha-${{ github.sha }}` | Tag bất biến gắn theo Git commit SHA |
| **Digest Reference** | `ghcr.io/supportflow-ai/servicedesk-web@sha256:...` | Định danh bất biến bằng mã băm SHA-256 |
| **Canonical Key** | `servicedesk-web` | Khóa định danh bắt buộc khớp với `assemble_release.py` |
| **Artifact Output** | `artifacts/servicedesk-web.json` | Tệp JSON bằng chứng xuất bản |

## 2. Chính sách Phát hành An toàn (Publish Security Policy)

Job `publish` được bảo vệ bằng điều kiện:
```yaml
if: github.repository_owner == 'supportflow-ai' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch') && (github.ref == 'refs/heads/dev' || github.ref == 'refs/heads/main')
```
- **Ràng buộc nhánh:** Chỉ xuất bản image khi có sự kiện `push` trực tiếp trên nhánh `dev` (sau khi merge PR) hoặc nhánh `main`, hoặc khi kích hoạt thủ công qua `workflow_dispatch`.
- **Chặn tuyệt đối từ Pull Request & DevOps branches:** Pushes vào `feature/*`, `devops/*` hoặc các sự kiện `pull_request` chỉ chạy kiểm thử (lint, typecheck, build, vitest, playwright) và build kiểm chứng tag `servicedesk-web:ci`, tuyệt đối không đẩy image lên GHCR.
- **Phân quyền:** Quyền `packages: write` chỉ cấp cục bộ cho job `publish`; job `frontend` chỉ có quyền `contents: read`.

## 3. Cấu trúc Tệp Bằng chứng Hiện vật (Artifact JSON)

Tệp JSON được sinh ra tự động tại `artifacts/servicedesk-web.json` với cấu trúc:
```json
{
  "repository": "supportflow-ai/ai-it-service-desk-web",
  "commit": "<FULL_40_HEX_COMMIT_SHA>",
  "images": {
    "servicedesk-web": "ghcr.io/supportflow-ai/servicedesk-web@sha256:<64_HEX_DIGEST>"
  }
}
```
Khóa `"servicedesk-web"` khớp hoàn toàn với bảng ánh xạ `IMAGES` của `supportflow-ai-infra/scripts/assemble_release.py` để trích xuất vào biến môi trường `${WEB_IMAGE}` trong `deploy/compose.release.yml`.
