-- Replaces the 1:1 workout_template_days.weekday column with a proper
-- schedule table: the same day (e.g. "Piernas") needs to recur on several
-- weekdays without duplicating its exercise list, so weekday -> day is
-- many-to-one, not a column on the day itself.
drop index if exists workout_template_days_template_weekday_idx;
alter table public.workout_template_days drop column if exists weekday;

create table public.workout_template_weekday_slots (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  day_id uuid not null references public.workout_template_days (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (template_id, weekday)
);

create index workout_template_weekday_slots_template_idx
  on public.workout_template_weekday_slots (template_id);
create index workout_template_weekday_slots_day_idx
  on public.workout_template_weekday_slots (day_id);

alter table public.workout_template_weekday_slots enable row level security;

create policy "workout_template_weekday_slots_select" on public.workout_template_weekday_slots
  for select using (
    public.owns_template(template_id)
    or exists (select 1 from public.workout_templates t where t.id = template_id and t.is_public)
  );

create policy "workout_template_weekday_slots_insert" on public.workout_template_weekday_slots
  for insert with check (public.owns_template(template_id));

create policy "workout_template_weekday_slots_update" on public.workout_template_weekday_slots
  for update using (public.owns_template(template_id));

create policy "workout_template_weekday_slots_delete" on public.workout_template_weekday_slots
  for delete using (public.owns_template(template_id));

-- Every template gets exactly one built-in rest day going forward, so
-- "Descanso" is always a ready-to-drag option instead of something the
-- user has to create by hand first.
create or replace function public.ensure_default_rest_day(p_template_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_day_id uuid;
  v_next_order int;
begin
  select id into v_day_id
    from workout_template_days
    where template_id = p_template_id and is_rest_day = true
    order by day_order
    limit 1;

  if v_day_id is not null then
    return v_day_id;
  end if;

  select coalesce(max(day_order), 0) + 1 into v_next_order
    from workout_template_days where template_id = p_template_id;

  insert into workout_template_days (template_id, day_order, name, is_rest_day)
    values (p_template_id, v_next_order, 'Descanso', true)
    returning id into v_day_id;

  return v_day_id;
end;
$$;

grant execute on function public.ensure_default_rest_day(uuid) to authenticated;
