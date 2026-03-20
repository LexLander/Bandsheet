# BandSheet: Refactoring Standards & Code Quality Analysis

**Документ подготовлен:** 20.03.2026  
**Версия проекта:** main (commit 9d80d35)  
**Размер базы кода:** 76.7K строк TypeScript/TSX, 99 тестов

---

## 📋 Executive Summary

Проект **BandSheet** находится в хорошем состоянии с точки зрения архитектуры и тестирования, но имеет потенциал для улучшения кода через **стандартизацию стилей, документации и рефакторинга компонентов**.

**Ключевые выводы:**
- ✅ **Сильные стороны:** Хорошая архитектура, типизация, тестовое покрытие, CI/CD
- ⚠️ **Точки улучшения:** Стили компонентов (инлайн → Tailwind), документация, архитектура компонентов
- 🔄 **Предложения:** ESLint правила, Storybook/документация, рефакторинг набора компонентов

---

## 🎯 ТЕКУЩЕЕ СОСТОЯНИЕ

### 1. Архитектура и структура

#### ✅ Что работает хорошо
- **Layered Architecture:**
  - Разделение на `lib/db/*` (DAO layer), `lib/i18n/*` (i18n layer), `app/*/actions.ts` (server actions)
  - `app/(auth)`, `app/(app)`, `app/admin` - четкие route groups
- **Type Safety:**
  - TypeScript strict mode включен
  - Полная типизация Supabase queries
  - Хорошие типы для domain объектов (`GroupPreview`, `UpcomingEvent` и т.д.)
- **Server/Client Separation:**
  - Server actions в `app/*/actions.ts`
  - Client components четко обозначены (`'use client'`)
  - Middleware для защиты маршрутов

#### ⚠️ Текущие проблемы
| Проблема | Пример | Изм. |
|----------|--------|------|
| **Inline styles в компонентах** | `style={{ maxWidth: 680, ... }}` в GroupsListClient | HIGH |
| **Отсутствие соглашения об импортах** | Смешанные пути (`@/lib`, `../utils`, абсолютные) | MEDIUM |
| **Magic strings в DB queries** | `eq('groups.is_deleted', false)` без констант | MEDIUM |
| **Отсутствие компонентного фреймворка** | Нет Storybook, документации компонентов | LOW |
| **Дублирование validation логики** | `sanitizeEmail` повторяется в разных действиях | MEDIUM |

---

### 2. Code Style & Formatting

#### Текущая конфигурация
```json
{
  "eslint": "v9 + next/core-web-vitals + next/typescript",
  "typescript": "strict mode, ES2017 target",
  "prettier": "не используется",
  "tailwind": "v4 (используется для CSS)"
}
```

#### ✅ Что хорошо
- ESLint проходит без ошибок
- TypeScript strict mode включен
- Нет `any` типов в приложении
- Комментарии объясняют сложные части кода

#### ⚠️ Проблемы
1. **Нет Prettier** - нет единого форматирования кода
2. **Inline styles вместо Tailwind** - GroupsListClient использует `style={{...}}`
3. **Нет соглашения об импортах** - порядок и группировка несогласованны
4. **Отсутствуют правила для:**
   - max-depth, max-lines для функций
   - cyclomatic complexity
   - naming conventions для компонентов

---

### 3. Testing & Coverage

#### ✅ Текущее состояние
- **Test framework:** Vitest (подходит для Next.js)
- **Coverage:** 21 тестовых файла, 99 тестов (все passing)
- **Специализированные smoke-тесты:** i18n, invite, library
- **Integration тесты:** DB, API, actions

```
✓ auth/actions (15 tests) — server actions validation
✓ auth/login.query-state (4 tests) — query parser
✓ auth/register.query-state (4 tests) — duplicate email notice
✓ admin/* (22 tests) — admin actions
✓ api/* (12 tests) — API routes
✓ i18n/* (10 tests) — translation runtime
```

#### ⚠️ Пробелы
- **No E2E тесты** (Playwright/Cypress) — нет браузерного уровня
- **Component tests** отсутствуют — нет @testing-library/react
- **Coverage report** не используется регулярно
- **Mock тесты** полагаются на vi.mock() вместо testdouble/jest

---

### 4. Documentation

#### ✅ Что документировано
- `README.md` — feature list, project structure, getting started
- `HANDOFF.md` — текущее состояние, ключевые entry points, next steps
- Code comments в сложных местах (например, в lib/db/groups.ts)

#### ⚠️ Пробелы
- **Нет API документации** (Swagger/OpenAPI)
- **Нет Storybook** для компонентов
- **Нет ADR (Architecture Decision Records)**
- **Нет contributing guidelines**
- **Нет code style guide** (conventions.md)

---

## 🔧 РЕКОМЕНДУЕМЫЕ СТАНДАРТЫ

### УРОВЕНЬ 1: Essential (Обязательные)

