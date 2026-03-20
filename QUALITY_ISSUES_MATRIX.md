# Code Quality Issues Matrix

**Проект:** BandSheet  
**Дата анализа:** 20.03.2026  
**Размер:** 76.7K LOC

## 📊 Issues by Severity & Domain

### STYLING & COMPONENTS (13 компонентов с проблемами)

| Файл | Проблема | Severity | Type | Fix Effort |
|------|----------|----------|------|-----------|
| `app/(app)/groups/GroupsListClient.tsx` | Inline styles вместо Tailwind; 150+ строк | 🔴 HIGH | Style | 2-3 часа |
| `app/(app)/groups/[id]/InviteForm.tsx` | Inline styles, no type export | 🔴 HIGH | Style | 1-2 часа |
| `components/admin/AdminUserActions.tsx` | Magic string colors, inline event handlers | 🟠 MEDIUM | Style | 1 час |
| `app/(app)/library/LibrarySearchClient.tsx` | No React.memo, re-renders | 🟠 MEDIUM | Perf | 30 мин |
| `components/layout/SidebarMenu.tsx` | Conditional rendering not optimized | 🟠 MEDIUM | Perf | 45 мин |
| `app/(auth)/login/page.tsx` | Complex state management | 🟠 MEDIUM | Arch | 1.5 часа |
| `components/ui/ConfirmActionButton.tsx` | No loading state prop | 🟠 MEDIUM | Feature | 30 мин |

**Действие:** 
1. Создать `lib/components/ui/*` с переиспользуемыми компонентами
2. Провести цех "Refactor to Tailwind" (2-3 дня)
3. Добавить Storybook stories для каждого компонента

---

### VALIDATION & SANITIZATION (Дублирование)

| Функция | Где это есть | Severity | Notes |
|---------|-------------|----------|-------|
| `sanitizeEmail()` | `app/(auth)/actions.ts`, потенциально еще | 🟠 MEDIUM | Нужно в lib/validation |
| `sanitizeRequiredText()` | `app/(auth)/actions.ts` | 🟠 MEDIUM | Нужно в lib/validation |
| `sanitizeNextPath()` | `app/(auth)/actions.ts`, `app/auth/confirm/route.ts` | 🟠 MEDIUM | Нужно в lib/validation |
| Email validation regex | Не централизовано | 🟠 MEDIUM | Нужна lib/validation/email.ts |
| Password validation | embedded in actions | 🟠 MEDIUM | Нужна lib/validation/password.ts |

**Действие:**
```
1. Создать lib/validation/
   ├── common.ts (sanitizers)
   ├── email.ts (email validation)
   ├── password.ts (password rules)
   └── types.ts (ValidationResult type)
2. Refactor all actions to use lib/validation
3. Add unit tests for validators
4. Update ESLint to warn on magic regex
```

---

### DATABASE QUERIES (Magic Strings)

| Query | Severity | Example | Solution |
|-------|----------|---------|----------|
| Column names hardcoded | 🟠 MEDIUM | `.eq('groups.is_deleted', false)` | Constants file |
| Filter values as literals | 🟠 MEDIUM | `.eq('status', 'active')` | Enum or const |
| Sorting field strings | 🟠 MEDIUM | `.order('joined_at', ...)` | DB_COLUMNS constant |

**Действие:**
```typescript
// lib/db/constants.ts
export const DB = {
  COLUMNS: {
    GROUPS: { ID: 'id', NAME: 'name', IS_DELETED: 'is_deleted' },
    EVENTS: { ID: 'id', STATUS: 'status', DATE: 'date' },
  },
  FILTERS: {
    GROUP_NOT_DELETED: { column: 'is_deleted', value: false },
    EVENT_ACTIVE: { column: 'status', value: 'active' },
  },
} as const
```

---

### TYPE SAFETY & TypeScript

| Issue | Current | Severity | Example |
|-------|---------|----------|---------|
| Implicit returns | Some functions | 🟠 MEDIUM | `fetchUser()` returns `Promise` but no explicit return type |
| Union types | Used but not documented | 🟠 MEDIUM | `Provider \| null` without explanation |
| Unknown error types | Some try-catch | 🟠 MEDIUM | `catch (error)` without type guard |
| Generic constraints | Not used | 🟡 LOW | `<T extends BaseModel>` patterns |

