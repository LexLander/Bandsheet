-- Prevent accidental duplicate groups by allowing an authenticated
-- caller to look up a recently created group by leader + name.
-- This helper runs as SECURITY DEFINER so it bypasses RLS checks.

create or replace function public.find_recent_group_by_leader_name(
  p_leader uuid,
  p_name text,
  p_seconds int default 30
)
returns table(id uuid, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select g.id, g.created_at
  from public.groups g
  where g.leader_id = p_leader
    and g.name = p_name
    and g.created_at > now() - (p_seconds || ' seconds')::interval
  order by g.created_at desc
  limit 1;
$$;

grant execute on function public.find_recent_group_by_leader_name(uuid, text, int) to authenticated;
