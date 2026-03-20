# Refactoring Implementation Roadmap

**Версия:** 1.0  
**Дата:** 20.03.2026  
**Статус:** Ready for Planning

---

## 📅 Timeline Overview

```
Week 1: Foundation & Quick Wins
├── Setup tooling (Prettier, ESLint updates)
├── Create lib/validation/* layer
├── Create CONTRIBUTING.md Guide
└── Fix imports & constants

Week 2: Component Refactoring (Phase 1)
├── Refactor 5 key components to Tailwind
├── Create lib/components/ui/* atoms
├── Setup @testing-library/react
└── Add component unit tests

Week 3: Quality Gates
├── Add vitest coverage tracking
├── Update CI/CD workflow
├── Setup Storybook foundations
└── Documentation sprint

Week 4+: Nice-to-Have & Optimization
├── Full Storybook stories
├── E2E tests with Playwright
├── OpenAPI documentation
└── Performance optimization

```

---

## 🎯 Week 1: Foundation (5 days)

### 📋 Checklist

#### Day 1: Tooling Setup
- [ ] **Install Prettier**
  ```bash
  npm install -D prettier
  echo '{"semi": true, "singleQuote": true, "printWidth": 100}' > .prettierrc.json
  echo 'node_modules/\n.next/\ncoverage/\n' > .prettierignore
  npm run prettier -- --write .
  ```
  **Time:** 30 min  
  **Files:** `.prettierrc.json`, `.prettierignore`, package.json  
  **Review PR:** `feat: add prettier and format codebase`

- [ ] **Update ESLint config**
  ```javascript
  // eslint.config.mjs - add these rules
  {
    rules: {
      'complexity': ['warn', 10],
      'max-depth': ['warn', 3],
      'max-lines': ['warn', { max: 300, skipComments: true }],
      '@typescript-eslint/naming-convention': ['warn', {...}],
    },
  }
  ```
  **Time:** 20 min  
  **Review PR:** `feat: enhance eslint rules`

- [ ] **Setup husky pre-commit**
  ```bash
  npm install -D husky lint-staged
  npx husky install
  npx husky add .husky/pre-commit 'npx lint-staged'
  echo '{"*.{ts,tsx}": ["prettier --write", "eslint --fix"]}' > .lintstagedrc.json
  ```
  **Time:** 30 min  
  **Review PR:** `chore: add husky pre-commit hooks`

#### Day 2: Validation Layer
- [ ] **Create lib/validation/types.ts**
  ```typescript
  export type ValidationResult = 
    | { valid: true; value: string }
    | { valid: false; reason: string; userMessage: string }
  ```
  **Time:** 15 min

- [ ] **Create lib/validation/email.ts**
  - `sanitize()` - trim, lowercase
  - `validate()` - regex check
  - Coverage: 100%
  **Time:** 45 min

- [ ] **Create lib/validation/password.ts**
  - `sanitize()`, `validate()`, `confirmMatch()`
  - Coverage: 100%
  **Time:** 30 min

- [ ] **Create lib/validation/common.ts**
  - `sanitizeText()`, `sanitizeNextPath()`, `sanitizeName()`
  **Time:** 30 min

