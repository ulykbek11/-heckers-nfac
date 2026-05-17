-- Drop the incorrect update policy
drop policy if exists "Players can update their rooms" on public.game_rooms;

-- Create the corrected update policy that allows a guest to set themselves as guest
create policy "Players can update their rooms" 
  on public.game_rooms for update 
  using (
    auth.uid() = host_id or 
    auth.uid() = guest_id or 
    (status = 'waiting' and guest_id is null)
  );
