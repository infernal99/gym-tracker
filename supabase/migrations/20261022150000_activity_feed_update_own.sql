-- Workouts are now logged set by set instead of finished in one go, so the
-- "workout completed" feed entry is written with the first set and its
-- volume kept up to date as more sets come in. That needs owners to be able
-- to update their own feed rows, which nothing allowed until now.
create policy "activity_feed_update" on public.activity_feed
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
