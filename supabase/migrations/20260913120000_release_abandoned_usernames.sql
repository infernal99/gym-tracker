-- A signup that was never confirmed and never used still held its username
-- forever. Someone who mistypes their email at signup can never reach that
-- account (the confirmation goes to an address they don't own), and when
-- they try again with the correct email their own username comes back as
-- "ya está en uso" — by the dead account they just made.
--
-- So an abandoned signup now releases its name. Abandoned means all three:
-- never confirmed, never signed in, and older than a day. The grace window
-- matters — without it, someone registering right now could have their
-- username taken out from under them before they finish confirming.
--
-- Nothing is deleted. The stranded profile keeps its row and its data; it
-- only gives up its claim on the name.

create or replace function public.is_username_taken(p_username text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from public.profiles p
    left join auth.users u on u.id = p.id
    where p.username = lower(p_username)
      and coalesce(
        not (
          u.email_confirmed_at is null
          and u.last_sign_in_at is null
          and u.created_at < now() - interval '24 hours'
        ),
        -- A profile with no auth row at all shouldn't exist, but if one
        -- does, call the name taken: the unique index would reject the
        -- insert anyway, and failing the check is the legible way to say so.
        true
      )
  );
$function$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_username text := coalesce(
    new.raw_user_meta_data ->> 'username',
    'user_' || substr(new.id::text, 1, 8)
  );
begin
  -- Release the name first if an abandoned signup is the only thing holding
  -- it, so the insert below can take it. Must agree with the rule in
  -- is_username_taken(), or the pre-flight check and the actual insert would
  -- disagree and the signup would fail with an opaque database error.
  update public.profiles p
  set username = 'liberado_' || substr(p.id::text, 1, 8)
  from auth.users u
  where u.id = p.id
    and p.username = lower(v_username)
    and u.id <> new.id
    and u.email_confirmed_at is null
    and u.last_sign_in_at is null
    and u.created_at < now() - interval '24 hours';

  insert into public.profiles (id, username, display_name, height_cm, initial_weight_kg, date_of_birth, primary_goal)
  values (
    new.id,
    v_username,
    coalesce(new.raw_user_meta_data ->> 'display_name', 'New User'),
    nullif(new.raw_user_meta_data ->> 'height_cm', '')::numeric,
    nullif(new.raw_user_meta_data ->> 'initial_weight_kg', '')::numeric,
    nullif(new.raw_user_meta_data ->> 'date_of_birth', '')::date,
    coalesce((new.raw_user_meta_data ->> 'primary_goal')::public.primary_goal, 'maintain')
  );
  return new;
end;
$function$;
