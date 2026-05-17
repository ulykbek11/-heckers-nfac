-- Add resign column to game_rooms to track if the game ended via resignation
alter table public.game_rooms 
add column if not exists resign boolean default false;
