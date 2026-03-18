# DevOps/Docs Pass — Clean Change List

Дата: 2026-03-18

Этот файл фиксирует только изменения последнего DevOps/док-прохода
и намеренно исключает исторические/параллельные изменения рабочего дерева.

## Scope (only these files)

- `.github/workflows/ci.yml`
- `.github/POLICY.md`
- `README.md`
- `HANDOFF.md`
- `RELEASE_CHECKLIST.md`

## What changed

1. CI workflow hardened (`.github/workflows/ci.yml`)
- Trigger policy: `push`/`pull_request` only for `main`.
- Added `permissions: contents: read`.
- Added `concurrency` with `cancel-in-progress`.
- Added job timeout (`15` min).
- Node setup pinned to `20` with npm cache.
- Added `.next/cache` restore/save.
- CI runs `npm run test:ci` when present and safely falls back to `lint && test && build` otherwise.
- Jobs aligned to explicit names: `quality` and `deploy-note`.
- Added Vercel deploy-note message in workflow output.

2. Operational policy added (`.github/POLICY.md`)
- Branch protection rules.
- Merge policy with commit naming guidance.
- PR quality requirements.
- CI gate definition.
- Release/rollback expectations.
- Secrets handling policy.
- GitHub Secrets setup instructions.
- Incident handling section.

3. README aligned to DevOps flow (`README.md`)
- Added real CI badge for `lyshn19/Bandsheet`.
- Synced command list with current pipeline (`smoke:invite`, `test:ci`).
- Added reference to `.github/POLICY.md` in Contributing section.
- Fixed local setup instructions to avoid referencing missing `.env.local.example`.

4. Handoff synchronized (`HANDOFF.md`)
- Added CI workflow and policy references as current state.
- Marked `npm run test:ci` as the validation source of truth.
- Replaced outdated badge follow-up with ongoing sync note.

5. Release checklist synchronized (`RELEASE_CHECKLIST.md`)
- Explicitly marks `npm run test:ci` as the source-of-truth gate.
- Explicitly includes `smoke:invite` in quality gates.
- Keeps rollback triggers/steps aligned with current CI, Vercel rollback flow, and admin-safety checks.

## Validation snapshot

- `npm run lint` passed.
- `npm run test:ci` passed.

## Note about CI badge

`origin` configured: `https://github.com/lyshn19/Bandsheet.git`

README now uses the real badge URL:
`https://github.com/lyshn19/Bandsheet/actions/workflows/ci.yml/badge.svg`
