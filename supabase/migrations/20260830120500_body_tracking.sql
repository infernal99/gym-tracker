create type public.photo_angle as enum ('front', 'side', 'back');

create table public.body_weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  weight_kg numeric(5, 1) not null,
  recorded_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now()
);

create index body_weight_entries_user_idx on public.body_weight_entries (user_id, recorded_at desc);

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  recorded_at date not null default current_date,
  waist_cm numeric(5, 1),
  chest_cm numeric(5, 1),
  arm_cm numeric(5, 1),
  forearm_cm numeric(5, 1),
  thigh_cm numeric(5, 1),
  calf_cm numeric(5, 1),
  hip_cm numeric(5, 1),
  created_at timestamptz not null default now()
);

create index body_measurements_user_idx on public.body_measurements (user_id, recorded_at desc);

-- Progress photos are always private (section 16/38) — no friends-visibility
-- toggle exists for this table, unlike weight/PRs/sessions.
create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  angle public.photo_angle not null,
  storage_path text not null,
  taken_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index progress_photos_user_idx on public.progress_photos (user_id, taken_at desc);

alter table public.body_weight_entries enable row level security;
alter table public.body_measurements enable row level security;
alter table public.progress_photos enable row level security;

create policy "body_weight_entries_select" on public.body_weight_entries
  for select using (
    user_id = auth.uid() or (
      public.are_friends(auth.uid(), user_id)
      and exists (select 1 from public.profiles where id = user_id and weight_visibility = 'friends')
    )
  );

create policy "body_weight_entries_insert" on public.body_weight_entries
  for insert with check (user_id = auth.uid());

create policy "body_weight_entries_update" on public.body_weight_entries
  for update using (user_id = auth.uid());

create policy "body_weight_entries_delete" on public.body_weight_entries
  for delete using (user_id = auth.uid());

create policy "body_measurements_select" on public.body_measurements
  for select using (user_id = auth.uid());

create policy "body_measurements_insert" on public.body_measurements
  for insert with check (user_id = auth.uid());

create policy "body_measurements_update" on public.body_measurements
  for update using (user_id = auth.uid());

create policy "body_measurements_delete" on public.body_measurements
  for delete using (user_id = auth.uid());

create policy "progress_photos_select" on public.progress_photos
  for select using (user_id = auth.uid());

create policy "progress_photos_insert" on public.progress_photos
  for insert with check (user_id = auth.uid());

create policy "progress_photos_delete" on public.progress_photos
  for delete using (user_id = auth.uid());

-- ============================================================
-- Storage: private bucket for progress photos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy "progress_photos_storage_select" on storage.objects
  for select using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progress_photos_storage_insert" on storage.objects
  for insert with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "progress_photos_storage_delete" on storage.objects
  for delete using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
