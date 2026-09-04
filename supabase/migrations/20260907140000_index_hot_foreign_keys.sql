-- Supabase's linter reports 16 foreign keys without a covering index. Most
-- are already served for the queries this app actually runs, so only the
-- three that aren't get an index here — every extra index is write cost and
-- storage on tables that are written far more often than they're scanned
-- this way.
--
-- Skipped, and why:
--   exercise_notes / exercise_favorites (exercise_id) — their PK is
--     (user_id, exercise_id), which covers every lookup the app makes; the
--     bare FK direction only matters when deleting an exercise.
--   user_achievements (achievement_id) — covered by user_idx and the
--     (user_id, achievement_id) unique for reads; the FK direction only
--     matters when deleting an achievement.
--   personal_records (exercise_id) — covered by
--     (user_id, exercise_id, record_type).
--   workout_sessions (template_id) — covered by
--     (user_id, template_id, completed_at), and the app always filters by
--     user_id alongside it.
--   profiles, blocked_users, challenges, challenge_results, reactions,
--     workout_templates (forked_from_id) — tiny tables, or never filtered
--     on that column.

-- getPreviousSessionForDay filters on template_day_id to compare a session
-- against the last time the same routine day was trained.
create index if not exists workout_sessions_template_day_idx
  on public.workout_sessions (template_day_id, started_at desc)
  where template_day_id is not null;

-- getPrSetIds resolves which of a session's sets are PRs with
-- `.in("session_set_id", ...)`, which had no index at all.
create index if not exists personal_records_session_set_idx
  on public.personal_records (session_set_id)
  where session_set_id is not null;

-- listIncomingRequests filters on (receiver_id, status). The only existing
-- index is a partial unique with sender_id leading, so it can't serve this.
create index if not exists friend_requests_receiver_idx
  on public.friend_requests (receiver_id, status);
