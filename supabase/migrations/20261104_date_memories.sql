-- NANTI: Date Memories (run ONCE in Supabase SQL Editor).
-- This migration is additive: existing pairs, profiles and places remain unchanged.
-- Photos stay in Google Drive; NANTI stores only HTTPS Drive links.

create or replace function public.valid_memory_drive_links(links text[])
returns boolean language sql immutable set search_path = '' as $$
  select links is not null
    and cardinality(links) <= 5
    and not exists (
      select 1 from unnest(links) as u(link)
      where link is null or length(link) > 1000
        or link !~* '^https://drive\.google\.com/'
    );
$$;

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  place_id uuid references public.places(id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  memory_date date not null default current_date,
  mood text not null check (mood in ('Romantic','Happy','Cozy','Exciting','Peaceful','Unexpected')),
  story text not null default '' check (char_length(story) <= 4000),
  drive_links text[] not null default '{}'::text[] check (public.valid_memory_drive_links(drive_links)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists memories_pair_date_idx on public.memories(pair_id, memory_date desc);

-- Prevent pairing a memory with a place owned by a different pair.
create or replace function public.memory_place_in_pair(p_place uuid, p_pair uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_place is null or exists (
    select 1 from public.places where id = p_place and pair_id = p_pair
  );
$$;

create or replace function public.touch_memory_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists memories_touch_updated on public.memories;
create trigger memories_touch_updated before update on public.memories
for each row execute function public.touch_memory_updated_at();

alter table public.memories enable row level security;

drop policy if exists memories_view on public.memories;
create policy memories_view on public.memories for select to authenticated
using (pair_id = (select public.current_pair_id()));

drop policy if exists memories_add on public.memories;
create policy memories_add on public.memories for insert to authenticated
with check (
  pair_id = (select public.current_pair_id())
  and created_by = (select auth.uid())
  and public.memory_place_in_pair(place_id, pair_id)
);

drop policy if exists memories_edit on public.memories;
create policy memories_edit on public.memories for update to authenticated
using (pair_id = (select public.current_pair_id()))
with check (pair_id = (select public.current_pair_id()) and public.memory_place_in_pair(place_id, pair_id));

drop policy if exists memories_remove on public.memories;
create policy memories_remove on public.memories for delete to authenticated
using (pair_id = (select public.current_pair_id()));

revoke all on public.memories from anon, authenticated;
grant select, insert, delete on public.memories to authenticated;
grant update (title, memory_date, mood, story, place_id, drive_links) on public.memories to authenticated;
