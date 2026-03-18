-- 019_i18n_runtime_read_policies.sql
-- Runtime read access for enabled i18n data.

begin;

insert into public.i18n_languages (code, name, is_enabled, is_deleted)
values
  ('uk', 'Українська', true, false),
  ('ru', 'Русский', true, false),
  ('en', 'English', true, false)
on conflict (code) do nothing;

drop policy if exists "Public can read enabled i18n languages" on public.i18n_languages;
create policy "Public can read enabled i18n languages"
  on public.i18n_languages for select
  to anon, authenticated
  using (is_enabled = true and is_deleted = false);

drop policy if exists "Public can read enabled i18n variables" on public.i18n_variables;
create policy "Public can read enabled i18n variables"
  on public.i18n_variables for select
  to anon, authenticated
  using (is_enabled = true and is_deleted = false);

drop policy if exists "Public can read enabled i18n values" on public.i18n_values;
create policy "Public can read enabled i18n values"
  on public.i18n_values for select
  to anon, authenticated
  using (is_enabled = true and is_deleted = false);

commit;
