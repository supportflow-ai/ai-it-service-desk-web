# Frontend GHCR Artifact Traceability — Round 3

Tài liệu ghi nhận kết quả xuất bản và đối soát hiện vật GHCR của Frontend trong Round 3.

## 1. Thông tin nhánh và Commit

- Baseline branch: `dev` (`fe42831726acc789c1d8eabe151ee3fd73597533`)
- Round 2 branch: `devops/cicd-github-actions` (`fb59a8e04c8fa104daed4886cf3b8eb6fc807477`)
- Round 3 corrective branch: `devops/cicd-round3-frontend`
- Pull Request Round 2: [PR #7](https://github.com/supportflow-ai/ai-it-service-desk-web/pull/7) (Base: `dev`, Head: `devops/cicd-github-actions`)

## 2. Kết quả kiểm thử và Workflow Run

- Workflow Run: [Run 41115261596](https://github.com/supportflow-ai/ai-it-service-desk-web/actions/runs/41115261596)
- Job `frontend`: Success (Lint, typecheck, build, Vitest, Playwright e2e, Docker build).
- Job `Publish GHCR image`: ID `124283788861` (Success).
- Artifact ID: `13007976923` (`web-ghcr-digest-fb59a8e04c8fa104daed4886cf3b8eb6fc807477`).

## 3. Hiện vật GHCR đã xuất bản thành công

- Image: `ghcr.io/supportflow-ai/servicedesk-web`
- Tag: `sha-fb59a8e04c8fa104daed4886cf3b8eb6fc807477`
- Build Commit SHA: `fb59a8e04c8fa104daed4886cf3b8eb6fc807477`
- SHA256 Digest: `sha256:3d787fe41b27c55c54ae2b1bb35c0cc127ec0ee40996790a47d66ce411caedc7`
- Trạng thái xuất bản: `published`
