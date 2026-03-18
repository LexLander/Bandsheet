-- Дозволяємо лідеру додати себе першим при створенні групи
create policy "Лідер може додати себе до нової групи"
  on group_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and role = 'leader'
    and exists (
      select 1 from groups
      where id = group_members.group_id
        and leader_id = auth.uid()
    )
  );
