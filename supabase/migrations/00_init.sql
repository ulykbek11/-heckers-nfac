-- Users profile (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  city text,
  elo int default 1200,
  coins int default 100,
  streak_current int default 0,
  streak_max int default 0,
  last_played_at date,
  created_at timestamptz default now()
);

-- Game history
create table games (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references profiles(id),
  opponent text, -- 'ai_easy' | 'ai_medium' | 'ai_hard' | uuid for real player
  result text, -- 'win' | 'loss' | 'draw'
  moves_count int,
  duration_seconds int,
  ai_analysis text,
  created_at timestamptz default now()
);
