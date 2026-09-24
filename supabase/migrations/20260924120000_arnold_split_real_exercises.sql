-- Replaces the generic placeholder exercises on the public "Arnold Split"
-- starter template (id e19a1f45-de3f-438d-a355-fa0b49655870) with the
-- user's real routine. Their day names ("Pecho y Espalda", "Hombros y
-- Brazos", "Piernas") already matched the existing starter's days 1:1, so
-- this replaces that day's content rather than adding a second, confusingly
-- identical "Arnold Split" entry.
--
-- Rest: 180s for every exercise; unilateral ones additionally get 60s
-- between sides. This maps straight onto the schema's own defaults
-- (rest_seconds default 180, rest_between_sides_seconds default 60), so no
-- exercise here overrides either column — the two are written out below
-- only for clarity, not because they differ from what the table would give
-- anyway.
--
-- Substitutions made because the exercise library doesn't have an exact
-- match:
--   "remo hammer para la espalda alta" -> Remo en máquina
--     (no Hammer-Strength-branded machine in the library; generic machine
--     row is the closest equivalent)
--   "tríceps en polea en X"            -> Extensión de tríceps en polea
--     (the crossed-cable "X" pushdown variant isn't modeled separately)
--   "curl predicador unilateral"       -> Curl en Máquina de Predicador
--     (only barbell and machine preacher curls exist; the machine is the
--     one commonly done one arm at a time)
--   "curl en barra Z en polea"         -> Curl en polea
--     (no entry combines an EZ-bar attachment with a cable station)
--   "elevaciones laterales en mancuernas" -> Elevación Lateral con
--     Mancuerna Sentado (no standing dumbbell lateral raise in the
--     library; the seated one is the same movement, same equipment)
--   "gemelos" (unspecified)            -> Elevación de Pantorrillas en
--     Máquina (no plain standing calf-raise machine; this is the closest
--     generic equivalent)
--
-- This is a one-time data migration (DELETE + INSERT with literal values)
-- rather than schema DDL — recorded here so the change has a paper trail
-- and can be re-applied if the target project is ever reset from
-- migrations. Re-running it is idempotent: the DELETE always clears these
-- three days first, so applying it twice yields the same 18 rows, not 36.

delete from public.workout_template_exercises
where template_day_id in (
  'faf5330f-c27f-4a13-8bd4-cb8da36a7826', -- Pecho y Espalda
  '042c14fb-95ea-4dd3-a66b-8ed6d4edba54', -- Hombros y Brazos
  '44b0607c-9c1c-4063-a7e9-2ac1094c9eb1'  -- Piernas
);

-- Pecho y Espalda
insert into public.workout_template_exercises
  (template_day_id, exercise_id, order_index, target_sets, rest_seconds, is_unilateral, rest_between_sides_seconds)
values
  ('faf5330f-c27f-4a13-8bd4-cb8da36a7826', '6e56d345-f2f7-47f5-b77e-15908fedeb03', 0, 3, 180, false, 60), -- Press inclinado en Smith
  ('faf5330f-c27f-4a13-8bd4-cb8da36a7826', '51b2271b-086c-4d5f-b3d1-4455a35ce701', 1, 3, 180, false, 60), -- Remo en máquina
  ('faf5330f-c27f-4a13-8bd4-cb8da36a7826', '75343974-4a14-4f75-ad72-d382e19868fe', 2, 2, 180, false, 60), -- Jalón al pecho
  ('faf5330f-c27f-4a13-8bd4-cb8da36a7826', '9eb11d67-dc36-4c67-a15e-82f5804bcc19', 3, 2, 180, false, 60), -- Pec Deck
  ('faf5330f-c27f-4a13-8bd4-cb8da36a7826', '77c3ac4c-cba9-4e2f-b5d3-d1eb54196fae', 4, 2, 180, true,  60); -- Remo con Mancuerna a Un Brazo

-- Hombros y Brazos
insert into public.workout_template_exercises
  (template_day_id, exercise_id, order_index, target_sets, rest_seconds, is_unilateral, rest_between_sides_seconds)
values
  ('042c14fb-95ea-4dd3-a66b-8ed6d4edba54', 'a93539ec-2656-49fb-89dc-3fce23ed36c3', 0, 3, 180, false, 60), -- Extensión de tríceps en polea
  ('042c14fb-95ea-4dd3-a66b-8ed6d4edba54', '5ed77920-6428-412d-a20f-098b34976abf', 1, 2, 180, true,  60), -- Curl en Máquina de Predicador
  ('042c14fb-95ea-4dd3-a66b-8ed6d4edba54', '6825ab96-fbfd-46fd-91fe-d2894b2d7891', 2, 3, 180, true,  60), -- Elevaciones laterales en polea
  ('042c14fb-95ea-4dd3-a66b-8ed6d4edba54', '8c9846e1-64f3-4382-98db-736fee370064', 3, 3, 180, false, 60), -- Curl en polea
  ('042c14fb-95ea-4dd3-a66b-8ed6d4edba54', 'a9f5e3ce-b520-4335-b097-f0a4d031145b', 4, 3, 180, false, 60), -- Press de Hombros en Máquina
  ('042c14fb-95ea-4dd3-a66b-8ed6d4edba54', 'ec5242e5-6af3-4a54-b129-faf06859ce16', 5, 2, 180, false, 60), -- Elevación Lateral con Mancuerna Sentado
  ('042c14fb-95ea-4dd3-a66b-8ed6d4edba54', '5a7706d6-ac2c-48ae-b5c4-14edfe227456', 6, 2, 180, false, 60), -- Curl martillo
  ('042c14fb-95ea-4dd3-a66b-8ed6d4edba54', '00f54f70-556f-4064-8042-1b968f2ab96f', 7, 3, 180, false, 60); -- Extensión de tríceps en polea por encima de la cabeza

-- Piernas
insert into public.workout_template_exercises
  (template_day_id, exercise_id, order_index, target_sets, rest_seconds, is_unilateral, rest_between_sides_seconds)
values
  ('44b0607c-9c1c-4063-a7e9-2ac1094c9eb1', '9fab8a59-6ab6-4f0e-8b3d-428623613ce6', 0, 3, 180, false, 60), -- Hack squat
  ('44b0607c-9c1c-4063-a7e9-2ac1094c9eb1', 'ce8a4f6b-2885-4c64-a0c1-8a05802c615f', 1, 3, 180, false, 60), -- Curl femoral sentado
  ('44b0607c-9c1c-4063-a7e9-2ac1094c9eb1', '8340450d-8d4a-4772-921d-b67a3b97bc3a', 2, 2, 180, false, 60), -- Extensión de cuádriceps
  ('44b0607c-9c1c-4063-a7e9-2ac1094c9eb1', '994b6c4b-f988-4175-9b70-adb8efe8760f', 3, 2, 180, false, 60), -- Máquina de abductores
  ('44b0607c-9c1c-4063-a7e9-2ac1094c9eb1', '2767d469-d4cd-45fc-9d2e-488c9b9ed17e', 4, 3, 180, false, 60); -- Elevación de Pantorrillas en Máquina
