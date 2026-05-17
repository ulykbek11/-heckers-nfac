-- Drop the strict policy
DROP POLICY IF EXISTS "Users can update queue" ON public.matchmaking_queue;

-- Create a more permissive policy for updates
CREATE POLICY "Users can update queue" 
  ON public.matchmaking_queue FOR UPDATE 
  USING (true);
