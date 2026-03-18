# BandSheet DevOps Policy

## Purpose
This policy defines minimum operational rules for safe changes, stable releases, and secure secret handling.

## 1. Branch Protection
- `main` is protected.
- Direct pushes to `main` are not allowed.
- Merges require at least 1 approval.
- Required status checks:
  - `quality`

## 2. Merge Policy
- Feature branches should be merged with squash merge.
- Recommended commit prefixes:
  - `feat:`
  - `fix:`
  - `chore:`
  - `docs:`

## 3. Pull Request Rules
- Every production-impacting change must go through PR review.
- PR description must include:
  - scope of change
  - risk assessment
  - rollback note
- Before merge, CI must be green.

## 4. CI Quality Gates
- Source of truth is `npm run test:ci`.
- Current gates include:
  - lint
  - tests
  - smoke:i18n
  - smoke:invite
  - audit:i18n
  - coverage
  - build

## 5. Secrets Policy
- Secrets are stored in GitHub Actions repository secrets only.
- Required secrets:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_2FA_CODE`
- Never commit secrets into source code or documentation examples.
- Never commit `.env.local`.
- AI keys are stored in DB-backed `site_settings`, not in repository env files.

## 6. Release Policy
- Releases to production are from `main` only.
- Use `RELEASE_CHECKLIST.md` for release readiness.
- Use semantic versioning in the form `vMAJOR.MINOR.PATCH`.
- If `CHANGELOG.md` exists, update it after release.
- If `CHANGELOG.md` does not exist, record that as a follow-up instead of auto-creating it during unrelated DevOps work.

## 7. Rollback Policy
- Primary app rollback path: Vercel Dashboard -> previous deployment -> Promote.
- For database incidents use:
  - hotfix migration
  - or backup/restore path approved by the team
- Detailed rollback triggers and steps are maintained in `RELEASE_CHECKLIST.md`.

## 8. GitHub Secrets Setup
GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret

| Secret | Source |
|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard -> Settings -> API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard -> Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard -> Settings -> API |
| `ADMIN_2FA_CODE` | Generate a separate secure code for the admin verify flow |

## 9. Incident Handling
- Any failed production deployment requires:
  - incident record
  - root cause summary
  - corrective action items
