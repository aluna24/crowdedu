
ALTER TABLE public.intramural_teams
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending';

CREATE POLICY "Anyone can update teams"
ON public.intramural_teams
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete teams"
ON public.intramural_teams
FOR DELETE
TO public
USING (true);

CREATE POLICY "Anyone can update team members"
ON public.intramural_team_members
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete team members"
ON public.intramural_team_members
FOR DELETE
TO public
USING (true);
