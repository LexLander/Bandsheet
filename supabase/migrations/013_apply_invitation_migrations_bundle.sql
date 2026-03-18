-- 013_apply_invitation_migrations_bundle.sql
-- Bundle: apply migrations 010, 011, 012 in order
-- Paste the whole file into Supabase SQL Editor and Run.

-- ============================================================
-- 010_add_invited_user_and_profiles_email.sql
-- ============================================================
begin;

-- 1) Add email to profiles so server-side code can query by email
alter table profiles add column if not exists email text;

-- 2) Backfill profiles.email from auth.users
update profiles
set email = u.email
from auth.users u
where u.id = profiles.id and (profiles.email is null or profiles.email = '');

-- 3) Add invited_user_id to invitations
alter table invitations
  add column if not exists invited_user_id uuid references profiles(id) on delete set null;

-- 4) Backfill invited_user_id for existing invitations where possible
update invitations inv
set invited_user_id = p.id
from profiles p
where inv.invited_user_id is null and lower(inv.email) = lower(p.email);

-- 5) Indexes for case-insensitive email searches
create index if not exists idx_profiles_lower_email on profiles (lower(email));
create index if not exists idx_invitations_lower_email on invitations (lower(email));

-- 6) Unique constraint to prevent duplicate pending invitations per user per group
create unique index if not exists uniq_invitations_group_user on invitations (group_id, invited_user_id) where invited_user_id is not null;

commit;

-- ============================================================
-- 011_accept_invitation_rpc_and_policies.sql
-- ============================================================
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
returns table(group_id uuid) language plpgsql security definer as $$
begin
  -- Find pending invitation by token
  perform 1 from invitations where token = p_token and status = 'pending' and (expires_at is null or expires_at > now());
  if not found then
    raise exception 'Invitation not found or expired';
  end if;

  -- Lock the invitation row to avoid races
  lock table invitations in row exclusive mode;

  -- Get invitation details
  declare
    inv record;
  begin
    select * into inv from invitations where token = p_token for update;
  end;

  if inv.status <> 'pending' then
    raise exception 'Invitation is not pending';
  end if;

  -- If invited_user_id is set and doesn't match p_user_id, forbid
  if inv.invited_user_id is not null and inv.invited_user_id <> p_user_id then
    raise exception 'Invitation is not for this user';
  end if;

  -- Insert member (ignore conflict if already member)
  begin
    insert into group_members (group_id, user_id, role)
    values (inv.group_id, p_user_id, inv.role)
    on conflict (group_id, user_id) do nothing;
  exception when others then
    -- propagate
    raise;
  end;

  -- Update invitation status and invited_user_id/accepted_at
  update invitations
    set status = 'accepted', invited_user_id = p_user_id, accepted_at = now()
    where id = inv.id;

  return query select inv.group_id;
end;
$$;

commit;

-- ============================================================
-- 012_invitations_update_policy_for_invited_user.sql
-- ============================================================
begin;

-- Drop existing update policy if exists
-- and create policy: allow invited user to set status = 'expired' for their pending invitation

drop policy if exists "Invited user can expire their invitation" on invitations;

create policy "Invited user can expire their invitation"
  on invitations for update
  to authenticated
  using (invited_user_id = auth.uid() and status = 'pending')
  with check (invited_user_id = auth.uid() and status = 'expired');

commit;

-- ============================================================
-- End of bundle
-- After running, verify with checks (run each in SQL Editor):
-- 1) Check columns:
-- select column_name from information_schema.columns where table_name = 'invitations' and column_name in ('invited_user_id','accepted_at');
-- 2) Check function:
-- select n.nspname as schema, p.proname, pg_get_functiondef(p.oid) as definition from pg_proc p join pg_namespace n on p.pronamespace = n.oid where p.proname = 'accept_invitation';
-- 3) Check policies:
-- select * from pg_policies where tablename = 'invitations';

