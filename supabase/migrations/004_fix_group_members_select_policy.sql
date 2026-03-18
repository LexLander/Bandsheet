-- Fix: avoid infinite recursion in RLS policy on group_members
-- Create security-definer helper to check membership (bypasses RLS when called)

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.group_members gm
    where gm.group_id = p_group_id and gm.user_id = auth.uid()
  );
$$;

grant execute on function public.is_group_member(uuid) to authenticated;

-- Replace the recursive policy with one that calls the safe helper
drop policy if exists "Участников видят члены группы" on group_members;
create policy "Участников видят члены группы"
  on group_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_group_member(group_id)
  );
