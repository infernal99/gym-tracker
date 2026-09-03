-- Detects when a user's best e1rm on an exercise has improved >=10% over
-- their very first recorded set on it, and notifies them once per exercise
-- (checking for an existing 'milestone' notification for that exercise
-- avoids re-notifying every workout once the threshold is crossed).
alter type public.notification_type add value if not exists 'milestone';

create or replace function public.check_exercise_milestones(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_pct numeric;
begin
  if p_user_id <> auth.uid() then
    raise exception 'not authorized';
  end if;

  for v_row in
    with best_sets as (
      select
        se.exercise_id,
        s.weight_kg * (1 + s.reps / 30.0) as e1rm,
        ws.completed_at
      from sets s
      join workout_session_exercises se on se.id = s.session_exercise_id
      join workout_sessions ws on ws.id = se.session_id
      where ws.user_id = p_user_id
        and ws.completed_at is not null
        and s.weight_kg is not null
        and s.reps is not null
    ),
    per_exercise as (
      select
        exercise_id,
        max(e1rm) as current_best,
        (array_agg(e1rm order by completed_at asc))[1] as first_e1rm
      from best_sets
      group by exercise_id
      having count(*) > 1
    )
    select pe.exercise_id, pe.current_best, pe.first_e1rm, e.name as exercise_name
    from per_exercise pe
    join exercises e on e.id = pe.exercise_id
    where pe.first_e1rm > 0 and pe.current_best >= pe.first_e1rm * 1.1
  loop
    if not exists (
      select 1 from notifications
      where user_id = p_user_id and type = 'milestone' and related_id = v_row.exercise_id
    ) then
      v_pct := round(((v_row.current_best - v_row.first_e1rm) / v_row.first_e1rm) * 100);
      insert into notifications (user_id, type, title, body, related_type, related_id)
        values (
          p_user_id,
          'milestone',
          '¡Mejora de ' || v_pct || '% en ' || v_row.exercise_name || '!',
          'Tu 1RM estimado ha subido de ' || round(v_row.first_e1rm) || ' kg a ' || round(v_row.current_best) || ' kg desde tu primer registro.',
          'exercise',
          v_row.exercise_id
        );
    end if;
  end loop;
end;
$$;

grant execute on function public.check_exercise_milestones(uuid) to authenticated;