- [ ] **Create tests/lib/validation/**.test.ts** — 20+ test cases
  **Time:** 1 hour

**PR:** `refactor: extract validation layer`

#### Day 3: Constants & Database
- [ ] **Create lib/db/schema.ts**
  ```typescript
  export const DB = {
    TABLES: { /* ... */ },
    COLUMNS: { /* ... */ },
    STATUS: { /* ... */ },
    ROLES: { /* ... */ },
  }
  ```
  **Time:** 1 hour

- [ ] **Refactor lib/db/groups.ts** to use constants
  **Time:** 30 min

- [ ] **Create tests/lib/db/schema.test.ts** — verify constants exist
  **Time:** 20 min

**PR:** `refactor: centralize database schema`

#### Day 4-5: Documentation & Conventions
- [ ] **Create CONTRIBUTING.md**
  - Setup instructions
  - Code style guide
  - Commit message conventions
  - PR review checklist
  **Time:** 1.5 hours

- [ ] **Update README.md** with badges
  - [![ESLint](https://img.shields.io/badge/ESLint-Configured-brightgreen)]()
  - [![Tests](https://img.shields.io/badge/Tests-99%20passing-brightgreen)]()
  - [![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)]()

- [ ] **Create docs/CODE_STYLE.md**
  - Naming conventions
  - File organization
  - Import order
  - Comment standards

**PR:** `docs: add contributing guide and code style standards`

---

## 🎨 Week 2: Components & Testing (5 days)

### Overview
Переход с inline styles на Tailwind для ключевых компонентов + добавление unit тестов.

#### Day 1-2: Component Audit & Planning
- [ ] **Audit all components** for inline styles
  ```bash
  grep -r "style={{" app --include="*.tsx" | wc -l
  # Expected: ~30-50 occurrences
  ```
  **Output:** List in `COMPONENT_REFACTOR_LOG.md`

- [ ] **Create design system**
  ```
  lib/components/ui/
  ├── Button.tsx (+ test + story)
  ├── Card.tsx (+ test + story)
  ├── Checkbox.tsx (+ test + story)
  ├── Modal.tsx (+ test)
  ├── Input.tsx (+ test)
  ├── Select.tsx (+ test)
  └── Badge.tsx (+ test)
  ```

- [ ] **Setup @testing-library/react**
  ```bash
  npm install -D @testing-library/react @testing-library/jest-dom
  ```

#### Day 3-4: Refactor 5 Components
**Priority list (by usage & complexity):**

1. **GroupsListClient.tsx** ← 150 lines, many inline styles
   - Remove inline styles → Tailwind classes
   - Extract CheckboxItem component
   - Create useGroupSelection hook
   - Add 3+ unit tests
   **Time:** 2 hours

2. **InviteForm.tsx** ← Form with validation
   - Migrate to reusable Input component
   - Use new validators
   **Time:** 1.5 hours

3. **AdminUserActions.tsx** ← Admin controls
   - Extract to Button + Badge components
   **Time:** 1 hour

4. **LibrarySearchClient.tsx** ← Search input
   - Add React.memo + debounce
   - Migrate to Input component
   **Time:** 1 hour

5. **SidebarMenu.tsx** ← Layout component
   - Optimize rendering
   **Time:** 1 hour

**Review PRs individually:**
- `refactor(ui): migrate GroupsListClient to Tailwind`
- `refactor(ui): migrate InviteForm to Tailwind`
- etc.

#### Day 5: Component Tests
- [ ] **Add @testing-library/react tests** for all refactored components
  - Render test
  - User interaction test
  - Props validation test
  - Accessibility test (aria-labels)
  **Time:** 2 hours

**PR:** `test: add component unit tests`

---

## 🧪 Week 3: Quality Gates & CI/CD (5 days)

#### Day 1-2: Vitest Coverage
- [ ] **Setup coverage tracking**
  ```bash
  npm run test:coverage
  # Should show ~50-60% baseline
  ```

- [ ] **Create coverage.yml in .github/workflows/**
  ```yaml
  - name: Report coverage
    run: npm run test:coverage
    
  - name: Upload to Codecov
    uses: codecov/codecov-action@v4
  ```

- [ ] **Set coverage thresholds**
  ```javascript
  // vitest.config.ts
  coverage: {
    lines: 50,    // Week 3 target
    functions: 50,
    branches: 40,
    statements: 50,
  }
  ```

#### Day 3: Update CI/CD Workflow
- [ ] **Update .github/workflows/ci.yml**
  ```yaml
  - name: Format check
    run: npm run prettier -- --check .
    
  - name: Lint check
    run: npm run lint -- --max-warnings 0
    
  - name: Type check
    run: npx tsc --noEmit
    
  - name: Test with coverage
    run: npm run test:coverage
    
  - name: Build check
    run: npm run build
  ```

#### Day 4-5: Storybook Setup
- [ ] **Install & setup Storybook**
  ```bash
  npx storybook@latest init --type next
  ```

- [ ] **Create stories for UI components**
  ```
  lib/components/ui/Button.stories.tsx
  lib/components/ui/Card.stories.tsx
  lib/components/ui/Input.stories.tsx
  lib/components/ui/Checkbox.stories.tsx
  ```

- [ ] **Deploy Storybook** (optional)
  ```bash
  # Deploy to Chromatic or Vercel
  ```

**PR:** `chore: add storybook and update CI/CD`

---

## 🔄 Week 4+: Nice-to-Have Features

### E2E Tests (Playwright)
```bash
npm install -D @playwright/test

