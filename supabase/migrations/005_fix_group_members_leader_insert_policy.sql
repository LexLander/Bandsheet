-- Fix: allow leader to add self to new group without being blocked by RLS on groups

create or replace function public.is_group_leader(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.groups g
    where g.id = p_group_id
      and g.leader_id = auth.uid()
  );
$$;

grant execute on function public.is_group_leader(uuid) to authenticated;

drop policy if exists "Лідер може додати себе до нової групи" on group_members;
create policy "Лідер може додати себе до нової групи"
  on group_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and role = 'leader'
    and public.is_group_leader(group_id)
  );
