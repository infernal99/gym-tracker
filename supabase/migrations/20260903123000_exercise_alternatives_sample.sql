-- "Ejercicios similares" for a handful of well-known clusters, as a proof
-- of concept for the alternatives feature. Full coverage across the library
-- is follow-up work.
do $$
declare
  cluster text[];
  v_slug text;
  ids uuid[];
begin
  cluster := array['bench-press','flat-db-press','smith-bench-press','chest-press-machine'];
  select array_agg(e.id) into ids from public.exercises e where e.slug = any(cluster);
  foreach v_slug in array cluster loop
    update public.exercises e
    set alternative_exercise_ids = (select array_agg(x) from unnest(ids) x where x <> e.id)
    where e.slug = v_slug;
  end loop;

  cluster := array['squat','front-squat','hack-squat','smith-squat','goblet-squat'];
  select array_agg(e.id) into ids from public.exercises e where e.slug = any(cluster);
  foreach v_slug in array cluster loop
    update public.exercises e
    set alternative_exercise_ids = (select array_agg(x) from unnest(ids) x where x <> e.id)
    where e.slug = v_slug;
  end loop;

  cluster := array['pull-up','chin-up','neutral-grip-pull-up','assisted-pull-up','lat-pulldown'];
  select array_agg(e.id) into ids from public.exercises e where e.slug = any(cluster);
  foreach v_slug in array cluster loop
    update public.exercises e
    set alternative_exercise_ids = (select array_agg(x) from unnest(ids) x where x <> e.id)
    where e.slug = v_slug;
  end loop;

  cluster := array['barbell-curl','ez-bar-curl','db-curl','cable-curl'];
  select array_agg(e.id) into ids from public.exercises e where e.slug = any(cluster);
  foreach v_slug in array cluster loop
    update public.exercises e
    set alternative_exercise_ids = (select array_agg(x) from unnest(ids) x where x <> e.id)
    where e.slug = v_slug;
  end loop;

  cluster := array['overhead-press','db-shoulder-press','arnold-press','shoulder-press-machine','standing-overhead-press'];
  select array_agg(e.id) into ids from public.exercises e where e.slug = any(cluster);
  foreach v_slug in array cluster loop
    update public.exercises e
    set alternative_exercise_ids = (select array_agg(x) from unnest(ids) x where x <> e.id)
    where e.slug = v_slug;
  end loop;
end $$;
