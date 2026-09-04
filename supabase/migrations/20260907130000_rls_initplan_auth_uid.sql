-- Every policy calling auth.uid() bare re-evaluates it once per row scanned;
-- wrapping it as (select auth.uid()) turns it into an InitPlan Postgres
-- evaluates once per query. Supabase's linter flagged 62 policies here, and
-- it matters most on sets / workout_session_exercises / workout_sessions,
-- where the stats and insights queries scan hundreds of rows at a time.
--
-- Rewritten from the catalog rather than by hand so no policy is missed or
-- retyped wrong, and guarded so re-running it is a no-op.
do $$
declare
  r record;
begin
  for r in
    select c.relname as tbl,
           pol.polname as name,
           replace(pg_get_expr(pol.polqual, pol.polrelid), 'auth.uid()', '(select auth.uid())') as u,
           replace(pg_get_expr(pol.polwithcheck, pol.polrelid), 'auth.uid()', '(select auth.uid())') as w
    from pg_policy pol
    join pg_class c on c.oid = pol.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and (pg_get_expr(pol.polqual, pol.polrelid) like '%auth.uid()%'
        or pg_get_expr(pol.polwithcheck, pol.polrelid) like '%auth.uid()%')
      -- already-wrapped policies render as "( SELECT auth.uid() ...)"
      and coalesce(pg_get_expr(pol.polqual, pol.polrelid), '') not like '%( SELECT auth.uid()%'
      and coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '') not like '%( SELECT auth.uid()%'
  loop
    execute format(
      'alter policy %I on public.%I%s%s',
      r.name, r.tbl,
      case when r.u is not null then ' using (' || r.u || ')' else '' end,
      case when r.w is not null then ' with check (' || r.w || ')' else '' end
    );
  end loop;
end $$;