# tests/e2e/auth.spec.ts
test('login flow', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
```

### API Documentation (OpenAPI)
```typescript
// lib/api/openapi.ts
const spec = {
  openapi: '3.0.0',
  info: { title: 'BandSheet API', version: '1.0.0' },
  paths: {
    '/api/groups': {
      get: {
        summary: 'Get user groups',
        responses: {
          '200': { description: 'List of groups' },
        },
      },
    },
  },
}

export async function GET() {
  return Response.json(spec)
}
```

### Performance Optimization
- Add next/image lazy loading
- Code splitting with React.lazy()
- Memoization of expensive components
- Bundle analysis with `npm install -D @next/bundle-analyzer`

---

## 📊 Success Metrics

### By End of Week 1
- ✅ Prettier + ESLint passing
- ✅ 100% of validation logic extracted to lib/validation
- ✅ Database constants centralized
- ✅ CONTRIBUTING.md created

### By End of Week 2
- ✅ 5 key components refactored to Tailwind
- ✅ Design system atoms ready
- ✅ Component tests written (>80% coverage for refactored components)
- ✅ New developers can setup in 5 minutes

### By End of Week 3
- ✅ Code coverage 50%+ (was ~30%)
- ✅ CI/CD enhanced with format + lint checks
- ✅ Storybook live and documented

### By End of Month
- ✅ Code coverage 75%+
- ✅ 20+ E2E tests
- ✅ OpenAPI docs available
- ✅ No technical debt issues

---

## 🎓 Training & Handoff

### For New Developers
1. Read `CONTRIBUTING.md` (5 min)
2. Read `docs/CODE_STYLE.md` (10 min)
3. Run Storybook locally: `npm run storybook` (5 min)
4. Run tests: `npm run test:watch` (observe 100 tests)
5. Make a small PR: refactor one component (1-2 hours)

### For Current Team
1. **Kickoff meeting:** Review REFACTORING_STANDARDS.md (30 min)
2. **Week 1 standup:** Establish norms (30 min)
3. **Code review training:** Review first 3 PRs carefully (1 hour)
4. **Weekly retrospective:** What's working, what's not (30 min)

---

## 🚨 Risk Mitigation

| Risk | Mitigation | Effort |
|------|-----------|--------|
| Regression bugs | Comprehensive tests before refactor | HIGH |
| Merge conflicts | Work on different components | MEDIUM |
| Performance drop | Profile before/after | MEDIUM |
| Over-engineering | Stick to timeline, not perfection | LOW |

---

## 📝 Deliverables Checklist

- [ ] REFACTORING_STANDARDS.md ✅
- [ ] QUALITY_ISSUES_MATRIX.md ✅
- [ ] REFACTORING_EXAMPLES.md ✅
- [ ] IMPLEMENTATION_ROADMAP.md (this file) ✅
- [ ] .prettierrc.json (to create)
- [ ] lib/validation/* (to create)
- [ ] lib/components/ui/* (to create)
- [ ] CONTRIBUTING.md (to create)
- [ ] docs/CODE_STYLE.md (to create)
- [ ] .storybook/main.ts (to create)

---

## ✅ Decision Points for Discussion

1. **Prettier + Husky?** YES / NO
   - Recommendation: YES (prevents formatting drift)

2. **@testing-library/react?** YES / NO
   - Recommendation: YES (industry standard)

3. **Storybook now or later?** NOW / LATER / NO
   - Recommendation: LATER (Phase 3, after components stable)

4. **E2E tests priority?** HIGH / MEDIUM / LOW
   - Recommendation: MEDIUM (after unit tests covered)

5. **Coverage threshold?** 50% / 60% / 75%
   - Recommendation: Start 50%, increase to 75% over 4 weeks

---

**Автор:** Copilot Code Review  
**Status:** Ready for Discussion & Planning  
**Next Steps:** Schedule kickoff meeting
