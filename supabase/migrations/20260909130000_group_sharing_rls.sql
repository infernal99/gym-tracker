-- Groups let an owner add anyone THEY are friends with, but that doesn't
-- make every pair of members mutual friends. can_view_session and the
-- personal_records policy only ever checked are_friends(), so two group
-- members who aren't personally friends would see nothing of each other in
-- the group's summary/ranking even with share_workouts/share_prs on — not
-- an error, just silent zeroes, which is worse.
--
-- Extends the existing predicates with an extra OR branch (shared group +
-- that member's own sharing flag) rather than introducing a second,
-- group-scoped visibility system alongside the friends-based one.
create or replace function public.can_view_session(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_user_id = (select auth.uid()) or (
    public.are_friends((select auth.uid()), p_user_id)
    and exists (
      select 1 from public.profiles
      where id = p_user_id and workouts_visibility = 'friends'
    )
  ) or exists (
    select 1
    from public.group_members owner_m
    join public.group_members viewer_m on viewer_m.group_id = owner_m.group_id
    where owner_m.user_id = p_user_id
      and viewer_m.user_id = (select auth.uid())
      and owner_m.share_workouts
  );
$$;

drop policy if exists personal_records_select on public.personal_records;
create policy personal_records_select on public.personal_records
  for select using (
    user_id = (select auth.uid())
    or (
      are_friends((select auth.uid()), user_id)
      and exists (
        select 1 from profiles
        where profiles.id = personal_records.user_id and profiles.prs_visibility = 'friends'
      )
    )
    or exists (
      select 1
      from public.group_members owner_m
      join public.group_members viewer_m on viewer_m.group_id = owner_m.group_id
      where owner_m.user_id = personal_records.user_id
        and viewer_m.user_id = (select auth.uid())
        and owner_m.share_prs
    )
  );
