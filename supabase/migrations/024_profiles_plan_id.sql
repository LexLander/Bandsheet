-- 024_profiles_plan_id.sql

begin;

-- Preconditions: migration 023_plans.sql must be applied.
-- public.plans table should already exist.
alter table public.profiles
  add column if not exists plan_id uuid
    references public.plans(id) on delete set null,
  add column if not exists plan_granted_by uuid
    references public.profiles(id) on delete set null,
  add column if not exists plan_expires_at timestamptz,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text;

create index if not exists idx_profiles_plan_id
  on public.profiles(plan_id);

commit;
