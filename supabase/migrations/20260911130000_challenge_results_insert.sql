-- challenge_results has RLS enabled but no INSERT policy at all, so nothing
-- could ever write to it under the app's normal (non-superuser) role. It's
-- what "quién llega primero" (spec point 19) needs: a durable record of who
-- reached a challenge's target and when, distinct from the live-computed
-- current_value used for the ranking.
create policy challenge_results_insert on public.challenge_results
  for insert with check (
    user_id = (select auth.uid())
    and is_challenge_participant(challenge_id)
  );