#### 1.1 ESLint Enhanced Configuration
```javascript
// eslint.config.mjs
const eslintConfig = defineConfig([
  ...compat.config({
    extends: [
      "next/core-web-vitals",
      "next/typescript",
      "eslint:recommended",
    ],
  }),
  {
    rules: {
      // Complexity
      "complexity": ["warn", 10],
      "max-depth": ["warn", 3],
      "max-lines": ["warn", { max: 300, skipComments: true, skipBlankLines: true }],
      
      // Naming
      "no-unused-vars": "off", // TS handles this
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE"],
        },
        {
          selector: "function",
          format: ["camelCase"],
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
      ],
      
      // Imports
      "sort-imports": ["warn", {
        ignoreCase: true,
        ignoreDeclarationSort: true,
      }],
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          alphabeticalOrder: true,
        },
      ],
    },
  },
]);
```

#### 1.2 Prettier Configuration
```json
//.prettierrc.json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5",
  "arrowParens": "always",
  "jsxSingleQuote": false
}
```

#### 1.3 Tailwind-First Components
**Правило:** Все компоненты используют Tailwind классы, НЕ inline styles

**Было:**
```tsx
<div style={{ maxWidth: 680, margin: '0 auto' }}>
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
```

**Должно быть:**
```tsx
<div className="w-full max-w-[680px] mx-auto">
  <div className="flex flex-col gap-2.5">
```

---

### УРОВЕНЬ 2: Quality (Высокое качество)

#### 2.1 TypeScript Standards

**Config updates (tsconfig.json):**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Соглашения:**
- ✅ Все публичные функции должны иметь return type
- ✅ Все параметры должны быть типизированы
- ✅ Избегать `unknown` типов, использовать specific types
- ✅ Использовать `as const` для literal types

**Пример:**
```typescript
// ❌ BAD
export function fetchUser(id) {
  return supabase.from('users').select().eq('id', id)
}

// ✅ GOOD
export async function fetchUser(id: string): Promise<User | null> {
  const { data } = await supabase.from('users').select().eq('id', id).single()
  return data ?? null
}
```

#### 2.2 Import Conventions
```typescript
// 1. Node/external imports
import type { ReactNode } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { SupabaseClient } from '@supabase/supabase-js'

// 2. Internal imports (lib)
import { fetchUser } from '@/lib/db/users'
import { useLanguage } from '@/components/i18n/LanguageProvider'

// 3. Type imports separated
import type { User, UserRole } from '@/types'

// 4. Relative for same-directory
import { helper } from './helper'
```

#### 2.3 Constants & Magic Strings
**Правило:** Все magic strings должны быть константами

```typescript
// ❌ BAD - в разных файлах
.eq('groups.is_deleted', false)
.eq('status', 'active')

// ✅ GOOD - в constants.ts
const DB_FILTERS = {
  GROUP_NOT_DELETED: { column: 'groups.is_deleted', value: false },
  EVENT_ACTIVE: { column: 'status', value: 'active' },
  USER_ADMIN: { column: 'platform_role', value: 'admin' },
} as const

// Использование
.eq(DB_FILTERS.GROUP_NOT_DELETED.column, DB_FILTERS.GROUP_NOT_DELETED.value)
```

#### 2.4 Validation & Sanitization Extraction
**Правило:** Избегать дублирования validation логики

```typescript
// lib/validation/common.ts
export const validators = {
  sanitizeEmail: (value: FormDataEntryValue | null): string => {
    return typeof value === 'string' ? value.trim().toLowerCase() : ''
  },
  sanitizeText: (value: FormDataEntryValue | null): string => {
    return typeof value === 'string' ? value.trim() : ''
  },
  validateEmail: (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  validatePassword: (pwd: string): { valid: boolean; reason?: string } => {
    if (pwd.length < 6) return { valid: false, reason: 'minLength' }
    // ...
    return { valid: true }
  },
} as const
```

---

### УРОВЕНЬ 3: Excellence (Передовые практики)

#### 3.1 Component Architecture
```typescript
// lib/components/common/Card/Card.tsx - Atomic Design
'use client'

import { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils/cn'

interface CardProps extends PropsWithChildren {
  title?: string
  className?: string
  onClick?: () => void
}

/**
 * Basic Card component
 * 
 * @example
 * <Card title="Users" onClick={() => handleClick()}>
 *   Content here
 * </Card>
 */
export function Card({ title, className, onClick, children }: CardProps) {
  return (
    <div 
      className={cn(
        'bg-white dark:bg-white/5',
        'border border-black/10 dark:border-white/10',
        'rounded-2xl p-6',
        'transition-colors',
        className
      )}
      onClick={onClick}
    >
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      {children}
    </div>
  )
}
```

