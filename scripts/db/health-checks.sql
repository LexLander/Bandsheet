-- Run these diagnostics in Supabase SQL Editor (or psql) to detect common data issues.

-- 1) Duplicate groups per leader and normalized name.
select
  leader_id,
  lower(trim(name)) as normalized_name,
  count(*) as duplicate_count,
  array_agg(id order by created_at asc) as group_ids
from groups
where coalesce(is_deleted, false) = false
group by leader_id, lower(trim(name))
having count(*) > 1;

-- 2) Invitations referencing missing users or groups.
select i.id, i.group_id, i.invited_user_id, i.email
from invitations i
left join groups g on g.id = i.group_id
left join profiles p on p.id = i.invited_user_id
where g.id is null
   or (i.invited_user_id is not null and p.id is null);

-- 3) Orphan group memberships.
select gm.group_id, gm.user_id, gm.role
from group_members gm
left join groups g on g.id = gm.group_id
left join profiles p on p.id = gm.user_id
where g.id is null or p.id is null;

-- 4) Groups without an active leader membership.
select g.id, g.name, g.leader_id
from groups g
left join group_members gm
  on gm.group_id = g.id
 and gm.user_id = g.leader_id
 and gm.role = 'leader'
where gm.group_id is null
  and coalesce(g.is_deleted, false) = false;

-- 5) i18n values whose variable or language does not exist.
select v.id, v.variable_id, v.language_code
from i18n_values v
left join i18n_variables vars on vars.id = v.variable_id
left join i18n_languages langs on langs.code = v.language_code
where vars.id is null or langs.code is null;
