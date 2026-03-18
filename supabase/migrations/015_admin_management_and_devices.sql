-- 015_admin_management_and_devices.sql
-- Admin capabilities: account state, root-admin flag, trusted devices and audit logs

begin;

alter table public.profiles add column if not exists is_root_admin boolean not null default false;
alter table public.profiles add column if not exists is_blocked boolean not null default false;
alter table public.profiles add column if not exists is_blacklisted boolean not null default false;
alter table public.profiles add column if not exists blocked_reason text;
alter table public.profiles add column if not exists blacklisted_reason text;
alter table public.profiles add column if not exists deleted_at timestamptz;

create table if not exists public.admin_device_registry (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  device_hash text not null,
  device_label text,
  is_trusted boolean not null default false,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (admin_id, device_hash)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.profiles(id) on delete set null,
  target_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_device_registry enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "Admin sees own devices" on public.admin_device_registry;
create policy "Admin sees own devices"
  on public.admin_device_registry for select
  to authenticated
  using (admin_id = auth.uid());

drop policy if exists "Admin inserts own devices" on public.admin_device_registry;
create policy "Admin inserts own devices"
  on public.admin_device_registry for insert
  to authenticated
  with check (admin_id = auth.uid());

drop policy if exists "Admin updates own devices" on public.admin_device_registry;
create policy "Admin updates own devices"
  on public.admin_device_registry for update
  to authenticated
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());

drop policy if exists "Admins can read audit logs" on public.admin_audit_logs;
create policy "Admins can read audit logs"
  on public.admin_audit_logs for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.platform_role = 'admin'
    )
  );

create index if not exists idx_admin_device_registry_admin_id on public.admin_device_registry(admin_id);
create index if not exists idx_admin_audit_logs_created_at on public.admin_audit_logs(created_at desc);

-- Programmatic root admin bootstrap: mark existing profile with name 'Administrator'
-- as root admin. If there are multiple, only the oldest profile is promoted.
with root_candidate as (
  select id
  from public.profiles
  where lower(coalesce(name, '')) = 'administrator'
  order by created_at asc
  limit 1
)
update public.profiles p
set platform_role = 'admin',
    is_root_admin = true
from root_candidate rc
where p.id = rc.id;

commit;
