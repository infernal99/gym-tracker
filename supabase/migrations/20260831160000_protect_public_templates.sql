-- The seeded template library (Arnold Split, PPL, Torso/Pierna) happens to
-- be owned by a real user account, so the ownership-only delete policy
-- would let that account delete the shared templates. Public templates are
-- never deletable, only the personal copies made from them.
drop policy "workout_templates_delete" on public.workout_templates;

create policy "workout_templates_delete" on public.workout_templates
  for delete using (user_id = auth.uid() and not is_public);
