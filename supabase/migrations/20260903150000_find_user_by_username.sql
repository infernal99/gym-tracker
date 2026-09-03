-- Profiles default to profile_visibility = 'friends', which (correctly)
-- keeps them out of general browsing/search. But that same rule was
-- blocking the one thing friend-adding needs: looking a user up by their
-- exact, already-known username to send them a request. This function is a
-- narrow, deliberate exception — exact match only, minimal public fields,
-- never a partial/browsable search — so profile_visibility keeps meaning
-- "browsable" while usernames stay effectively public identifiers, same as
-- most social apps.
create or replace function public.find_user_by_username(p_username text)
returns table (id uuid, username text, display_name text, avatar_url text, level integer)
language sql
security definer
stable
set search_path = public
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.level
  from public.profiles p
  where p.username = lower(p_username)
    and p.id <> auth.uid()
    and not public.is_blocked(auth.uid(), p.id);
$$;

grant execute on function public.find_user_by_username(text) to authenticated;
