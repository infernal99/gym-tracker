-- Recipients of an in-app routine share couldn't read the routine itself.
--
-- workout_templates_select is "user_id = auth.uid() OR is_public", so for
-- someone a routine was shared with, the embedded workout_templates(name)
-- in listPendingShares() came back null. That function drops rows with no
-- template, so the "Compartidas contigo" list silently rendered empty and
-- the share looked like it had never arrived.
--
-- Being explicitly sent a routine is consent to read it, so grant exactly
-- that. No recursion risk: template_shares_select only tests auth.uid(),
-- it doesn't look at workout_templates.

create policy workout_templates_select_shared on public.workout_templates
for select using (
  exists (
    select 1
    from public.template_shares ts
    where ts.template_id = workout_templates.id
      and ts.shared_with = (select auth.uid())
  )
);
