-- 016_recreate_accept_invitation_uuid_return.sql
-- Ensure legacy installations use correct function signature and body

begin;

drop function if exists public.accept_invitation(text, uuid);

create function public.accept_invitation(p_token text, p_user_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  inv record;
  v_group_id uuid;
begin
  select * into inv
  from invitations
  where token = p_token
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;

  if inv.status <> 'pending' then
    raise exception 'Invitation is not pending';
  end if;

  if inv.expires_at is not null and inv.expires_at < now() then
    raise exception 'Invitation has expired';
  end if;

  if inv.invited_user_id is not null and inv.invited_user_id <> p_user_id then
    raise exception 'Invitation is not for this user';
  end if;

  v_group_id := inv.group_id;

  insert into group_members (group_id, user_id, role)
  values (v_group_id, p_user_id, inv.role)
  on conflict (group_id, user_id) do nothing;

  update invitations
  set status = 'accepted', invited_user_id = p_user_id, accepted_at = now()
  where id = inv.id;

  return v_group_id;
end;
$$;

commit;
