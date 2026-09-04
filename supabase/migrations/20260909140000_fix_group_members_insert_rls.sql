-- group_members_insert's "creator adding themselves" branch checked
-- creator_id via a plain subquery against public.groups — but groups has
-- its own RLS (is_group_member), and at the moment someone is inserting
-- their very first membership row they aren't a member yet, so that
-- subquery sees zero rows and the check always fails. Same trap the
-- owns_template()-style helpers already exist to avoid; this adds one more
-- for the same reason instead of inlining the subquery.
create function public.is_group_creator(p_group_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.groups g
    where g.id = p_group_id and g.creator_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_group_creator(uuid) from anon;

drop policy if exists group_members_insert on public.group_members;
create policy group_members_insert on public.group_members
  for insert with check (
    (user_id = (select auth.uid()) and public.is_group_creator(group_id))
    or (public.is_group_owner(group_id) and public.are_friends((select auth.uid()), user_id))
  );
