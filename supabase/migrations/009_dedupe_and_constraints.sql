-- Dedupe duplicate groups and add uniqueness constraint
-- 1) Creates helper RPC (idempotent)
-- 2) Shows diagnostics for duplicates
-- 3) For groups with same (leader_id, name) keeps oldest and merges duplicates:
--    - move group_members (avoid dupes)
--    - move invitations
--    - update any FK columns that reference groups.id
--    - delete duplicate group rows
-- 4) Create unique index on (leader_id, lower(name)) to prevent future duplicates

-- NOTE: Run this as a DB role with privileges to update/delete and create indexes (service role / db owner)

-- 1) Ensure idempotent helper exists (keeps same as migration 008)
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

-- 2) Diagnostics (these SELECTs will show current state when run interactively)
-- Duplicated groups by leader + name
select leader_id, name, count(*) as cnt
from public.groups
group by leader_id, name
having count(*) > 1
order by cnt desc;

-- List duplicates (for review) - keeper is the oldest created_at
with keeper as (
  select leader_id, name, min(created_at) as keep_created_at
  from public.groups
  group by leader_id, name
  having count(*) > 1
), pairs as (
  select k.leader_id, k.name, keeper_g.id as keeper_id, dup_g.id as dup_id, dup_g.created_at
  from keeper k
  join public.groups keeper_g on keeper_g.leader_id = k.leader_id and keeper_g.name = k.name and keeper_g.created_at = k.keep_created_at
  join public.groups dup_g on dup_g.leader_id = k.leader_id and dup_g.name = k.name and dup_g.id <> keeper_g.id
)
select * from pairs order by leader_id, name, created_at;

-- 3) Merge duplicates programmatically
begin;

-- Create a temporary map of dup -> keeper
create temporary table tmp_group_dup_map on commit drop as
select dup_id, keeper_id from (
  select k.leader_id, k.name, keeper_g.id as keeper_id, dup_g.id as dup_id, dup_g.created_at
  from (
    select leader_id, name, min(created_at) as keep_created_at
    from public.groups
    group by leader_id, name
    having count(*) > 1
  ) k
  join public.groups keeper_g on keeper_g.leader_id = k.leader_id and keeper_g.name = k.name and keeper_g.created_at = k.keep_created_at
  join public.groups dup_g on dup_g.leader_id = k.leader_id and dup_g.name = k.name and dup_g.id <> keeper_g.id
) t;

-- For each dup -> keeper, merge group_members, invitations, and update other FK refs
do $$
declare
  rec record;
  ref record;
begin
  for rec in select * from tmp_group_dup_map loop

    -- 3.1 Insert missing members into keeper (avoid duplicates via PK)
    insert into public.group_members (group_id, user_id, role, joined_at)
    select rec.keeper_id, gm.user_id, gm.role, gm.joined_at
    from public.group_members gm
    where gm.group_id = rec.dup_id
    on conflict (group_id, user_id) do nothing;

    -- 3.2 Move invitations (if any)
    update public.invitations set group_id = rec.keeper_id where group_id = rec.dup_id;

    -- 3.3 Dynamically update other FK references pointing to groups(id)
    for ref in
      select kcu.table_schema, kcu.table_name, kcu.column_name
      from information_schema.referential_constraints rc
      join information_schema.key_column_usage kcu on kcu.constraint_name = rc.constraint_name and kcu.constraint_schema = rc.constraint_schema
      join information_schema.key_column_usage pk on pk.constraint_name = rc.unique_constraint_name and pk.constraint_schema = rc.unique_constraint_schema
      where pk.table_name = 'groups' and pk.column_name = 'id'
    loop
      -- skip group_members and invitations since handled above
      if ref.table_name = 'group_members' or ref.table_name = 'invitations' then
        continue;
      end if;
      execute format('update %I.%I set %I = $1 where %I = $2', ref.table_schema, ref.table_name, ref.column_name, ref.column_name)
      using rec.keeper_id, rec.dup_id;
    end loop;

    -- 3.4 Finally delete duplicate group row
    delete from public.groups where id = rec.dup_id;
  end loop;
end$$;

commit;

-- 4) After cleanup, create a unique index to prevent future duplicates
-- Use lower(name) to make uniqueness case-insensitive
create unique index if not exists groups_leader_name_unique on public.groups (leader_id, lower(name));

-- Final diagnostics
select 'remaining duplicates (leader,name,count)' as info, leader_id, name, count(*)
from public.groups
group by leader_id, name
having count(*) > 1;

select 'total groups' as info, count(*) from public.groups;

-- End of script
