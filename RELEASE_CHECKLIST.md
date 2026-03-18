# BandSheet Release Checklist

## Goal
Simple, repeatable release flow with clear verification points and rollback triggers.

## 1. Pre-Release
- [ ] Pull latest `main` and ensure clean working tree.
- [ ] Run `npm ci`.
- [ ] Run `npm run test:ci` as the source-of-truth quality gate.
- [ ] Validate local quality gates:
  - [ ] `npm run lint`
  - [ ] `npm run test`
  - [ ] `npm run smoke:i18n`
  - [ ] `npm run smoke:invite`
  - [ ] `npm run audit:i18n`
  - [ ] `npm run build`
- [ ] Confirm report has no missing i18n values (`missingEnCount`, `missingRuCount`, `missingUkCount` are `0`).
- [ ] Verify required environment variables exist for target environment.

## 2. Database and Migrations
- [ ] Confirm migration plan and order.
- [ ] Apply pending migrations.
- [ ] Verify key schema updates for i18n were applied (including relaxed key format constraint).
- [ ] Run post-migration smoke checks for critical tables and RLS-sensitive paths.

## 3. Admin Safety Checks
- [ ] Verify admin account can access admin panel.
- [ ] Verify device confirmation flow works.
- [ ] Verify destructive action confirmation field is enforced for hard delete.
- [ ] Verify admin audit records are written after sensitive actions.

## 4. User Flow Smoke Checks
- [ ] Login and logout flow works.
- [ ] Dashboard, groups, events, library, profile pages open without errors.
- [ ] Group creation works and remains idempotent.
- [ ] Invitation send/accept/cancel flows work.
- [ ] Runtime i18n switching works for EN/RU/UK.

## 5. Post-Deploy Validation
- [ ] Re-run `npm run audit:i18n` in target environment context if available.
- [ ] Validate no spike in server errors in `logs/server_errors.log`.
- [ ] Validate admin settings save and read-back.
- [ ] Validate API health for `/api/i18n`, `/api/settings`, `/api/profile`.

## 6. Rollback Triggers
Rollback immediately if any of the following happen:
- [ ] Login flow broken for standard users.
- [ ] Admin panel inaccessible for valid admin.
- [ ] Missing runtime translations for EN/RU/UK.
- [ ] Destructive admin actions bypass confirmation.
- [ ] Critical API routes return sustained 5xx errors.

## 7. Rollback Steps
- [ ] Roll back application deployment through Vercel Dashboard -> previous deployment -> Promote.
- [ ] If schema-related issue: apply DB rollback plan or hotfix migration.
- [ ] Re-run smoke checks after rollback.
- [ ] Record incident summary and corrective action items.

## 8. Handoff Notes
- [ ] Link to release PR.
- [ ] Link to migration batch.
- [ ] Link to latest i18n audit report.
- [ ] Link to incident notes (if any).
