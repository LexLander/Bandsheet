-- 023_plans.sql
-- Stage 3: tariff tables + safe dedupe + constraints + seed

begin;

create extension if not exists pgcrypto;

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  is_free boolean not null default false,
  price_monthly numeric(10,2),
  price_yearly numeric(10,2),
  first_month_price numeric(10,2),
  trial_days integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_limits (
  plan_id uuid not null references public.plans(id) on delete cascade,
  key text not null,
  value integer not null,
  primary key (plan_id, key)
);

create table if not exists public.plan_features (
  plan_id uuid not null references public.plans(id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default false,
  primary key (plan_id, feature_key)
);

alter table public.plans enable row level security;
alter table public.plan_limits enable row level security;
alter table public.plan_features enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'plans'
      and policyname = 'plans_select_authenticated'
  ) then
    create policy plans_select_authenticated
      on public.plans for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'plans'
      and policyname = 'plans_insert_service_role'
  ) then
    create policy plans_insert_service_role
      on public.plans for insert
      to service_role
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'plans'
      and policyname = 'plans_update_service_role'
  ) then
    create policy plans_update_service_role
      on public.plans for update
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'plans'
      and policyname = 'plans_delete_service_role'
  ) then
    create policy plans_delete_service_role
      on public.plans for delete
      to service_role
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'plan_limits'
      and policyname = 'plan_limits_select_authenticated'
  ) then
    create policy plan_limits_select_authenticated
      on public.plan_limits for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'plan_limits'
      and policyname = 'plan_limits_insert_service_role'
  ) then
    create policy plan_limits_insert_service_role
      on public.plan_limits for insert
      to service_role
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'plan_limits'
      and policyname = 'plan_limits_update_service_role'
  ) then
    create policy plan_limits_update_service_role
      on public.plan_limits for update
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'plan_limits'
      and policyname = 'plan_limits_delete_service_role'
  ) then
    create policy plan_limits_delete_service_role
      on public.plan_limits for delete
      to service_role
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'plan_features'
      and policyname = 'plan_features_select_authenticated'
  ) then
    create policy plan_features_select_authenticated
      on public.plan_features for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'plan_features'
      and policyname = 'plan_features_insert_service_role'
  ) then
    create policy plan_features_insert_service_role
      on public.plan_features for insert
      to service_role
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'plan_features'
      and policyname = 'plan_features_update_service_role'
  ) then
    create policy plan_features_update_service_role
      on public.plan_features for update
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'plan_features'
      and policyname = 'plan_features_delete_service_role'
  ) then
    create policy plan_features_delete_service_role
      on public.plan_features for delete
      to service_role
      using (true);
  end if;
end
$$;

-- Safe dedupe block
lock table public.plans in share row exclusive mode;

update public.plans
set name = btrim(name)
where name <> btrim(name);

drop table if exists tmp_plan_map;
create temporary table tmp_plan_map (
  old_id uuid primary key,
  new_id uuid not null
) on commit drop;

with ranked as (
  select
    id,
    name,
    lower(btrim(name)) as name_norm,
    created_at,
    sort_order,
    row_number() over (
      partition by lower(btrim(name))
      order by created_at asc nulls last, sort_order asc, id asc
    ) as rn
  from public.plans
), keepers as (
  select name_norm, id as keeper_id
  from ranked
  where rn = 1
), dups as (
  select r.id as old_id, k.keeper_id as new_id
  from ranked r
  join keepers k using (name_norm)
  where r.rn > 1
)
insert into tmp_plan_map (old_id, new_id)
select old_id, new_id
from dups;

do $$
declare r record;
begin
  for r in
    select table_schema, table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'plan_id'
      and table_name <> 'plans'
  loop
    execute format(
      'update %I.%I t
       set plan_id = m.new_id
       from tmp_plan_map m
       where t.plan_id = m.old_id',
      r.table_schema, r.table_name
    );
  end loop;
end
$$;

