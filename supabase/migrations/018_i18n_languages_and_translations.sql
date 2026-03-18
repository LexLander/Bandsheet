-- 018_i18n_languages_and_translations.sql
-- Dynamic i18n management for admin panel:
-- languages, translation variables, and per-language values.

begin;

create table if not exists public.i18n_languages (
  code text primary key,
  name text not null,
  is_enabled boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  constraint i18n_languages_code_format check (code ~ '^[a-z]{2,12}(-[a-z0-9]{2,12})?$')
);

create table if not exists public.i18n_variables (
  id uuid primary key default uuid_generate_v4(),
  var_key text not null unique,
  description text,
  is_enabled boolean not null default true,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  constraint i18n_variables_key_format check (var_key ~ '^[a-z0-9]+(\.[a-z0-9_]+)+$')
);

create table if not exists public.i18n_values (
  id uuid primary key default uuid_generate_v4(),
  variable_id uuid not null references public.i18n_variables(id) on delete cascade,
  language_code text not null references public.i18n_languages(code) on delete cascade,
  value text not null default '',
  is_enabled boolean not null default true,
  is_deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (variable_id, language_code)
);

create index if not exists idx_i18n_languages_enabled on public.i18n_languages(is_enabled) where is_deleted = false;
create index if not exists idx_i18n_variables_enabled on public.i18n_variables(is_enabled) where is_deleted = false;
create index if not exists idx_i18n_values_variable_lang on public.i18n_values(variable_id, language_code) where is_deleted = false;

-- Keep timestamp fresh when value changes.
create or replace function public.touch_i18n_value_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_i18n_value_updated_at on public.i18n_values;
create trigger trg_touch_i18n_value_updated_at
before update on public.i18n_values
for each row execute function public.touch_i18n_value_updated_at();

alter table public.i18n_languages enable row level security;
alter table public.i18n_variables enable row level security;
alter table public.i18n_values enable row level security;

commit;
