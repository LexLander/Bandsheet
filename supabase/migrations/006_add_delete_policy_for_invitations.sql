-- Allow leader/deputy to cancel pending invitations

create policy "Видаляти запрошення можуть лідер і заступник"
  on invitations for delete
  to authenticated
  using (
    exists (
      select 1 from group_members
      where group_id = invitations.group_id
        and user_id = auth.uid()
        and role in ('leader', 'deputy')
    )
  );
