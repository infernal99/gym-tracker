-- Custom exercises are private to whoever made them (exercises_select), so
-- a shared routine that used one arrived broken: the friend's copy pointed
-- at an exercise they could not read. Two fixes:
--
-- 1. Accepting a shared routine now gives the recipient their own copy of
--    every custom exercise in it (not their own ones), and the copied
--    routine points at those copies. copied_from_id remembers the source,
--    so accepting a second routine with the same exercise reuses the copy
--    instead of piling up duplicates.
-- 2. While a routine is shared with you (before accepting), its custom
--    exercises are readable, so the preview shows their names.

alter table public.exercises
  add column if not exists copied_from_id uuid references public.exercises (id) on delete set null;

create index if not exists exercises_copied_from_idx
  on public.exercises (created_by, copied_from_id)
  where copied_from_id is not null;

create or replace function public.exercise_in_template_shared_with_me(p_exercise_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.workout_template_exercises te
    join public.workout_template_days d on d.id = te.template_day_id
    join public.template_shares ts on ts.template_id = d.template_id
    where te.exercise_id = p_exercise_id
      and ts.shared_with = (select auth.uid())
  );
$$;

create policy "exercises_select_shared_custom" on public.exercises
  for select using (is_custom and public.exercise_in_template_shared_with_me(id));

create or replace function public.fork_shared_template(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_source_id uuid;
  v_source_name text;
  v_source_description text;
  v_new_id uuid;
  v_day record;
  v_new_day_id uuid;
  v_ex record;
  v_copy_id uuid;
  v_map jsonb := '{}'::jsonb;
begin
  select id, name, description into v_source_id, v_source_name, v_source_description
  from public.workout_templates
  where share_token = p_token;

  if v_source_id is null then
    raise exception 'invalid_share_token';
  end if;

  -- Someone else's custom exercises in this routine: find or make the
  -- caller's own copy of each, and remember source -> copy.
  for v_ex in
    select distinct e.*
    from public.exercises e
    join public.workout_template_exercises te on te.exercise_id = e.id
    join public.workout_template_days d on d.id = te.template_day_id
    where d.template_id = v_source_id
      and e.is_custom
      and e.created_by is distinct from auth.uid()
  loop
    select id into v_copy_id
    from public.exercises
    where created_by = auth.uid() and copied_from_id = v_ex.id
    limit 1;

    if v_copy_id is null then
      insert into public.exercises (
        name, slug, primary_muscle_group_id, secondary_muscle_group_ids, equipment_id,
        difficulty, movement_type, description, technique_notes, common_mistakes, tips,
        instructions, alternate_names, image_url, thumbnail_url, video_url,
        is_custom, created_by, copied_from_id
      )
      values (
        v_ex.name,
        regexp_replace(v_ex.slug, '-[a-z0-9]{6}$', '') || '-' || substr(md5(random()::text), 1, 6),
        v_ex.primary_muscle_group_id, v_ex.secondary_muscle_group_ids, v_ex.equipment_id,
        v_ex.difficulty, v_ex.movement_type, v_ex.description, v_ex.technique_notes,
        v_ex.common_mistakes, v_ex.tips, v_ex.instructions, v_ex.alternate_names,
        v_ex.image_url, v_ex.thumbnail_url, v_ex.video_url,
        true, auth.uid(), v_ex.id
      )
      returning id into v_copy_id;
    end if;

    v_map := v_map || jsonb_build_object(v_ex.id::text, v_copy_id);
  end loop;

  insert into public.workout_templates (user_id, name, description)
  values (auth.uid(), v_source_name, v_source_description)
  returning id into v_new_id;

  for v_day in
    select * from public.workout_template_days where template_id = v_source_id order by day_order
  loop
    insert into public.workout_template_days (template_id, day_order, name, is_rest_day, muscle_group_ids)
    values (v_new_id, v_day.day_order, v_day.name, v_day.is_rest_day, v_day.muscle_group_ids)
    returning id into v_new_day_id;

    insert into public.workout_template_exercises (
      template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max,
      target_weight_kg, target_rir, target_rpe, rest_seconds, notes, is_unilateral, rest_between_sides_seconds
    )
    select
      v_new_day_id,
      coalesce((v_map ->> exercise_id::text)::uuid, exercise_id),
      order_index, target_sets, target_reps_min, target_reps_max,
      target_weight_kg, target_rir, target_rpe, rest_seconds, notes, is_unilateral, rest_between_sides_seconds
    from public.workout_template_exercises
    where template_day_id = v_day.id;
  end loop;

  return v_new_id;
end;
$function$;
