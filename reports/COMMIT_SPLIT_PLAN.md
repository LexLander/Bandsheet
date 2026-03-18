# Commit Split Plan

Дата: 2026-03-18

Цель этого файла — безопасно разложить текущее рабочее дерево на логические commit-наборы,
не смешивая DevOps/doc изменения с крупными функциональными и инфраструктурными изменениями.

## Recommended order

### Set 1 — DevOps and docs only
Use this set first if you want a clean infrastructure/documentation commit.

Include:
- `.github/workflows/ci.yml`
- `.github/POLICY.md`
- `README.md`
- `HANDOFF.md`
- `RELEASE_CHECKLIST.md`
- `reports/DEVOPS_DOC_PASS_CHANGES.md`
- `scripts/update-ci-badge-from-origin.sh`

Recommended staging command:

```bash
git add .github/workflows/ci.yml .github/POLICY.md README.md HANDOFF.md RELEASE_CHECKLIST.md reports/DEVOPS_DOC_PASS_CHANGES.md scripts/update-ci-badge-from-origin.sh
```

Recommended commit message:

```bash
git commit -m "chore: harden CI and sync DevOps docs"
```

### Set 2 — Platform/runtime foundation
This set changes framework/runtime and should stay separate from feature work.

Likely files:
- `.gitignore`
- `eslint.config.mjs`
- `next.config.ts`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `types/index.ts`
- `lib/supabase/server.ts`
- `lib/supabase/middleware.ts`
- `lib/supabase/admin.ts`
- `lib/supabase/index.ts`
- `middleware.ts` (delete)
- `proxy.ts`

Recommended review before commit:
- verify no accidental env handling regression
- verify middleware -> proxy migration is intentional
- verify package and config changes belong together

Suggested commit message:

```bash
git commit -m "chore: update app runtime and platform foundation"
```

### Set 3 — Application features and admin/i18n flows
This is the largest product-facing block and should be isolated from DevOps.

Likely files/directories:
- `app/(app)/`
- `app/(auth)/`
- `app/(public)/`
- `app/admin/`
- `app/api/`
- `app/auth/`
- `app/maintenance/`
- `components/`
- `hooks/`
- `lib/admin/`
- `lib/db/`
- `lib/i18n/`
- `lib/logger.ts`
- `tests/`
- `vitest.config.ts`

Suggested commit message:

```bash
git commit -m "feat: add admin, invite, i18n and settings flows"
```

### Set 4 — Database migrations and reports
Keep DB evolution separate so rollback/review is easier.

Likely files/directories:
- `supabase/`
- `reports/` (except `DEVOPS_DOC_PASS_CHANGES.md` if already committed in Set 1)
- `scripts/i18n-bootstrap-audit.ts`

Suggested commit message:

```bash
git commit -m "chore: add database migrations and audit reports"
```

## Files to review manually before any commit

These look like local/editor/agent settings and should not be auto-committed without intent:
- `.claude/settings.json`
- `.vscode/settings.json`

Current recommendation:
- keep them unstaged unless you explicitly want repo-shared editor/agent settings

## Practical safe path

1. Commit Set 1 first.
2. Re-run `npm run test:ci` if you stage anything beyond Set 1.
3. Review Set 2 separately before commit because runtime/config changes affect the whole app.
4. Keep migrations separate from UI/app logic when possible.

## Why this split is safer

- DevOps/doc changes remain reviewable on their own.
- Runtime/config changes do not hide inside feature diffs.
- Product features stay separated from migration risk.
- Rollback and blame become much simpler.

## Current auto-classification (from latest git status)

### Bucket A — Safe to commit now (DevOps/docs)

Files:
- `.github/workflows/ci.yml`
- `.github/POLICY.md`
- `README.md`
- `HANDOFF.md`
- `RELEASE_CHECKLIST.md`
- `reports/DEVOPS_DOC_PASS_CHANGES.md`
- `reports/COMMIT_SPLIT_PLAN.md`
- `scripts/pre-push-check.sh`
- `scripts/update-ci-badge-from-origin.sh`

Stage command:

```bash
git add .github/workflows/ci.yml .github/POLICY.md README.md HANDOFF.md RELEASE_CHECKLIST.md reports/DEVOPS_DOC_PASS_CHANGES.md reports/COMMIT_SPLIT_PLAN.md scripts/pre-push-check.sh scripts/update-ci-badge-from-origin.sh
```

Commit message:

```bash
git commit -m "chore: harden CI and sync DevOps docs"
```

### Bucket B — Separate commit for Sentry integration

Files:
- `.gitignore`
- `next.config.ts`
- `package.json`
- `package-lock.json`
- `app/global-error.tsx`
- `instrumentation.ts`
- `instrumentation-client.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

Stage command:

```bash
git add .gitignore next.config.ts package.json package-lock.json app/global-error.tsx instrumentation.ts instrumentation-client.ts sentry.server.config.ts sentry.edge.config.ts
```

Commit message:

```bash
git commit -m "chore: add sentry integration for nextjs"
```

Important:
- `.env.sentry-build-plugin` must stay untracked.
- Rotate the Sentry auth token if it was shown in terminal output.

### Bucket C — Large application feature block (separate)

Files/directories (high volume):
- `app/(app)/`
- `app/(auth)/`
- `app/(public)/`
- `app/admin/`
- `app/api/`
- `app/auth/`
- `app/maintenance/`
- `components/`
- `hooks/`
- `lib/admin/`
- `lib/db/`
- `lib/i18n/`
- `lib/logger.ts`
- `lib/supabase/admin.ts`
- `lib/supabase/index.ts`
- `proxy.ts`
- `supabase/`
- `tests/`
- `vitest.config.ts`
- plus currently modified tracked files tied to this block:
	- `app/layout.tsx`
	- `app/page.tsx`
	- `eslint.config.mjs`
	- `lib/supabase/middleware.ts`
	- `lib/supabase/server.ts`
	- `middleware.ts` (deleted)
	- `tsconfig.json`
	- `types/index.ts`

### Bucket D — Local/editor settings (usually keep uncommitted)

Files:
- `.claude/settings.json`
- `.vscode/settings.json`

Current status:
- these files are not ignored by `.gitignore`
- keep them unstaged unless you intentionally want repo-shared editor/agent config

Optional ignore rule (only if desired by team):

```gitignore
.claude/
.vscode/
```
