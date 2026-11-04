-- Additive migration for NANTI: covers, map pins, and private Drive photo metadata.
alter table public.places
  add column if not exists cover_url text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'places_cover_url_https') then
    alter table public.places add constraint places_cover_url_https
      check (cover_url is null or (char_length(cover_url) <= 1800 and cover_url ~* '^https://'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'places_lat_lng_valid') then
    alter table public.places add constraint places_lat_lng_valid
      check ((latitude is null and longitude is null) or
             (latitude between -90 and 90 and longitude between -180 and 180));
  end if;
end $$;
grant update (cover_url, latitude, longitude) on public.places to authenticated;

alter table public.profiles
  add column if not exists google_drive_email text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_drive_email_valid') then
    alter table public.profiles add constraint profiles_drive_email_valid
      check (google_drive_email is null or
        (char_length(google_drive_email) <= 250 and google_drive_email ~* '^[^ ]+@[^ ]+\.[^ ]+$'));
  end if;
end $$;
drop policy if exists profiles_drive_email_edit on public.profiles;
create policy profiles_drive_email_edit on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
grant update (google_drive_email) on public.profiles to authenticated;

-- Composite FK enforces photo and memory belong to the same couple.
create unique index if not exists memories_id_pair_idx on public.memories(id, pair_id);
create table if not exists public.memory_photos (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null,
  pair_id uuid not null,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  drive_file_id text not null check (char_length(drive_file_id) between 10 and 255 and drive_file_id ~ '^[A-Za-z0-9_-]+$'),
  file_name text not null default 'memory-photo' check (char_length(file_name) between 1 and 255),
  mime_type text not null default 'image/jpeg' check (mime_type in ('image/jpeg','image/png','image/webp','image/heic','image/heif')),
  created_at timestamptz not null default now(),
  constraint memory_photos_memory_pair_fk foreign key(memory_id,pair_id) references public.memories(id,pair_id) on delete cascade,
  constraint memory_photos_unique_file unique(memory_id,drive_file_id)
);
create index if not exists memory_photos_pair_memory_idx on public.memory_photos(pair_id,memory_id);
alter table public.memory_photos enable row level security;

drop policy if exists memory_photos_view on public.memory_photos;
create policy memory_photos_view on public.memory_photos for select to authenticated
using (pair_id = (select public.current_pair_id()));
drop policy if exists memory_photos_insert on public.memory_photos;
create policy memory_photos_insert on public.memory_photos for insert to authenticated
with check (pair_id = (select public.current_pair_id()) and uploaded_by = (select auth.uid()));
drop policy if exists memory_photos_delete on public.memory_photos;
create policy memory_photos_delete on public.memory_photos for delete to authenticated
using (pair_id = (select public.current_pair_id()));
revoke all on public.memory_photos from anon, authenticated;
grant select,insert,delete on public.memory_photos to authenticated;

-- App only needs the authenticated user's pair metadata, never blanket anonymous access.
-- Avoid a public SECURITY DEFINER RPC that could reveal other couples' places.
alter function public.memory_place_in_pair(uuid,uuid) security invoker;
revoke all on function public.memory_place_in_pair(uuid,uuid) from public, anon, authenticated;
grant execute on function public.memory_place_in_pair(uuid,uuid) to authenticated;

do $$ begin
  if not exists(select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='memories') then
    alter publication supabase_realtime add table public.memories;
  end if;
end $$;
