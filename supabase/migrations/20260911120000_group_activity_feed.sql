-- activity_feed exists in the schema but nothing reads or writes it yet.
-- Wiring it up: same group-sharing RLS extension already applied to
-- workout_sessions/personal_records (new_pr gated by share_prs, everything
-- else by share_workouts — there's no per-event-type toggle, and these are
-- all "my training activity" in spirit), plus the two events that only ever
-- happen inside existing SECURITY DEFINER functions, so they belong there
-- rather than being duplicated at every call site.

drop policy if exists activity_feed_select on public.activity_feed;
create policy activity_feed_select on public.activity_feed
  for select using (
    user_id = (select auth.uid())
    or are_friends((select auth.uid()), user_id)
    or exists (
      select 1
      from public.group_members owner_m
      join public.group_members viewer_m on viewer_m.group_id = owner_m.group_id
      where owner_m.user_id = activity_feed.user_id
        and viewer_m.user_id = (select auth.uid())
        and (
          (activity_feed.type = 'new_pr' and owner_m.share_prs)
          or (activity_feed.type <> 'new_pr' and owner_m.share_workouts)
        )
    )
  );

-- Achievement unlock: the loop already knows exactly when v_progress first
-- crosses 100, right next to the existing xp_events insert for the same
-- moment. Needs the achievement's name/icon, so the loop's own select grows
-- two columns.
create or replace function public.evaluate_achievements(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_workout_count integer;
  v_pr_count integer;
  v_total_volume numeric;
  v_streak integer := 0;
  v_cursor date;
  v_consistent_weeks integer;
  v_goals_completed integer;
  v_achievement record;
  v_value numeric;
  v_progress numeric;
  v_was_unlocked boolean;
begin
  if p_user_id <> auth.uid() then
    raise exception 'not authorized';
  end if;

  select count(*) into v_workout_count
    from workout_sessions where user_id = p_user_id and completed_at is not null;

  select count(*) into v_pr_count
    from personal_records where user_id = p_user_id;

  select coalesce(sum(total_volume_kg), 0) into v_total_volume
    from workout_sessions where user_id = p_user_id and completed_at is not null;

  select count(distinct date_trunc('week', completed_at)) into v_consistent_weeks
    from workout_sessions where user_id = p_user_id and completed_at is not null;

  select count(*) into v_goals_completed
    from goals where user_id = p_user_id and status = 'completed';

  if exists (
    select 1 from workout_sessions
    where user_id = p_user_id and completed_at is not null
      and date(completed_at) >= current_date - 1
  ) then
    select max(date(completed_at)) into v_cursor
      from workout_sessions where user_id = p_user_id and completed_at is not null;

    loop
      exit when not exists (
        select 1 from workout_sessions
        where user_id = p_user_id and completed_at is not null and date(completed_at) = v_cursor
      );
      v_streak := v_streak + 1;
      v_cursor := v_cursor - 1;
    end loop;
  end if;

  for v_achievement in select id, name, icon, criteria from achievements loop
    v_value := case v_achievement.criteria->>'type'
      when 'workout_count' then v_workout_count
      when 'pr_count' then v_pr_count
      when 'total_volume_kg' then v_total_volume
      when 'streak_days' then v_streak
      when 'consistent_weeks' then v_consistent_weeks
      when 'goals_completed' then v_goals_completed
      else 0
    end;

    v_progress := least(100, (v_value / nullif((v_achievement.criteria->>'threshold')::numeric, 0)) * 100);

    select unlocked_at is not null into v_was_unlocked
      from user_achievements where user_id = p_user_id and achievement_id = v_achievement.id;

    insert into user_achievements (user_id, achievement_id, progress, unlocked_at)
    values (p_user_id, v_achievement.id, v_progress, case when v_progress >= 100 then now() else null end)
    on conflict (user_id, achievement_id) do update
      set progress = excluded.progress,
          unlocked_at = coalesce(user_achievements.unlocked_at, excluded.unlocked_at);

    if v_progress >= 100 and not coalesce(v_was_unlocked, false) then
      insert into xp_events (user_id, amount, reason, related_type, related_id)
        values (p_user_id, 50, 'achievement_unlocked', 'achievement', v_achievement.id);

      insert into activity_feed (user_id, type, related_type, related_id, metadata)
        values (
          p_user_id, 'achievement_unlocked', 'achievement', v_achievement.id,
          jsonb_build_object('name', v_achievement.name, 'icon', v_achievement.icon)
        );
    end if;
  end loop;
end;
$$;

-- Level up: apply_xp_event is the one trigger that ever changes
-- profiles.level, so it's the only place that can know "before" vs "after"
-- without a second query elsewhere.
create or replace function public.apply_xp_event()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_old_level integer;
  v_new_level integer;
begin
  select level into v_old_level from public.profiles where id = new.user_id;
  v_new_level := public.calculate_level((select xp from public.profiles where id = new.user_id) + new.amount);

  update public.profiles
  set xp = xp + new.amount,
      level = v_new_level
  where id = new.user_id;

  if v_new_level > coalesce(v_old_level, 1) then
    insert into activity_feed (user_id, type, metadata)
      values (new.user_id, 'level_up', jsonb_build_object('level', v_new_level));
  end if;

  return new;
end;
$$;
