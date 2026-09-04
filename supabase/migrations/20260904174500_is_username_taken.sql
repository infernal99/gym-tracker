-- Lets the registration form check availability before submitting, even
-- though the visitor isn't authenticated yet (profiles SELECT is privacy-
-- gated, so a plain query wouldn't work here). Returns only a boolean —
-- no profile data leaks through this, unlike find_user_by_username.
create or replace function public.is_username_taken(p_username text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where username = lower(p_username)
  );
$$;

revoke all on function public.is_username_taken(text) from public;
grant execute on function public.is_username_taken(text) to anon, authenticated;
