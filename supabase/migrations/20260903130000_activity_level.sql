-- Activity level, used for the Harris-Benedict calorie calculator (BMR × activity
-- multiplier = TDEE). Collected during onboarding alongside sex/height/weight.
create type public.activity_level as enum (
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active'
);

alter table public.profiles
  add column activity_level public.activity_level not null default 'moderate';
