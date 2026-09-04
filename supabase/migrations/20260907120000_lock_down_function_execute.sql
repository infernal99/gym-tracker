-- Supabase's database linter flagged every SECURITY DEFINER function in the
-- public schema as callable by `anon` and `authenticated`, plus three
-- functions with a mutable search_path. Working through them one by one:
--
--  * The RLS predicate helpers (owns_*, can_view_*, are_friends, is_blocked,
--    is_challenge_participant) are DELIBERATELY left executable. All 90 of
--    this schema's policies apply to PUBLIC, so every policy evaluation —
--    including an anonymous request that should simply match no rows — calls
--    them. Revoking would turn "no rows" into a permission error while
--    buying nothing: they only return a boolean about the caller's own
--    access and leak no data.
--
--  * Trigger functions need no EXECUTE grant at all. Verified directly:
--    revoking every grant and then running an UPDATE as `authenticated`
--    still fires the trigger, because the privilege is checked when the
--    trigger is created, not when it runs.
--
--  * evaluate_achievements and check_exercise_milestones already refuse a
--    p_user_id that isn't auth.uid(), so they only need anon revoked.

-- 1. Pin search_path on the three functions that lacked it, so a caller
--    can't shadow the objects they resolve by prepending a schema.
alter function public.set_updated_at() set search_path = public;
alter function public.calculate_level(integer) set search_path = public;
alter function public.set_exercise_search_text() set search_path = public;

-- 2. Trigger-only functions: not callable as RPCs by anyone.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.set_exercise_search_text() from public, anon, authenticated;
revoke execute on function public.apply_xp_event() from public, anon, authenticated;
revoke execute on function public.recalc_session_volume() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_friend_request_accepted() from public, anon, authenticated;

-- 3. Functions the app calls as a signed-in user: signed out has no business
--    reaching them. (find_user_by_username already returns nothing for anon,
--    since its `p.id <> auth.uid()` is NULL without a session — this makes
--    that accidental safety explicit.)
revoke execute on function public.find_user_by_username(text) from public, anon;
revoke execute on function public.evaluate_achievements(uuid) from public, anon;
revoke execute on function public.check_exercise_milestones(uuid) from public, anon;
revoke execute on function public.ensure_default_rest_day(uuid) from public, anon;
