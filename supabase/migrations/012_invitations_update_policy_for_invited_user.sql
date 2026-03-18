-- 012_invitations_update_policy_for_invited_user.sql
-- Allow invited user to mark their pending invitation as expired (decline)

begin;

-- Drop existing update policy if exists
drop policy if exists "Invited user can expire their invitation" on invitations;

-- Create policy: allow invited user to update their invitation to set status = 'expired'
create policy "Invited user can expire their invitation"
  on invitations for update
  to authenticated
  using (invited_user_id = auth.uid() and status = 'pending')
  with check (invited_user_id = auth.uid() and status = 'expired');

commit;
