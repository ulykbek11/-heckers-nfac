-- Create matchmaking_queue table
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.profiles(id) not null,
  elo int not null,
  timer int not null, -- Timer in seconds
  status text not null default 'searching', -- 'searching', 'matched', 'canceled'
  room_code text,
  created_at timestamptz default now()
);

-- Add timer column to game_rooms if it doesn't exist
ALTER TABLE public.game_rooms
ADD COLUMN IF NOT EXISTS timer int;

-- Enable RLS
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Policies for matchmaking_queue
CREATE POLICY "Anyone can view matchmaking queue" 
  ON public.matchmaking_queue FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert themselves" 
  ON public.matchmaking_queue FOR INSERT 
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update queue" 
  ON public.matchmaking_queue FOR UPDATE 
  USING (auth.uid() = player_id OR status = 'searching');
