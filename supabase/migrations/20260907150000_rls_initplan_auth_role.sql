-- Same InitPlan fix as 20260907130000, for the three reference tables whose
-- policies call auth.role() rather than auth.uid() and so weren't matched by
-- that migration's pattern. exercises/muscle_groups/equipment are read on
-- nearly every screen, and the exercise library is the largest table in the
-- schema, so re-evaluating this per row is exactly the case to avoid.
alter policy achievements_select_all on public.achievements
  using ((select auth.role()) = 'authenticated');

alter policy equipment_select_all on public.equipment
  using ((select auth.role()) = 'authenticated');

alter policy muscle_groups_select_all on public.muscle_groups
  using ((select auth.role()) = 'authenticated');
