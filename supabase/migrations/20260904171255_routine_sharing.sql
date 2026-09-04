-- Routine sharing: by link (anyone with the unguessable token) and directly
-- with a friend from inside the app. Both funnel through the same token and
-- the same fork RPC, so there's one mechanism, not two.

alter table public.workout_templates
  add column share_token uuid unique;

-- Who a template has been shared with directly (in-app share). Distinct
-- from link sharing: this is "I sent this to you specifically", so it shows
-- up as an inbox item rather than requiring the receiver to have a link.
create table public.template_shares (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  share_token uuid not null,
  shared_by uuid not null references public.profiles(id) on delete cascade,
  shared_with uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (template_id, shared_with)
);

alter table public.template_shares enable row level security;

create policy template_shares_select on public.template_shares
  for select using (
    shared_by = (select auth.uid()) or shared_with = (select auth.uid())
  );

create policy template_shares_insert on public.template_shares
  for insert with check (
    shared_by = (select auth.uid())
    and exists (
      select 1 from public.workout_templates t
      where t.id = template_id and t.user_id = (select auth.uid())
    )
    and public.are_friends(shared_by, shared_with)
  );

-- Either side can remove it: the sender revoking, or the receiver dismissing.
create policy template_shares_delete on public.template_shares
  for delete using (
    shared_by = (select auth.uid()) or shared_with = (select auth.uid())
  );

create index template_shares_shared_with_idx on public.template_shares (shared_with);

-- Narrow, token-gated read: returns nothing unless the token matches
-- exactly, so this never exposes a private routine's contents to anyone
-- browsing the table directly (which a broad "share_token is not null" RLS
-- policy would have allowed for every authenticated user, not just whoever
-- was actually given the link).
create or replace function public.get_shared_template_preview(p_token uuid)
returns table (
  id uuid,
  name text,
  description text,
  owner_display_name text,
  day_count integer,
  exercise_count integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    t.id,
    t.name,
    t.description,
    p.display_name,
    (select count(*)::int from public.workout_template_days d where d.template_id = t.id),
    (select count(*)::int from public.workout_template_exercises e
       join public.workout_template_days d on d.id = e.template_day_id
       where d.template_id = t.id)
  from public.workout_templates t
  join public.profiles p on p.id = t.user_id
  where t.share_token = p_token;
$$;

revoke all on function public.get_shared_template_preview(uuid) from public;
grant execute on function public.get_shared_template_preview(uuid) to authenticated;

-- Clones a shared routine (days + exercises, same scope as the existing
-- "duplicate" action) into the caller's own account. Runs as the function
-- owner so it can read the source regardless of RLS, but only ever writes
-- rows owned by auth.uid(), and only when the token matches — possessing
-- the token is the credential, same trust model as the friend invite link.
create or replace function public.fork_shared_template(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source_id uuid;
  v_source_name text;
  v_source_description text;
  v_new_id uuid;
  v_day record;
  v_new_day_id uuid;
begin
  select id, name, description into v_source_id, v_source_name, v_source_description
  from public.workout_templates
  where share_token = p_token;

  if v_source_id is null then
    raise exception 'invalid_share_token';
  end if;

  insert into public.workout_templates (user_id, name, description)
  values (auth.uid(), v_source_name, v_source_description)
  returning id into v_new_id;

  for v_day in
    select * from public.workout_template_days where template_id = v_source_id order by day_order
  loop
    insert into public.workout_template_days (template_id, day_order, name, is_rest_day, muscle_group_ids)
    values (v_new_id, v_day.day_order, v_day.name, v_day.is_rest_day, v_day.muscle_group_ids)
    returning id into v_new_day_id;

    insert into public.workout_template_exercises (
      template_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max,
      target_weight_kg, target_rir, target_rpe, rest_seconds, notes, is_unilateral, rest_between_sides_seconds
    )
    select
      v_new_day_id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max,
      target_weight_kg, target_rir, target_rpe, rest_seconds, notes, is_unilateral, rest_between_sides_seconds
    from public.workout_template_exercises
    where template_day_id = v_day.id;
  end loop;

  return v_new_id;
end;
$$;

revoke all on function public.fork_shared_template(uuid) from public;
grant execute on function public.fork_shared_template(uuid) to authenticated;
