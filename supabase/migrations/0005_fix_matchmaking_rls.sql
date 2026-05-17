-- Drop the strict policy
DROP POLICY IF EXISTS "Users can insert themselves" ON public.matchmaking_queue;

-- Create a more permissive policy
CREATE POLICY "Users can insert themselves" 
  ON public.matchmaking_queue FOR INSERT 
  WITH CHECK (true);
