-- ============================================================
-- BandSheet — Initial Schema
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type platform_role as enum ('admin', 'user');
create type group_role as enum ('leader', 'deputy', 'switcher', 'member');
create type song_source as enum ('public', 'private');
create type access_type as enum ('free', 'subscription');
create type event_status as enum ('draft', 'active', 'archived');
create type invitation_status as enum ('pending', 'accepted', 'expired');

-- ============================================================
-- PROFILES
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  platform_role platform_role not null default 'user',
  settings jsonb default '{
    "display_mode": "words_chords",
    "font_size": "md",
    "bg_color": "#ffffff",
    "text_color": "#000000",
    "sync_mode": "online"
  }'::jsonb,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Профиль виден всем аутентифицированным"
  on profiles for select
  to authenticated
  using (true);

create policy "Пользователь редактирует свой профиль"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- Автосоздание профиля при регистрации
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- GROUPS
-- ============================================================

create table groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  leader_id uuid not null references profiles(id) on delete restrict,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table groups enable row level security;

create table group_members (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role group_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table group_members enable row level security;

-- RLS: группу видят её члены
create policy "Группа видна участникам"
  on groups for select
  to authenticated
  using (
    exists (
      select 1 from group_members
      where group_id = groups.id and user_id = auth.uid()
    )
  );

create policy "Создать группу может любой аутентифицированный"
  on groups for insert
  to authenticated
  with check (leader_id = auth.uid());

create policy "Редактировать группу может лидер"
  on groups for update
  to authenticated
  using (leader_id = auth.uid());

create policy "Удалить группу может лидер"
  on groups for delete
  to authenticated
  using (leader_id = auth.uid());

-- RLS group_members
create policy "Участников видят члены группы"
  on group_members for select
  to authenticated
  using (
    exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id and gm.user_id = auth.uid()
    )
  );

create policy "Добавлять участников может лидер или заместитель"
  on group_members for insert
  to authenticated
  with check (
    exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role in ('leader', 'deputy')
    )
  );

create policy "Удалять участников может лидер или заместитель"
  on group_members for delete
  to authenticated
  using (
    exists (
      select 1 from group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
        and gm.role in ('leader', 'deputy')
    )
    or user_id = auth.uid()  -- участник может выйти сам
  );

-- ============================================================
-- SONGS PUBLIC
-- ============================================================

create table songs_public (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  artist text,
  text_chords text,
  key text,
  bpm integer,
  time_signature text,
  language text,
  genre text,
  access_type access_type not null default 'free',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table songs_public enable row level security;

create policy "Публичные песни видны всем"
  on songs_public for select
  using (true);

create policy "Создавать публичные песни может любой аутентифицированный"
  on songs_public for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Редактировать песню может автор или админ"
  on songs_public for update
  to authenticated
  using (
    created_by = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and platform_role = 'admin')
  );

-- ============================================================
-- SONGS PRIVATE (группы)
-- ============================================================

create table songs_private (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups(id) on delete cascade,
  title text not null,
  artist text,
  text_chords text,
  key text,
  bpm integer,
  time_signature text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table songs_private enable row level security;

create policy "Приватные песни видны участникам группы"
  on songs_private for select
  to authenticated
  using (
    exists (
      select 1 from group_members
      where group_id = songs_private.group_id and user_id = auth.uid()
    )
  );

create policy "Создавать приватные песни могут участники группы"
  on songs_private for insert
  to authenticated
  with check (
    exists (
      select 1 from group_members
      where group_id = songs_private.group_id and user_id = auth.uid()
    )
  );

create policy "Редактировать приватные песни — лидер или автор"
  on songs_private for update
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from group_members
      where group_id = songs_private.group_id
        and user_id = auth.uid()
        and role in ('leader', 'deputy')
    )
  );

create policy "Удалять приватные песни — лидер или автор"
  on songs_private for delete
  to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from group_members
      where group_id = songs_private.group_id
        and user_id = auth.uid()
        and role in ('leader', 'deputy')
    )
  );

-- ============================================================
-- LIBRARY (личная библиотека пользователя)
-- ============================================================

create table library_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  song_id uuid not null,
  song_source song_source not null,
  custom_key text,
  custom_bpm integer,
  custom_time_signature text,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, song_id, song_source)
);

alter table library_items enable row level security;

create policy "Библиотека видна только владельцу"
  on library_items for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- EVENTS
-- ============================================================

