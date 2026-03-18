# BandSheet

**OPEN. PLAY. SHINE.**

[![CI](https://github.com/lyshn19/Bandsheet/actions/workflows/ci.yml/badge.svg)](https://github.com/lyshn19/Bandsheet/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![Status](https://img.shields.io/badge/Статус-MVP%20в%20розробці-yellow)]()

PWA-застосунок для музикантів і команд: управління сет-листами, подіями та групами.

---

## Key Features

- **Сет-листи та події** — створення та керування програмою виступів
- **Групи** — командна робота, запрошення учасників
- **Мультимовність** — uk / ru / en та будь-яка мова через адмін-панель
- **AI переклад** — автоматичний переклад інтерфейсу через Anthropic або OpenAI
- **Адмін-панель** — керування користувачами, мовами, налаштуваннями
- **Maintenance mode** — технічне обслуговування без доступу для звичайних користувачів
- **PWA** — встановлюється на мобільний пристрій як нативний застосунок

---

## Project Structure

```
app/
├── (auth)/        — публічні сторінки (login, register, forgot-password)
├── (app)/         — захищені сторінки користувача
│   ├── dashboard/
│   ├── groups/
│   ├── library/   (в розробці)
│   ├── events/    (в розробці)
│   └── profile/
├── admin/         — адмін-панель (platform_role = admin)
│   ├── users/
│   ├── languages/ — мови, переклади, AI-генерація
│   ├── settings/  — налаштування сайту
│   └── logs/
├── api/           — API endpoints
└── maintenance/   — сторінка технічного обслуговування

components/        — UI-компоненти
lib/
├── db/            — DAO-функції (доступ до БД)
├── i18n/          — локалізація, runtime-переклади
└── supabase/      — клієнти Supabase (server / browser / admin)
supabase/
└── migrations/    — SQL-міграції
```

---

## Getting Started

**Вимоги:** Node.js 20+, npm 10+, Supabase-проект (або локальний через Supabase CLI)

```bash
# 1. Клонувати репозиторій
git clone <repo-url>
cd Bandsheet

# 2. Встановити залежності
npm install

# 3. Налаштувати змінні оточення
touch .env.local
# заповнити значення вручну (див. таблицю нижче)

# 4. Застосувати міграції БД
supabase db push
# або вручну через Supabase Dashboard → SQL Editor

# 5. Запустити локально
npm run dev
```

Застосунок буде доступний на [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Змінна | Обов'язкова | Опис |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL Supabase-проекту |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Публічний anon-ключ Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role ключ (тільки на сервері) |
| `ADMIN_2FA_CODE` | ✅ | Код підтвердження для входу адміна |

> AI-провайдер і ключ зберігаються в БД (`site_settings`) і керуються через адмін-панель.

---

## Commands

```bash
npm run dev          # запуск локального сервера
npm run build        # production-білд
npm run lint         # перевірка коду
npm run test         # unit-тести (Vitest)
npm run smoke:i18n   # smoke-тест i18n маршруту
npm run smoke:invite # smoke-тест invite acceptance flow
npm run audit:i18n   # аудит повноти i18n у БД
npm run test:ci      # повна CI-перевірка (lint + test + smoke + audit + coverage + build)
```

---

## User Roles

| Роль | Доступ |
|---|---|
| `user` | `/app/*` — особистий кабінет |
| `admin` | `/admin/*` + усе вище |
| `root_admin` | повний доступ, системні операції |

---

## Contributing

1. Нові запити до БД — додавати в `lib/db/*`, а не інлайн у компонентах.
2. Кожен новий текст інтерфейсу — через i18n-ключ (source_text завжди англійською).
3. Перед PR: `npm run test:ci`.
4. Дотримуватися DevOps policy: `.github/POLICY.md`.
5. Перед релізом використовувати `RELEASE_CHECKLIST.md`.
