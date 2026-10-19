# Frontend refactor verification — 2026-10-19

Baseline before refactor: `e6186246e7d01c4dab699eae121a7fda1a5314df`.
Checks below apply to the local refactor working tree. No remote CI run or live backend
acceptance is claimed.

Final runtime: **Node 22.23.3**, temporarily obtained in the ignored npm cache; the system
runtime and project runtime requirement were not changed. Dependencies resolve successfully
with `npm ls --depth=0`. The lockfile pins Vitest 3.2.7 and keeps the existing application majors.

| Check | Result |
| --- | --- |
| ESLint + resolved-module architecture graph | PASS, no lint warnings/errors |
| Production TypeScript | PASS |
| Test TypeScript | PASS |
| Auth negative type contracts | PASS |
| Vitest | PASS: 66 tests across 9 files |
| Production Vite build | PASS |
| Playwright Chromium against production preview, using Node 22 | PASS: 11 browser smoke tests |
| Dependency resolution | PASS |
| Git whitespace check | PASS |
| Docker image build | BLOCKED by local Docker engine, before build execution |

The final Vitest and browser suites include auth/session recovery, late responses, private cache
partitioning, request cancellation, permissions, pagination, create payloads, unsupported commands,
AI revision/pending/error behavior and positive/negative architecture checks.

Playwright and MSW use synthetic HTTP fixtures derived from the pinned compatibility contract.
They do not validate the latest backend or real database behavior. Unsupported Agent/AI commands
are not sent to a server. No production mock timeline remains.

Build warning: the largest shared UI/application chunk is approximately 873 kB minified
(280 kB gzip). Features use public-entry dynamic imports, but the common Ant Design and
application bundle still exceeds Vite's 500 kB warning threshold. The warning was not suppressed.

Docker was attempted both inside the sandbox and with engine access. The engine returned
`500 Internal Server Error` for `dockerDesktopLinuxEngine/_ping`. The image was not built or
validated. GitHub Actions and Jenkins retain the Docker build gate and now run typecheck,
unit/integration/architecture tests and browser smoke before it.
