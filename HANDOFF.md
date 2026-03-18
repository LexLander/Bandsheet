# BandSheet — Handoff

## 1. Проект
- BandSheet: веб-приложение для управления группами, событиями и сетлистами.
- Стек: Next.js 15 (App Router), TypeScript, Supabase (Auth, Postgres, RLS), Tailwind.
- Рабочая директория: /Users/alex/Desktop/MyProjects/SetListSong.

## 2. Текущее состояние

### Готово и работает
- Аутентификация и базовые пользовательские потоки: login, register, reset-password, profile.
- Защищенные разделы приложения: dashboard, groups, events, library.
- Публичный acceptance flow инвайтов: /invite/[token] (accept/decline + возврат через login next).
- Админ-контур: users, languages, settings, verify-device.
- Runtime i18n через БД с EN/RU/UK и API-слоем.
- Защита критичных admin-действий через серверные подтверждения (hard delete, blacklist, remove admin).
- Release-checklist и i18n audit-поток добавлены.
- CI workflow: .github/workflows/ci.yml (main PR/push, test:ci, deploy notice для Vercel).
- DevOps policy: .github/POLICY.md.

## 3. Ключевые входные точки
- Серверный Supabase: lib/supabase/server.ts.
- Админ server actions: app/admin/actions/.
- I18n runtime и каталог: lib/i18n/ и app/api/i18n/route.ts.
- Настройки сайта: lib/db/settings.ts и app/api/settings/route.ts.
- Группы и membership-логика: app/(app)/groups/ и lib/db/groups.ts.
- Миграции БД: supabase/migrations/.

## 4. Качество и валидация
- Базовые проверки:
  - npm run test:ci
  - npm run lint
  - npx vitest run
  - npm run smoke:i18n
  - npm run smoke:invite
  - npm run audit:i18n
  - npm run build
- Source of truth для локальной и CI-валидации: npm run test:ci.
- Текущий статус на момент обновления handoff: lint, тесты и production build проходят.

## 5. База данных и миграции
- Миграций: 22 файла (001-022).
- Для i18n критична миграция 022 (ослабление формата var_key под camelCase/PascalCase).
- Перед релизом обязательно проверять порядок и факт применения миграций в целевом окружении.

## 6. Операционный порядок релиза
- Использовать единый чек-лист: RELEASE_CHECKLIST.md.
- Ключевые пункты:
  - quality gates (lint/test/smoke/audit/build)
  - post-migration smoke
  - admin safety checks
  - rollback triggers и rollback steps

## 7. Приоритеты next steps
1. Добавить e2e тест браузерного уровня для /invite/[token] (UI + redirect цепочки).
2. Держать README badge синхронизированным с origin через scripts/update-ci-badge-from-origin.sh.
3. Держать этот файл как единственный источник актуального состояния (без дублирующих исторических блоков).

## 8. Быстрый запуск локально
1. Установить зависимости: npm install.
2. Настроить .env.local (Supabase URL/keys и остальные секреты).
3. Запустить dev: npm run dev.
