-- 010_add_invited_user_and_profiles_email.sql
-- Add invited_user_id to invitations and store email on profiles for lookups

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