delete from public.plans p
using tmp_plan_map m
where p.id = m.old_id;

with free_ranked as (
  select
    id,
    row_number() over (
      order by sort_order asc, created_at asc nulls last, id asc
    ) as rn
  from public.plans
  where is_free = true
), free_dups as (
  select id as old_id
  from free_ranked
  where rn > 1
), free_keeper as (
  select id as keeper_id
  from free_ranked
  where rn = 1
)
insert into tmp_plan_map (old_id, new_id)
select d.old_id, k.keeper_id
from free_dups d
cross join free_keeper k
on conflict (old_id) do update
set new_id = excluded.new_id;

do $$
declare r record;
begin
  for r in
    select table_schema, table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'plan_id'
      and table_name <> 'plans'
  loop
    execute format(
      'update %I.%I t
       set plan_id = m.new_id
       from tmp_plan_map m
       where t.plan_id = m.old_id',
      r.table_schema, r.table_name
    );
  end loop;
end
$$;

delete from public.plans p
using tmp_plan_map m
where p.id = m.old_id;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'plans_name_unique'
      and conrelid = 'public.plans'::regclass
  ) then
    alter table public.plans
      add constraint plans_name_unique unique (name);
  end if;
end
$$;

create unique index if not exists plans_single_free_plan
  on public.plans (is_free)
  where is_free = true;

insert into public.plans (
  name,
  description,
  is_active,
  is_free,
  price_monthly,
  price_yearly,
  first_month_price,
  trial_days,
  sort_order
)
values
  ('Старт', 'Базовий безкоштовний план', true, true, 0.00, null, null, 0, 1),
  ('Просунутий', 'Розширений тариф для команд', true, false, 500.00, 5000.00, null, 0, 2),
  ('Про', 'Повний безлімітний тариф', true, false, 1000.00, 11000.00, null, 0, 3)
on conflict (name) do update
set
  description = excluded.description,
  is_active = excluded.is_active,
  is_free = excluded.is_free,
  price_monthly = excluded.price_monthly,
  price_yearly = excluded.price_yearly,
  first_month_price = excluded.first_month_price,
  trial_days = excluded.trial_days,
  sort_order = excluded.sort_order;

with limits_seed (plan_name, key, value) as (
  values
    ('Старт', 'max_library_songs', 30),
    ('Старт', 'max_groups', 1),
    ('Старт', 'max_group_members', 8),
    ('Старт', 'max_events_per_month', 4),
    ('Старт', 'max_setlist_songs', 15),

    ('Просунутий', 'max_library_songs', 300),
    ('Просунутий', 'max_groups', 3),
    ('Просунутий', 'max_group_members', 30),
    ('Просунутий', 'max_events_per_month', -1),
    ('Просунутий', 'max_setlist_songs', -1),

    ('Про', 'max_library_songs', -1),
    ('Про', 'max_groups', -1),
    ('Про', 'max_group_members', -1),
    ('Про', 'max_events_per_month', -1),
    ('Про', 'max_setlist_songs', -1)
)
insert into public.plan_limits (plan_id, key, value)
select p.id, s.key, s.value
from limits_seed s
join public.plans p on p.name = s.plan_name
on conflict (plan_id, key) do update
set value = excluded.value;

with features_seed (plan_name, feature_key, enabled) as (
  values
    ('Старт', 'import_url', false),
    ('Старт', 'chord_palette', false),
    ('Старт', 'song_editor_deputy', false),

    ('Просунутий', 'import_url', true),
    ('Просунутий', 'chord_palette', false),
    ('Просунутий', 'song_editor_deputy', false),

    ('Про', 'import_url', true),
    ('Про', 'chord_palette', true),
    ('Про', 'song_editor_deputy', true)
)
insert into public.plan_features (plan_id, feature_key, enabled)
select p.id, s.feature_key, s.enabled
from features_seed s
join public.plans p on p.name = s.plan_name
on conflict (plan_id, feature_key) do update
set enabled = excluded.enabled;

commit;
