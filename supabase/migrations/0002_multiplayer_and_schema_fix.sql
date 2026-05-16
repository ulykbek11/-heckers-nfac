-- Fix profiles table to match frontend expectations
alter table public.profiles 
add column if not exists avatar_url text,
add column if not exists current_streak int default 0,
add column if not exists longest_streak int default 0,
add column if not exists last_played_date text,
add column if not exists unlocked_skins text[] default '{default}',
add column if not exists active_skin text default 'default';

-- Create game_rooms table for multiplayer
create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid references public.profiles(id) not null,
  guest_id uuid references public.profiles(id),
  board_state jsonb not null,
  status text not null default 'waiting', -- 'waiting', 'playing', 'finished'
  current_turn text not null default 'white', -- 'white', 'black'
  winner text, -- 'white', 'black', 'draw'
  timer_setting text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.game_rooms enable row level security;

-- Policies for game_rooms
create policy "Anyone can view rooms" 
  on public.game_rooms for select 
  using (true);

create policy "Authenticated users can create rooms" 
  on public.game_rooms for insert 
  with check (auth.uid() = host_id);

create policy "Players can update their rooms" 
  on public.game_rooms for update 
  using (auth.uid() = host_id or auth.uid() = guest_id);

-- Enable Realtime for game_rooms
begin;
  -- remove the table from the publication if it exists
  alter publication supabase_realtime drop table if exists public.game_rooms;
  -- add the table to the publication
  alter publication supabase_realtime add table public.game_rooms;
commit;