**Действие:**
```typescript
// Enable in tsconfig.json
{
  "noImplicitAny": true,
  "noImplicitReturns": true,
  "exactOptionalPropertyTypes": true,
  "noUncheckedIndexedAccess": true
}
```

---

### TESTING GAPS

| Category | Current | Gap | Priority |
|----------|---------|-----|----------|
| **Unit Tests** | 99 tests (auth, i18n, db) | ✅ Good | - |
| **Component Tests** | None | React.Testing-Library | 🔴 HIGH |
| **E2E Tests** | None | Playwright tests for flows | 🔴 HIGH |
| **API Tests** | Some smoke tests | Full coverage | 🟠 MEDIUM |
| **Coverage Report** | Not tracked | vitest coverage | 🟠 MEDIUM |

**Действие:**
```bash
# Phase 1: Add component testing
npm install -D @testing-library/react @testing-library/jest-dom

# Phase 2: Add E2E framework
npm install -D @playwright/test

# Phase 3: Coverage tracking
npm run test:coverage -- --coverage.provider=v8
```

---

### DOCUMENTATION GAPS

| Type | Current | Needed | Priority |
|------|---------|--------|----------|
| **API Docs** | README features | OpenAPI/Swagger | 🟠 MEDIUM |
| **Component Docs** | None | Storybook | 🔴 HIGH |
| **Contributing** | None | CONTRIBUTING.md | 🟠 MEDIUM |
| **Architecture** | HANDOFF.md | ADR files | 🟡 LOW |
| **Code Examples** | Some comments | Inline docs | 🟠 MEDIUM |

---

### CODE STYLE INCONSISTENCIES

| Issue | Locations | Severity |
|-------|-----------|----------|
| Import order | All files | 🟠 MEDIUM |
| No Prettier config | All files | 🟠 MEDIUM |
| Inconsistent comment style | Various | 🟡 LOW |
| Magic numbers | Tailwind spacing, timeouts | 🟠 MEDIUM |
| Line length | Some files > 100 chars | 🟡 LOW |

**Solution:** `.prettierrc.json` + `prettier --write .` + husky hook

---

### ERROR HANDLING PATTERNS

| Location | Pattern | Issue | Severity |
|----------|---------|-------|----------|
| `app/(auth)/actions.ts` | Error translation object | Difficult to maintain, duplicates | 🟠 MEDIUM |
| API routes | No consistent error wrapping | Inconsistent response format | 🟠 MEDIUM |
| Catch blocks | Some swallow errors | Silent failures possible | 🔴 HIGH |

**Action:** Create `lib/errors/AppError.ts` class with standard handling

---

## 🎯 Priority Matrix

### Quick Wins (1-2 часа)
- [ ] Добавить Prettier + format codebase
- [ ] Создать `lib/validation/common.ts`
- [ ] Обновить ESLint config
- [ ] Создать CONTRIBUTING.md

### High Impact (1-2 недели)
- [ ] Refactor 3-5 компонентов с inline styles
- [ ] Добавить component tests (@testing-library)
- [ ] Создать lib/db/constants.ts
- [ ] Обновить tsconfig.json с strict checks

### Medium Term (2-4 недели)
- [ ] Storybook setup для UI компонентов
- [ ] E2E тесты (Playwright)
- [ ] API документация (OpenAPI)
- [ ] ADR for major decisions

### Nice to Have (Future)
- [ ] Component version control (Chromatic)
- [ ] Accessibility audit (axe-core)
- [ ] Performance monitoring (WebVitals)
- [ ] Error tracking integration

---

## 📈 Expected Impact

### Before
```
Total issues: ~45
Linting errors: 0 (but low rule coverage)
Test coverage: ~50%
Component documentation: 0%
Code duplication: ~15%
TypeScript strictness: Medium
```

### After 4 Weeks
```
Total issues: ~5
Linting errors: 0 (with comprehensive rules)
Test coverage: 75%+
Component documentation: 100% (Storybook)
Code duplication: < 5%
TypeScript strictness: Maximum
```

---

## 🔗 Related Files

- Main doc: `REFACTORING_STANDARDS.md`
- Implementation guides:
  - `docs/PRETTIER_SETUP.md` (to create)
  - `docs/COMPONENT_STRUCTURE.md` (to create)
  - `docs/TESTING_STRATEGY.md` (to create)

---

**Подготовлено для:** Code Review & Discussion Session  
**Версия:** 1.0
