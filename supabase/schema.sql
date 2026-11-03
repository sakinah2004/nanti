-- nanti: jalankan satu kali di Supabase SQL Editor.
-- RLS memastikan hanya anggota pasangan yang melihat dan mengubah tempat.
-- Akun harus dibuat melalui Supabase Auth (email + password).

create table if not exists public.pairs (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Partner',
  pair_id uuid references public.pairs(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint display_name_length check (char_length(display_name) between 1 and 40)
);
create index if not exists profiles_pair_id_idx on public.profiles(pair_id);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs(id) on delete cascade,
  saved_by uuid not null references auth.users(id) on delete cascade,
  source_url text not null,
  canonical_url text not null,
  title text not null,
  category text not null default 'Other' check (category in ('Cafe','Restaurant','Activity','Nature','Other')),
  city text not null default '',
  notes text not null default '',
  status text not null default 'want' check (status in ('want','visited')),
  is_favorite boolean not null default false,
  visited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint place_source_http check (source_url ~* '^https?://'),
  constraint place_title_length check (char_length(title) between 1 and 160),
  constraint unique_place_per_couple unique (pair_id, canonical_url)
);
create index if not exists places_pair_created_idx on public.places(pair_id, created_at desc);

create or replace function public.on_user_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'Partner'), 40))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists nanti_auth_user_created on auth.users;
create trigger nanti_auth_user_created after insert on auth.users
for each row execute function public.on_user_created();
-- Berguna jika pengguna telah terdaftar sebelum SQL dijalankan.
insert into public.profiles(id, display_name)
select id, left(coalesce(nullif(trim(raw_user_meta_data->>'display_name'), ''), 'Partner'), 40)
from auth.users on conflict (id) do nothing;

-- SECURITY DEFINER dipakai untuk melihat pair pengguna tanpa membuat policy rekursif.
create or replace function public.current_pair_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select pair_id from public.profiles where id = (select auth.uid()) limit 1;
$$;

create or replace function public.create_pair()
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_pair uuid;
begin
  if (select auth.uid()) is null then raise exception 'Sign in dulu.'; end if;
  -- Lock profil agar permintaan ganda tak dapat membuat dua pasangan.
  perform 1 from public.profiles where id = (select auth.uid()) for update;
  if not found then raise exception 'Profil belum tersedia.'; end if;
  if (select pair_id from public.profiles where id = (select auth.uid())) is not null then
    raise exception 'Kamu sudah bergabung dalam wishlist.';
  end if;
  insert into public.pairs(created_by) values ((select auth.uid())) returning id into v_pair;
  update public.profiles set pair_id = v_pair where id = (select auth.uid());
  return v_pair;
end;
$$;

create or replace function public.join_pair(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_pair uuid; v_count integer;
begin
  if (select auth.uid()) is null then raise exception 'Sign in dulu.'; end if;
  perform 1 from public.profiles where id = (select auth.uid()) for update;
  if not found then raise exception 'Profil belum tersedia.'; end if;
  if (select pair_id from public.profiles where id = (select auth.uid())) is not null then
    raise exception 'Kamu sudah bergabung dalam wishlist.';
  end if;
  -- Lock pair untuk menghindari pasangan ke-3 ketika permintaan bersamaan.
  select id into v_pair from public.pairs
  where invite_code = upper(trim(p_code)) for update;
  if v_pair is null then raise exception 'Kode undangan tidak ditemukan.'; end if;
  select count(*) into v_count from public.profiles where pair_id = v_pair;
  if v_count >= 2 then raise exception 'Wishlist ini sudah memiliki 2 anggota.'; end if;
  update public.profiles set pair_id = v_pair where id = (select auth.uid());
  return v_pair;
end;
$$;

create or replace function public.update_display_name(p_name text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Sign in dulu.'; end if;
  if char_length(trim(p_name)) not between 1 and 40 then raise exception 'Nama harus 1-40 karakter.'; end if;
  update public.profiles set display_name = trim(p_name) where id = (select auth.uid());
end;
$$;

create or replace function public.touch_place_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists places_touch_updated on public.places;
create trigger places_touch_updated before update on public.places
for each row execute function public.touch_place_updated_at();

alter table public.pairs enable row level security;
alter table public.profiles enable row level security;
alter table public.places enable row level security;

drop policy if exists pairs_view on public.pairs;
create policy pairs_view on public.pairs for select to authenticated
using (id = (select public.current_pair_id()));

drop policy if exists profiles_view on public.profiles;
create policy profiles_view on public.profiles for select to authenticated
using (id = (select auth.uid()) or (pair_id is not null and pair_id = (select public.current_pair_id())));

drop policy if exists places_view on public.places;
create policy places_view on public.places for select to authenticated
using (pair_id = (select public.current_pair_id()));

drop policy if exists places_add on public.places;
create policy places_add on public.places for insert to authenticated
with check (pair_id = (select public.current_pair_id()) and saved_by = (select auth.uid()));

drop policy if exists places_edit on public.places;
create policy places_edit on public.places for update to authenticated
using (pair_id = (select public.current_pair_id()))
with check (pair_id = (select public.current_pair_id()));

drop policy if exists places_remove on public.places;
create policy places_remove on public.places for delete to authenticated
using (pair_id = (select public.current_pair_id()));

-- Membatasi hak akses langsung. Pair/profil hanya diubah lewat fungsi terkontrol.
revoke all on public.pairs from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
revoke all on public.places from anon, authenticated;
grant select on public.pairs to authenticated;
grant select on public.profiles to authenticated;
grant select, insert, delete on public.places to authenticated;
grant update (title, category, city, notes, status, is_favorite, visited_at) on public.places to authenticated;

revoke all on function public.current_pair_id() from public;
revoke all on function public.create_pair() from public;
revoke all on function public.join_pair(text) from public;
revoke all on function public.update_display_name(text) from public;
grant execute on function public.current_pair_id() to authenticated;
grant execute on function public.create_pair() to authenticated;
grant execute on function public.join_pair(text) to authenticated;
grant execute on function public.update_display_name(text) to authenticated;

-- Aktifkan live sync pada tabel places (aman dijalankan ulang).
do $$ begin
  if not exists (
    select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='places'
  ) then
    alter publication supabase_realtime add table public.places;
  end if;
end $$;
alter table public.places replica identity full;
