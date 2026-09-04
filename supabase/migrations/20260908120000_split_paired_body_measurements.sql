-- Limb measurements were stored as one number per limb pair (arm_cm,
-- forearm_cm, thigh_cm, calf_cm), which can't answer the question people
-- actually ask of them — whether the two sides are even. Adds a column per
-- side, plus neck, which was missing entirely.
--
-- Non-destructive: the old columns stay. A single stored "arm_cm" doesn't
-- say which arm was measured, so backfilling it into a side — or into both —
-- would be inventing data. They're left in place, unread by the app, so
-- nothing is lost and a later migration can drop them once any historic
-- values have been dealt with deliberately.
--
-- Genuinely single measurements (waist, chest, hip, neck) stay single.
alter table public.body_measurements
  add column if not exists neck_cm numeric,
  add column if not exists arm_left_cm numeric,
  add column if not exists arm_right_cm numeric,
  add column if not exists forearm_left_cm numeric,
  add column if not exists forearm_right_cm numeric,
  add column if not exists thigh_left_cm numeric,
  add column if not exists thigh_right_cm numeric,
  add column if not exists calf_left_cm numeric,
  add column if not exists calf_right_cm numeric;

comment on column public.body_measurements.arm_cm is
  'Deprecated: superseded by arm_left_cm / arm_right_cm. Kept so no historic value is lost.';
comment on column public.body_measurements.forearm_cm is
  'Deprecated: superseded by forearm_left_cm / forearm_right_cm.';
comment on column public.body_measurements.thigh_cm is
  'Deprecated: superseded by thigh_left_cm / thigh_right_cm.';
comment on column public.body_measurements.calf_cm is
  'Deprecated: superseded by calf_left_cm / calf_right_cm.';
