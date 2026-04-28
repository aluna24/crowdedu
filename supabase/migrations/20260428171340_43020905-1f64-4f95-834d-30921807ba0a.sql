-- Restore working access for logged-in users only.
-- Anonymous users remain blocked from the table (the accept page uses get_invite_by_token).

CREATE POLICY "Authenticated can view team members"
ON public.intramural_team_members
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert team members"
ON public.intramural_team_members
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update team members"
ON public.intramural_team_members
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated can delete team members"
ON public.intramural_team_members
FOR DELETE
TO authenticated
USING (true);