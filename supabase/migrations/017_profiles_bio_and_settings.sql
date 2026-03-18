-- 017_profiles_bio_and_settings.sql
-- Добавляем поле bio и settings к таблице profiles

begin;

alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists settings jsonb;

commit;