create table events (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups(id) on delete cascade,
  name text not null,
  date timestamptz,
  venue text,
  status event_status not null default 'draft',
  created_by uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table events enable row level security;

create policy "События видны участникам группы"
  on events for select
  to authenticated
  using (
    exists (
      select 1 from group_members
      where group_id = events.group_id and user_id = auth.uid()
    )
  );

create policy "Создавать события могут лидер и заместитель"
  on events for insert
  to authenticated
  with check (
    exists (
      select 1 from group_members
      where group_id = events.group_id
        and user_id = auth.uid()
        and role in ('leader', 'deputy')
    )
  );

create policy "Редактировать события — лидер и заместитель"
  on events for update
  to authenticated
  using (
    exists (
      select 1 from group_members
      where group_id = events.group_id
        and user_id = auth.uid()
        and role in ('leader', 'deputy')
    )
  );

-- ============================================================
-- SETLISTS
-- ============================================================

create table setlists (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null unique references events(id) on delete cascade,
  current_song_index integer not null default 0,
  is_live boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table setlists enable row level security;

create table setlist_items (
  id uuid primary key default uuid_generate_v4(),
  setlist_id uuid not null references setlists(id) on delete cascade,
  position integer not null,
  song_id uuid not null,
  song_source song_source not null,
  transposed_key text,
  notes text,
  unique (setlist_id, position)
);

alter table setlist_items enable row level security;

-- RLS через events → group_members
create policy "Сетлист виден участникам группы"
  on setlists for select
  to authenticated
  using (
    exists (
      select 1 from events e
      join group_members gm on gm.group_id = e.group_id
      where e.id = setlists.event_id and gm.user_id = auth.uid()
    )
  );

create policy "Редактировать сетлист — лидер, заместитель, переключатель"
  on setlists for update
  to authenticated
  using (
    exists (
      select 1 from events e
      join group_members gm on gm.group_id = e.group_id
      where e.id = setlists.event_id
        and gm.user_id = auth.uid()
        and gm.role in ('leader', 'deputy', 'switcher')
    )
  );

create policy "Элементы сетлиста видны участникам группы"
  on setlist_items for select
  to authenticated
  using (
    exists (
      select 1 from setlists s
      join events e on e.id = s.event_id
      join group_members gm on gm.group_id = e.group_id
      where s.id = setlist_items.setlist_id and gm.user_id = auth.uid()
    )
  );

create policy "Редактировать элементы сетлиста — лидер, заместитель, переключатель"
  on setlist_items for all
  to authenticated
  using (
    exists (
      select 1 from setlists s
      join events e on e.id = s.event_id
      join group_members gm on gm.group_id = e.group_id
      where s.id = setlist_items.setlist_id
        and gm.user_id = auth.uid()
        and gm.role in ('leader', 'deputy', 'switcher')
    )
  );

-- Автообновление updated_at у setlists
create or replace function update_setlist_timestamp()
returns trigger language plpgsql as $$
begin
  update setlists set updated_at = now() where id = new.setlist_id;
  return new;
end;
$$;

create trigger on_setlist_item_changed
  after insert or update or delete on setlist_items
  for each row execute function update_setlist_timestamp();

-- ============================================================
-- INVITATIONS
-- ============================================================

create table invitations (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references groups(id) on delete cascade,
  email text not null,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  role group_role not null default 'member',
  status invitation_status not null default 'pending',
  expires_at timestamptz default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

alter table invitations enable row level security;

create policy "Приглашения видны лидеру и заместителю группы"
  on invitations for select
  to authenticated
  using (
    exists (
      select 1 from group_members
      where group_id = invitations.group_id
        and user_id = auth.uid()
        and role in ('leader', 'deputy')
    )
  );

create policy "Создавать приглашения — лидер и заместитель"
  on invitations for insert
  to authenticated
  with check (
    exists (
      select 1 from group_members
      where group_id = invitations.group_id
        and user_id = auth.uid()
        and role in ('leader', 'deputy')
    )
  );

-- Публичный доступ к приглашению по токену (для страницы /invite/[token])
create policy "Приглашение можно получить по токену"
  on invitations for select
  using (status = 'pending' and expires_at > now());

-- ============================================================
-- REALTIME
-- ============================================================

-- Включаем realtime для таблиц, которые нужны для live-режима
alter publication supabase_realtime add table setlists;
alter publication supabase_realtime add table setlist_items;
