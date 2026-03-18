-- 021_i18n_source_text_and_language_controls.sql
-- Evolve runtime i18n to an English source-of-truth model.

begin;

alter table public.i18n_languages add column if not exists native_name text;
alter table public.i18n_languages add column if not exists is_default boolean not null default false;
alter table public.i18n_languages add column if not exists is_system boolean not null default false;
alter table public.i18n_languages add column if not exists sort_order integer not null default 100;
alter table public.i18n_languages add column if not exists updated_at timestamptz not null default now();

update public.i18n_languages
set native_name = coalesce(native_name, name);

update public.i18n_languages
set name = 'English',
    native_name = 'English',
    is_default = true,
    is_system = true,
    is_enabled = true,
    is_deleted = false,
    sort_order = 0
where code = 'en';

update public.i18n_languages
set sort_order = 10,
    native_name = coalesce(native_name, 'Українська')
where code = 'uk';

update public.i18n_languages
set sort_order = 20,
    native_name = coalesce(native_name, 'Русский')
where code = 'ru';

create unique index if not exists uniq_i18n_default_language
  on public.i18n_languages (is_default)
  where is_default = true and is_deleted = false;

alter table public.i18n_variables add column if not exists namespace text;
alter table public.i18n_variables add column if not exists source_language_code text not null default 'en';
alter table public.i18n_variables add column if not exists source_text text not null default '';
alter table public.i18n_variables add column if not exists updated_at timestamptz not null default now();

update public.i18n_variables
set namespace = split_part(var_key, '.', 1)
where namespace is null or namespace = '';

update public.i18n_variables var
set source_text = coalesce(
  (
    select v.value
    from public.i18n_values v
    where v.variable_id = var.id
      and v.language_code = 'en'
      and v.is_deleted = false
    order by v.updated_at desc nulls last
    limit 1
  ),
  nullif(var.source_text, ''),
  var.var_key
)
where coalesce(var.source_text, '') = '';

alter table public.i18n_variables alter column namespace set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'i18n_variables_source_lang_fk'
  ) then
    alter table public.i18n_variables
      add constraint i18n_variables_source_lang_fk
      foreign key (source_language_code)
      references public.i18n_languages(code)
      on delete restrict;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'i18n_variables_source_lang_is_en'
  ) then
    alter table public.i18n_variables
      add constraint i18n_variables_source_lang_is_en
      check (source_language_code = 'en');
  end if;
end $$;

alter table public.i18n_values add column if not exists status text not null default 'published';
alter table public.i18n_values add column if not exists provider text;
alter table public.i18n_values add column if not exists updated_by uuid references public.profiles(id) on delete set null;

update public.i18n_values
set status = 'published'
where status is null or status = '';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'i18n_values_status_valid'
  ) then
    alter table public.i18n_values
      add constraint i18n_values_status_valid
      check (status in ('draft', 'published', 'needs_review'));
  end if;
end $$;

create index if not exists idx_i18n_languages_sort
  on public.i18n_languages(is_default desc, sort_order asc, code asc)
  where is_deleted = false;

create index if not exists idx_i18n_values_lang_status
  on public.i18n_values(language_code, status)
  where is_deleted = false and is_enabled = true;

create or replace function public.touch_i18n_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_i18n_language_updated_at on public.i18n_languages;
create trigger trg_touch_i18n_language_updated_at
before update on public.i18n_languages
for each row execute function public.touch_i18n_updated_at();

drop trigger if exists trg_touch_i18n_variable_updated_at on public.i18n_variables;
create trigger trg_touch_i18n_variable_updated_at
before update on public.i18n_variables
for each row execute function public.touch_i18n_updated_at();

drop trigger if exists trg_touch_i18n_value_updated_at on public.i18n_values;
create trigger trg_touch_i18n_value_updated_at
before update on public.i18n_values
for each row execute function public.touch_i18n_updated_at();

create or replace function public.guard_core_i18n_language()
returns trigger
language plpgsql
as $$
begin
  if old.code = 'en' then
    if tg_op = 'DELETE' then
      raise exception 'Default English language cannot be deleted';
    end if;

    if new.code <> 'en' then
      raise exception 'Default English language code cannot be changed';
    end if;

    if coalesce(new.is_enabled, true) = false then
      raise exception 'Default English language cannot be disabled';
    end if;

    if coalesce(new.is_deleted, false) = true then
      raise exception 'Default English language cannot be marked deleted';
    end if;

    if coalesce(new.is_default, false) = false then
      raise exception 'Default English language must remain default';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_guard_core_i18n_language on public.i18n_languages;
create trigger trg_guard_core_i18n_language
before update or delete on public.i18n_languages
for each row execute function public.guard_core_i18n_language();

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
  using (
    is_enabled = true
    and is_deleted = false
    and status = 'published'
  );

commit;