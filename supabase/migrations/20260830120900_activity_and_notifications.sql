create type public.activity_type as enum (
  'workout_completed', 'new_pr', 'achievement_unlocked', 'goal_completed', 'challenge_won', 'level_up'
);
create type public.notification_type as enum (
  'friend_request', 'friend_accepted', 'new_pr', 'achievement',
  'challenge', 'goal_completed', 'workout_reminder'
);

-- The feed is always friends-only by design (section 27) — there is no
-- public activity option, unlike profiles/sessions/weight/PRs.
create table public.activity_feed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.activity_type not null,
  related_type text,
  related_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index activity_feed_user_idx on public.activity_feed (user_id, created_at desc);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activity_feed (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null check (emoji in ('🔥', '💪', '👏')),
  created_at timestamptz not null default now(),
  unique (activity_id, user_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  related_type text,
  related_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

alter table public.activity_feed enable row level security;
alter table public.reactions enable row level security;
alter table public.notifications enable row level security;

create policy "activity_feed_select" on public.activity_feed
  for select using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));

create policy "activity_feed_insert" on public.activity_feed
  for insert with check (user_id = auth.uid());

create policy "activity_feed_delete" on public.activity_feed
  for delete using (user_id = auth.uid());

create policy "reactions_select" on public.reactions
  for select using (
    exists (
      select 1 from public.activity_feed a
      where a.id = activity_id and (a.user_id = auth.uid() or public.are_friends(auth.uid(), a.user_id))
    )
  );

create policy "reactions_insert" on public.reactions
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.activity_feed a
      where a.id = activity_id and (a.user_id = auth.uid() or public.are_friends(auth.uid(), a.user_id))
    )
  );

create policy "reactions_delete" on public.reactions
  for delete using (user_id = auth.uid());

-- Notifications are only ever written by trusted server code (e.g. the
-- sender's server action notifying the receiver), never by the recipient.
create policy "notifications_select" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifications_update" on public.notifications
  for update using (user_id = auth.uid());
