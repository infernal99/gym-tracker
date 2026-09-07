-- Sharing a routine stopped working entirely: every insert into
-- template_shares failed with "infinite recursion detected in policy for
-- relation template_shares" (42P17), and since the action ignores the
-- insert's error, the app reported success and nothing arrived.
--
-- The cycle was introduced by 20260912120000_shared_template_read_access:
--
--   template_shares_insert  ->  reads workout_templates (is the template mine?)
--   workout_templates_select_shared  ->  reads template_shares (was it shared with me?)
--
-- Each policy triggers the other's evaluation. That migration checked
-- template_shares_select for a reference back to workout_templates and found
-- none — but missed that the INSERT policy has one, which closes the loop
-- just as effectively.
--
-- Breaking it with a SECURITY DEFINER function: it runs as the owner, so the
-- lookup inside doesn't re-enter template_shares' policies. Same approach the
-- schema already uses for are_friends().

create or replace function public.template_shared_with_me(p_template_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.template_shares ts
    where ts.template_id = p_template_id
      and ts.shared_with = (select auth.uid())
  );
$function$;

revoke all on function public.template_shared_with_me(uuid) from public;
grant execute on function public.template_shared_with_me(uuid) to authenticated;

drop policy if exists workout_templates_select_shared on public.workout_templates;

create policy workout_templates_select_shared on public.workout_templates
for select using (public.template_shared_with_me(id));
