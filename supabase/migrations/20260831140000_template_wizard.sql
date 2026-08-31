-- Supports the guided routine-creation wizard: each day now records which
-- muscle groups it targets, and we seed a small public template library
-- users can pick from instead of building a routine from scratch.
alter table public.workout_template_days
  add column muscle_group_ids uuid[] not null default '{}';

do $$
declare
  v_owner uuid := '124d29df-1d9c-446f-b6b2-34af36f39b51';
  v_template uuid;
  v_day uuid;
begin
  -- ============================================================
  -- Arnold Split
  -- ============================================================
  insert into public.workout_templates (user_id, name, description, is_public)
  values (v_owner, 'Arnold Split', 'Pecho/espalda, hombros/brazos y piernas, dos veces por semana.', true)
  returning id into v_template;

  -- Día 1: Pecho y Espalda
  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 1, 'Pecho y Espalda', array(select id from public.muscle_groups where slug in ('chest','back')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds) values
    (v_day, (select id from public.exercises where slug = 'bench-press'), 0, 4, 6, 10, 120),
    (v_day, (select id from public.exercises where slug = 'barbell-row'), 1, 4, 6, 10, 120),
    (v_day, (select id from public.exercises where slug = 'incline-db-press'), 2, 3, 8, 12, 90),
    (v_day, (select id from public.exercises where slug = 'lat-pulldown'), 3, 3, 8, 12, 90),
    (v_day, (select id from public.exercises where slug = 'db-fly'), 4, 3, 10, 15, 60),
    (v_day, (select id from public.exercises where slug = 'seated-cable-row'), 5, 3, 10, 15, 60);

  -- Día 2: Hombros y Brazos
  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 2, 'Hombros y Brazos', array(select id from public.muscle_groups where slug in ('shoulders','biceps','triceps')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds) values
    (v_day, (select id from public.exercises where slug = 'overhead-press'), 0, 4, 6, 10, 120),
    (v_day, (select id from public.exercises where slug = 'lateral-raise'), 1, 3, 12, 15, 60),
    (v_day, (select id from public.exercises where slug = 'barbell-curl'), 2, 3, 8, 12, 60),
    (v_day, (select id from public.exercises where slug = 'triceps-pushdown'), 3, 3, 8, 12, 60),
    (v_day, (select id from public.exercises where slug = 'hammer-curl'), 4, 3, 10, 15, 60),
    (v_day, (select id from public.exercises where slug = 'skull-crusher'), 5, 3, 10, 15, 60);

  -- Día 3: Piernas
  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 3, 'Piernas', array(select id from public.muscle_groups where slug in ('legs','glutes','calves')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds) values
    (v_day, (select id from public.exercises where slug = 'squat'), 0, 4, 6, 10, 150),
    (v_day, (select id from public.exercises where slug = 'leg-press'), 1, 3, 10, 15, 90),
    (v_day, (select id from public.exercises where slug = 'db-lunge'), 2, 3, 10, 12, 90),
    (v_day, (select id from public.exercises where slug = 'leg-curl'), 3, 3, 10, 15, 60),
    (v_day, (select id from public.exercises where slug = 'hip-thrust'), 4, 3, 8, 12, 90),
    (v_day, (select id from public.exercises where slug = 'calf-raise'), 5, 4, 12, 20, 45);

  -- Días 4-6: repite el ciclo
  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 4, 'Pecho y Espalda', array(select id from public.muscle_groups where slug in ('chest','back')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds) values
    (v_day, (select id from public.exercises where slug = 'bench-press'), 0, 4, 6, 10, 120),
    (v_day, (select id from public.exercises where slug = 'barbell-row'), 1, 4, 6, 10, 120),
    (v_day, (select id from public.exercises where slug = 'incline-db-press'), 2, 3, 8, 12, 90),
    (v_day, (select id from public.exercises where slug = 'lat-pulldown'), 3, 3, 8, 12, 90);

  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 5, 'Hombros y Brazos', array(select id from public.muscle_groups where slug in ('shoulders','biceps','triceps')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds) values
    (v_day, (select id from public.exercises where slug = 'overhead-press'), 0, 4, 6, 10, 120),
    (v_day, (select id from public.exercises where slug = 'barbell-curl'), 1, 3, 8, 12, 60),
    (v_day, (select id from public.exercises where slug = 'triceps-pushdown'), 2, 3, 8, 12, 60);

  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 6, 'Piernas', array(select id from public.muscle_groups where slug in ('legs','glutes','calves')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds) values
    (v_day, (select id from public.exercises where slug = 'squat'), 0, 4, 6, 10, 150),
    (v_day, (select id from public.exercises where slug = 'leg-press'), 1, 3, 10, 15, 90),
    (v_day, (select id from public.exercises where slug = 'calf-raise'), 2, 4, 12, 20, 45);

  -- ============================================================
  -- Push Pull Legs
  -- ============================================================
  insert into public.workout_templates (user_id, name, description, is_public)
  values (v_owner, 'Push Pull Legs', 'Empuje, tirón y pierna, dos veces por semana.', true)
  returning id into v_template;

  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 1, 'Push', array(select id from public.muscle_groups where slug in ('chest','shoulders','triceps')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds) values
    (v_day, (select id from public.exercises where slug = 'bench-press'), 0, 4, 6, 10, 120),
    (v_day, (select id from public.exercises where slug = 'overhead-press'), 1, 3, 8, 10, 90),
    (v_day, (select id from public.exercises where slug = 'incline-db-press'), 2, 3, 8, 12, 90),
    (v_day, (select id from public.exercises where slug = 'lateral-raise'), 3, 3, 12, 15, 60),
    (v_day, (select id from public.exercises where slug = 'dips'), 4, 3, 8, 12, 90),
    (v_day, (select id from public.exercises where slug = 'triceps-pushdown'), 5, 3, 10, 15, 60);

  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 2, 'Pull', array(select id from public.muscle_groups where slug in ('back','biceps')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds) values
    (v_day, (select id from public.exercises where slug = 'deadlift'), 0, 3, 5, 8, 180),
    (v_day, (select id from public.exercises where slug = 'pull-up'), 1, 4, 6, 10, 120),
    (v_day, (select id from public.exercises where slug = 'barbell-row'), 2, 3, 8, 12, 90),
    (v_day, (select id from public.exercises where slug = 'lat-pulldown'), 3, 3, 10, 12, 90),
    (v_day, (select id from public.exercises where slug = 'barbell-curl'), 4, 3, 8, 12, 60),
    (v_day, (select id from public.exercises where slug = 'hammer-curl'), 5, 3, 10, 15, 60);

  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 3, 'Legs', array(select id from public.muscle_groups where slug in ('legs','glutes','calves')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds) values
    (v_day, (select id from public.exercises where slug = 'squat'), 0, 4, 6, 10, 150),
    (v_day, (select id from public.exercises where slug = 'leg-press'), 1, 3, 10, 15, 90),
    (v_day, (select id from public.exercises where slug = 'leg-extension'), 2, 3, 12, 15, 60),
    (v_day, (select id from public.exercises where slug = 'leg-curl'), 3, 3, 12, 15, 60),
    (v_day, (select id from public.exercises where slug = 'hip-thrust'), 4, 3, 8, 12, 90),
    (v_day, (select id from public.exercises where slug = 'calf-raise'), 5, 4, 12, 20, 45);

  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 4, 'Push', array(select id from public.muscle_groups where slug in ('chest','shoulders','triceps')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds) values
    (v_day, (select id from public.exercises where slug = 'bench-press'), 0, 4, 6, 10, 120),
    (v_day, (select id from public.exercises where slug = 'overhead-press'), 1, 3, 8, 10, 90),
    (v_day, (select id from public.exercises where slug = 'dips'), 2, 3, 8, 12, 90);

  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 5, 'Pull', array(select id from public.muscle_groups where slug in ('back','biceps')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds) values
    (v_day, (select id from public.exercises where slug = 'pull-up'), 0, 4, 6, 10, 120),
    (v_day, (select id from public.exercises where slug = 'barbell-row'), 1, 3, 8, 12, 90),
    (v_day, (select id from public.exercises where slug = 'barbell-curl'), 2, 3, 8, 12, 60);

  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 6, 'Legs', array(select id from public.muscle_groups where slug in ('legs','glutes','calves')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds) values
    (v_day, (select id from public.exercises where slug = 'squat'), 0, 4, 6, 10, 150),
    (v_day, (select id from public.exercises where slug = 'leg-press'), 1, 3, 10, 15, 90),
    (v_day, (select id from public.exercises where slug = 'calf-raise'), 2, 4, 12, 20, 45);

  -- ============================================================
  -- Torso / Pierna
  -- ============================================================
  insert into public.workout_templates (user_id, name, description, is_public)
  values (v_owner, 'Torso / Pierna', 'Cuatro días: torso y pierna alternos, ideal para 4 días semanales.', true)
  returning id into v_template;

  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 1, 'Torso A', array(select id from public.muscle_groups where slug in ('chest','back','shoulders')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds) values
    (v_day, (select id from public.exercises where slug = 'bench-press'), 0, 4, 6, 10, 120),
    (v_day, (select id from public.exercises where slug = 'barbell-row'), 1, 4, 6, 10, 120),
    (v_day, (select id from public.exercises where slug = 'overhead-press'), 2, 3, 8, 10, 90),
    (v_day, (select id from public.exercises where slug = 'lat-pulldown'), 3, 3, 10, 12, 90),
    (v_day, (select id from public.exercises where slug = 'lateral-raise'), 4, 3, 12, 15, 60);

  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 2, 'Pierna A', array(select id from public.muscle_groups where slug in ('legs','glutes','calves')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds) values
    (v_day, (select id from public.exercises where slug = 'squat'), 0, 4, 6, 10, 150),
    (v_day, (select id from public.exercises where slug = 'leg-curl'), 1, 3, 10, 15, 90),
    (v_day, (select id from public.exercises where slug = 'leg-extension'), 2, 3, 12, 15, 60),
    (v_day, (select id from public.exercises where slug = 'hip-thrust'), 3, 3, 8, 12, 90),
    (v_day, (select id from public.exercises where slug = 'calf-raise'), 4, 4, 12, 20, 45);

  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 3, 'Torso B', array(select id from public.muscle_groups where slug in ('chest','back','biceps','triceps')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds) values
    (v_day, (select id from public.exercises where slug = 'incline-db-press'), 0, 4, 8, 12, 90),
    (v_day, (select id from public.exercises where slug = 'seated-cable-row'), 1, 4, 8, 12, 90),
    (v_day, (select id from public.exercises where slug = 'dips'), 2, 3, 8, 12, 90),
    (v_day, (select id from public.exercises where slug = 'barbell-curl'), 3, 3, 8, 12, 60),
    (v_day, (select id from public.exercises where slug = 'triceps-pushdown'), 4, 3, 10, 15, 60);

  insert into public.workout_template_days (template_id, day_order, name, muscle_group_ids)
  values (v_template, 4, 'Pierna B', array(select id from public.muscle_groups where slug in ('legs','glutes','core')))
  returning id into v_day;
  insert into public.workout_template_exercises (template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds, notes) values
    (v_day, (select id from public.exercises where slug = 'deadlift'), 0, 3, 5, 8, 180, null),
    (v_day, (select id from public.exercises where slug = 'leg-press'), 1, 3, 10, 15, 90, null),
    (v_day, (select id from public.exercises where slug = 'db-lunge'), 2, 3, 10, 12, 90, null),
    (v_day, (select id from public.exercises where slug = 'hanging-leg-raise'), 3, 3, 10, 15, 60, null),
    (v_day, (select id from public.exercises where slug = 'plank'), 4, 3, null, null, 60, 'Aguanta 45-60s por serie');
end $$;
