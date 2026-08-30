-- ============================================================
-- Enums
-- ============================================================
create type public.primary_goal as enum (
  'gain_muscle',
  'lose_fat',
  'gain_strength',
  'maintain',
  'improve_performance',
  'body_recomposition'
);

create type public.visibility_level as enum ('public', 'friends', 'private');
create type public.private_visibility_level as enum ('friends', 'private');
create type public.friend_request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  avatar_url text,
  bio text,
  date_of_birth date,
  height_cm numeric(5, 1),
  initial_weight_kg numeric(5, 1),
  primary_goal public.primary_goal not null default 'maintain',
  xp integer not null default 0,
  level integer not null default 1,
  profile_visibility public.visibility_level not null default 'friends',
  workouts_visibility public.private_visibility_level not null default 'friends',
  weight_visibility public.private_visibility_level not null default 'private',
  prs_visibility public.private_visibility_level not null default 'friends',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_.]{3,20}$')
);

create index profiles_username_idx on public.profiles (username);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up.
-- Registration collects username/display_name/etc. via signUp() options.data,
-- which lands in raw_user_meta_data.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, height_cm, initial_weight_kg, date_of_birth, primary_goal)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data ->> 'display_name', 'New User'),
    nullif(new.raw_user_meta_data ->> 'height_cm', '')::numeric,
    nullif(new.raw_user_meta_data ->> 'initial_weight_kg', '')::numeric,
    nullif(new.raw_user_meta_data ->> 'date_of_birth', '')::date,
    coalesce((new.raw_user_meta_data ->> 'primary_goal')::public.primary_goal, 'maintain')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- friendships / friend_requests / blocked_users
-- ============================================================
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_id_a uuid not null references public.profiles (id) on delete cascade,
  user_id_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friendships_ordered_pair check (user_id_a < user_id_b),
  unique (user_id_a, user_id_b)
);

create index friendships_user_a_idx on public.friendships (user_id_a);
create index friendships_user_b_idx on public.friendships (user_id_b);

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  status public.friend_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friend_requests_not_self check (sender_id <> receiver_id)
);

create unique index friend_requests_pending_pair_idx
  on public.friend_requests (sender_id, receiver_id)
  where (status = 'pending');

create table public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint blocked_users_not_self check (blocker_id <> blocked_id),
  unique (blocker_id, blocked_id)
);

-- Accepting a request materializes the friendship row (ordered pair) and
-- retires any mirrored pending request in the other direction.
create or replace function public.handle_friend_request_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    insert into public.friendships (user_id_a, user_id_b)
    values (least(new.sender_id, new.receiver_id), greatest(new.sender_id, new.receiver_id))
    on conflict do nothing;

    update public.friend_requests
    set status = 'cancelled', responded_at = now()
    where sender_id = new.receiver_id
      and receiver_id = new.sender_id
      and status = 'pending';
  end if;
  return new;
end;
$$;

create trigger on_friend_request_accepted
  after update on public.friend_requests
  for each row execute function public.handle_friend_request_accepted();

-- ============================================================
-- Helper functions used across RLS policies in later migrations
-- ============================================================
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.friendships
    where user_id_a = least(a, b) and user_id_b = greatest(a, b)
  );
$$;

create or replace function public.is_blocked(a uuid, b uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.blocked_users
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

create or replace function public.can_view_profile(target uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select case
    when auth.uid() = target then true
    when public.is_blocked(auth.uid(), target) then false
    else exists (
      select 1 from public.profiles p
      where p.id = target
        and (
          p.profile_visibility = 'public'
          or (p.profile_visibility = 'friends' and public.are_friends(auth.uid(), target))
        )
    )
  end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.friend_requests enable row level security;
alter table public.blocked_users enable row level security;

create policy "profiles_select" on public.profiles
  for select using (public.can_view_profile(id));

create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "friendships_select" on public.friendships
  for select using (auth.uid() in (user_id_a, user_id_b));

create policy "friendships_delete" on public.friendships
  for delete using (auth.uid() in (user_id_a, user_id_b));

create policy "friend_requests_select" on public.friend_requests
  for select using (auth.uid() in (sender_id, receiver_id));

create policy "friend_requests_insert" on public.friend_requests
  for insert with check (
    auth.uid() = sender_id
    and not public.is_blocked(sender_id, receiver_id)
  );

create policy "friend_requests_update" on public.friend_requests
  for update using (auth.uid() in (sender_id, receiver_id));

create policy "friend_requests_delete" on public.friend_requests
  for delete using (auth.uid() in (sender_id, receiver_id));

create policy "blocked_users_select" on public.blocked_users
  for select using (auth.uid() = blocker_id);

create policy "blocked_users_insert" on public.blocked_users
  for insert with check (auth.uid() = blocker_id);

create policy "blocked_users_delete" on public.blocked_users
  for delete using (auth.uid() = blocker_id);
