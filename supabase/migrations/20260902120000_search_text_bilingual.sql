-- Bilingual search support: alternate_names column already existed; this adds
-- a maintained search_text column (lower(name + alternate_names)) via trigger
-- so both Spanish and English exercise names are searchable.
alter table public.exercises add column if not exists search_text text;

create or replace function public.set_exercise_search_text()
returns trigger
language plpgsql
as $$
begin
  new.search_text := lower(new.name || ' ' || array_to_string(coalesce(new.alternate_names, '{}'), ' '));
  return new;
end;
$$;

drop trigger if exists exercise_search_text_trigger on public.exercises;
create trigger exercise_search_text_trigger
before insert or update of name, alternate_names on public.exercises
for each row execute function public.set_exercise_search_text();

update public.exercises set search_text = lower(name || ' ' || array_to_string(coalesce(alternate_names, '{}'), ' '));
