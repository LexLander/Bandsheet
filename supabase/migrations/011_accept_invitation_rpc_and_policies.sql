-- 011_accept_invitation_rpc_and_policies.sql
-- Add accepted_at to invitations, add select policy for invited_user_id and create SECURITY DEFINER function accept_invitation

begin;

-- 1) Add accepted_at column
alter table invitations add column if not exists accepted_at timestamptz;

-- Safety: ensure invited_user_id exists (in case earlier migration wasn't applied)
alter table invitations add column if not exists invited_user_id uuid references profiles(id) on delete set null;

-- 2) Policy: allow invited user to select their invitation
-- This policy complements existing policies for leaders/deputies and token access
drop policy if exists "Invite visible to invited user" on invitations;
create policy "Invite visible to invited user"
  on invitations for select
  to authenticated
  using (invited_user_id = auth.uid());

-- 3) Create SECURITY DEFINER function to accept invitation atomically
create or replace function public.accept_invitation(p_token text, p_user_id uuid)
returns uuid language plpgsql security definer as $$
declare
  inv record;
  v_group_id uuid;
begin
  -- Find and lock the invitation row
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

  -- If invited_user_id is set and doesn't match p_user_id, forbid
  if inv.invited_user_id is not null and inv.invited_user_id <> p_user_id then
    raise exception 'Invitation is not for this user';
  end if;

  v_group_id := inv.group_id;

  -- Insert member (ignore conflict if already member)
  insert into group_members (group_id, user_id, role)
  values (v_group_id, p_user_id, inv.role)
  on conflict (group_id, user_id) do nothing;

  -- Update invitation status and accepted_at
  update invitations
    set status = 'accepted', invited_user_id = p_user_id, accepted_at = now()
    where id = inv.id;

  return v_group_id;
end;
$$;

commit;
