-- Private groups of friends, plus the hook for group-scoped challenges.
--
-- Challenges are NOT duplicated: the existing table already carries metric,
-- dates, target, participants and results, so it just gains a nullable
-- group_id. A challenge with no group behaves exactly as before.

create type group_role as enum ('owner', 'member');

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 60),
  description text check (length(description) <= 300),
  avatar_url text,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role group_role not null default 'member',
  joined_at timestamptz not null default now(),
  -- Per-group sharing switches. Default to on for the things a group is for
  -- (did you train, did you hit a PR, what's your streak) — a member can
  -- turn any of them off and still take part in the group.
  share_workouts boolean not null default true,
  share_prs boolean not null default true,
  share_streak boolean not null default true,
  unique (group_id, user_id)
);

create index group_members_user_idx on public.group_members (user_id);
create index group_members_group_idx on public.group_members (group_id);

alter table public.challenges add column if not exists group_id uuid references public.groups(id) on delete cascade;
create index if not exists challenges_group_idx on public.challenges (group_id) where group_id is not null;

-- Membership checks used by the policies below. SECURITY DEFINER on purpose:
-- "can I see this group?" is answered from group_members, whose own policy
-- asks the same question, and a plain subquery would recurse. Same pattern
-- as the existing owns_* / can_view_* predicates, and like those it only
-- ever returns a boolean about the caller's own access.
create function public.is_group_member(p_group_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = p_group_id and m.user_id = (select auth.uid())
  );
$$;

create function public.is_group_owner(p_group_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = p_group_id and m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;

revoke execute on function public.is_group_member(uuid) from anon;
revoke execute on function public.is_group_owner(uuid) from anon;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Groups are private: no listing, no discovery, membership is the only key.
create policy groups_select on public.groups
  for select using (public.is_group_member(id));
create policy groups_insert on public.groups
  for insert with check (creator_id = (select auth.uid()));
create policy groups_update on public.groups
  for update using (public.is_group_owner(id));
create policy groups_delete on public.groups
  for delete using (public.is_group_owner(id));

create policy group_members_select on public.group_members
  for select using (public.is_group_member(group_id));

-- Two ways a row is legitimately created: the creator seeding their own
-- membership as they make the group, or an owner adding somebody they are
-- already friends with. Nobody can add themselves to a group.
create policy group_members_insert on public.group_members
  for insert with check (
    (
      user_id = (select auth.uid())
      and exists (select 1 from public.groups g where g.id = group_id and g.creator_id = (select auth.uid()))
    )
    or (
      public.is_group_owner(group_id)
      and public.are_friends((select auth.uid()), user_id)
    )
  );

create policy group_members_update on public.group_members
  for update using (user_id = (select auth.uid()));

-- Leave a group yourself, or be removed by an owner.
create policy group_members_delete on public.group_members
  for delete using (user_id = (select auth.uid()) or public.is_group_owner(group_id));

-- Group challenges are visible to the group; ungrouped ones keep the
-- existing participant-based rule.
drop policy if exists challenges_select on public.challenges;
create policy challenges_select on public.challenges
  for select using (
    is_challenge_participant(id)
    or (group_id is not null and public.is_group_member(group_id))
  );
