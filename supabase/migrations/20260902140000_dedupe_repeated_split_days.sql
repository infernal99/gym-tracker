-- Arnold Split and Push Pull Legs were seeded with 6 days (each muscle
-- group trained twice a week) by literally duplicating days 4-6 as copies
-- of days 1-3. That's redundant: "next day" sequencing already wraps around
-- the day list, so 3 unique days repeat automatically every other week
-- without needing duplicate rows. Trims every template named either of
-- those (public library + every user's own copy) down to 3 days.
delete from workout_template_days
where day_order > 3
  and template_id in (
    select id from workout_templates where name in ('Arnold Split', 'Push Pull Legs')
  );