#### 3.2 Error Handling Strategy
```typescript
// lib/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public userMessage?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// app/(auth)/actions.ts
export async function login(formData: FormData): Promise<LoginResult> {
  try {
    // ...validation
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.userMessage ?? error.message }
    }
    throw error
  }
}
```

#### 3.3 Testing Standards
```typescript
// tests/app/auth/login.test.ts
describe('login', () => {
  describe('validation', () => {
    it('should reject empty email', async () => {
      // Arrange
      const formData = new FormData()
      formData.set('email', '')
      formData.set('password', 'password123')
      
      // Act
      const result = await login(formData)
      
      // Assert
      expect(result).toHaveProperty('error')
      expect(result.error).toContain('email')
    })
  })
})
```

---

## 🚀 ПЛАН РЕАЛИЗАЦИИ

### Phase 1: Setup (1-2 недели)
1. [ ] Добавить Prettier (конфиг + pre-commit hook)
2. [ ] Обновить ESLint конфиг с новыми правилами
3. [ ] Форматировать весь существующий код (`prettier --write .`)
4. [ ] Создать `lib/validation/common.ts` с валидаторами
5. [ ] Создать `CONTRIBUTING.md` guide

**Commits:** `feat: add prettier`, `style: format codebase`

### Phase 2: Refactoring Components (2-3 недели)
1. [ ] Аудит всех компонентов на inline styles
2. [ ] Рефакторить 10 ключевых компонентов (GroupsListClient, etc.)
3. [ ] Создать `lib/components/ui/*` для переиспользуемых atoms
4. [ ] Добавить @testing-library/react тесты для компонентов

**Commits:** `refactor: migrate GroupsListClient to Tailwind`, ...

### Phase 3: Testing & Documentation (1-2 недели)
1. [ ] Добавить Storybook для UI компонентов
2. [ ] Написать API документацию (Swagger/OpenAPI)
3. [ ] Создать ADR для ключевых решений
4. [ ] Добавить E2E тесты (Playwright)

**Commits:** `docs: add storybook setup`, `test: add E2E tests`

### Phase 4: CI/CD Enhancement (1 неделя)
1. [ ] Добавить `prettier --check` в CI
2. [ ] Добавить `eslint --max-warnings 0` в CI
3. [ ] Добавить coverage thresholds в vitest
4. [ ] Обновить CI workflow (.github/workflows/ci.yml)

---

## ✅ CHECKLIST ЛУЧШИХ ПРАКТИК

### Pre-Commit
- [ ] Prettier форматирование
- [ ] ESLint без ошибок
- [ ] TypeScript strict check (`npx tsc --noEmit`)
- [ ] Tests passing
- [ ] No console.log/debugger

### PR Review
- [ ] Есть типы для всех параметров
- [ ] Нет inline styles
- [ ] Использованы Tailwind классы
- [ ] Есть документирующие комментарии для public API
- [ ] Тесты покрывают позитивные + негативные сценарии

### Naming Conventions
```
Файлы:
- Components: PascalCase (Card.tsx, GroupsList.tsx)
- Utils: camelCase (validator.ts, helper.ts)
- Types: PascalCase (User.ts, Group.ts)
- Tests: kebab-case (user.test.ts)

Переменные:
- Constants: UPPER_SNAKE_CASE (MAX_RETRIES)
- Functions: camelCase (fetchUser)
- React components: PascalCase (Button)
- React hooks: camelCase starting with 'use' (useUser)
```

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

### Рекомендуемые инструменты
1. **Prettier** — Code formatting
2. **husky** + **lint-staged** — Pre-commit hooks
3. **Storybook** — Component documentation
4. **TypeDoc** — Auto-generated API docs
5. **@testing-library/react** — Component testing

### Конфиг примеры
- `.prettierrc.json` — Prettier config
- `.eslintignore` — ESLint ignore rules
- `.husky/pre-commit` — Git hook
- `vitest.config.ts` — Updated test config

---

## 🎓 ПРИНЦИПЫ ПРОЕКТА

### Core Principles
1. **Type Safety First** — Полная типизация, strict mode
2. **Security by Default** — Валидация на сервере, RLS в БД
3. **Testability** — Функции без side-effects, clear interfaces
4. **Performance** — Lazy loading, memoization, code splitting
5. **Accessibility** — WCAG compliance, semantic HTML
6. **Maintainability** — Clear structure, good documentation

---

## 📊 МЕТРИКИ УСПЕХА

| Метрика | Текущее | Целевое | Timeline |
|---------|---------|---------|----------|
| ESLint errors | 0 | 0 | Continuous |
| TypeScript strict | ✓ | ✓ | Continuous |
| Test coverage | ~50% | 75%+ | 4 недели |
| Code duplicity | ~15% | < 5% | 3 недели |
| Component docs | 0% | 100% | 2 недели |
| E2E tests | 0 | 10+ | 3 недели |

---

**Дата создания:** 20.03.2026  
**Версия:** 1.0  
**Статус:** Ready for Discussion
