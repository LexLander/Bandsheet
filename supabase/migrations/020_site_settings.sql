-- 020_site_settings.sql
-- Global site settings editable from admin UI.

begin;

create table if not exists public.site_settings (
  id text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, value)
values
  ('app_name', 'BandSheet'),
  ('app_slogan', 'OPEN. PLAY. SHINE.')
on conflict (id) do update
set value = excluded.value,
    updated_at = now();

create or replace function public.touch_site_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_site_settings_updated_at on public.site_settings;
create trigger trg_touch_site_settings_updated_at
before update on public.site_settings
for each row execute function public.touch_site_settings_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert site settings" on public.site_settings;
create policy "Admins can insert site settings"
  on public.site_settings for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.platform_role = 'admin'
        and coalesce(p.is_blocked, false) = false
        and coalesce(p.is_blacklisted, false) = false
    )
  );

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
  on public.site_settings for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.platform_role = 'admin'
        and coalesce(p.is_blocked, false) = false
        and coalesce(p.is_blacklisted, false) = false
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.platform_role = 'admin'
        and coalesce(p.is_blocked, false) = false
        and coalesce(p.is_blacklisted, false) = false
    )
  );

commit;
