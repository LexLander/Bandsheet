-- Исправление: даём триггеру права на вставку в profiles
-- и пересоздаём функцию с правильным search_path

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(excluded.name, profiles.name),
        avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);
  return new;
end;
$$;

-- Даём права сервисному роли и postgres на таблицу profiles
grant all on public.profiles to postgres, service_role;

-- Добавляем INSERT политику для profiles (нужна для триггера в некоторых версиях)
drop policy if exists "Пользователь создает свой профиль" on profiles;
create policy "Пользователь создает свой профиль"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);
