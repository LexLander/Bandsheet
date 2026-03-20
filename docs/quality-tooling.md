# Quality Tooling

This project uses a layered quality workflow.

## 1) Fast and full check profiles

- `npm run check:fast`
  - Runs lint, TypeScript type-check, and unit/component tests.
  - Use during normal development.

- `npm run check:full`
  - Runs lint, type-check, tests, smoke suites, i18n audit, coverage, and build.
  - Use before large merges and release candidates.

## 2) Coverage gate

- `npm run test:coverage`
- Thresholds are configured in `vitest.config.ts` and enforced globally.
- Goal: prevent silent coverage regression while allowing gradual improvement.

## 3) Bundle analysis

- `npm run build:analyze`
- Generates Next.js bundle analyzer output (`ANALYZE=true`).
- Use to identify heavy client bundles and optimize imports/lazy-loading.

## 4) Playwright smoke tests

- Install browser once locally:
  - `npx playwright install chromium`
- Run smoke tests:
  - `npm run test:e2e:ci`
- Config: `playwright.config.ts`
- Tests: `tests/e2e/smoke.spec.ts`

## 5) CI quality gates

- Workflow: `.github/workflows/ci.yml`
- Jobs:
  - `quality`: runs `npm run test:ci` (currently mapped to `check:full`).
  - `e2e-smoke`: runs Playwright smoke in CI.

## 6) SQL health checks

- File: `scripts/db/health-checks.sql`
- Contains diagnostics for common integrity issues:
  - duplicate groups,
  - orphan invitations/memberships,
  - groups without leader membership,
  - i18n value reference issues.

## 7) External tools (manual / local)

These are useful, but not fully automated in-repo:

- React DevTools Profiler
  - Measure expensive renders before adding memoization.

- why-did-you-render (development only)
  - Detect unnecessary React re-renders.

- PR assistant (Danger or similar)
  - Optional GitHub-level policy bot for risky changes and missing tests.
