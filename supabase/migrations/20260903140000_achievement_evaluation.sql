-- Evaluates the 9 seeded achievements (see 20260830120700_gamification.sql)
-- against a user's real stats and unlocks/awards XP for newly-completed
-- ones. Achievements/XP have no client insert/update policy by design
-- (trusted-server-only), so this runs as security definer and is the one
-- sanctioned way the app can grant them — called via RPC after a workout
-- finishes or a goal completes.
create or replace function public.evaluate_achievements(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
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

  for v_achievement in select id, criteria from achievements loop
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
    end if;
  end loop;
end;
$$;

grant execute on function public.evaluate_achievements(uuid) to authenticated;
