-- Only the group's leader (owner) decides its challenges/objectives — a
-- regular member can still create their own personal (non-group) challenge,
-- which is why the group_id is null branch is untouched.
drop policy challenges_insert on public.challenges;

create policy challenges_insert on public.challenges
  for insert with check (
    creator_id = (select auth.uid())
    and (group_id is null or is_group_owner(group_id))
  );
