-- Almost every read in the app filters completed sessions for one user and
-- orders or ranges them by completed_at: the dashboard's recent window, the
-- weekly summary, insights, the muscle-volume stats, the friends leaderboard.
--
-- The existing workout_sessions_user_idx is (user_id, started_at DESC), which
-- can't serve an ordering on a different column, and
-- workout_sessions_template_completed_idx requires template_id in the
-- predicate, which none of those queries supply. So they all fell back to
-- fetching every session for the user and sorting.
--
-- Partial on completed_at IS NOT NULL because that's exactly the filter these
-- queries use, and it keeps in-progress sessions out of the index.
create index if not exists workout_sessions_user_completed_idx
  on public.workout_sessions (user_id, completed_at desc)
  where completed_at is not null;
