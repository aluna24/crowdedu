DROP POLICY IF EXISTS "Anyone can update teams" ON public.intramural_teams;
DROP POLICY IF EXISTS "Anyone can delete teams" ON public.intramural_teams;
DROP POLICY IF EXISTS "Anyone can insert teams" ON public.intramural_teams;

CREATE POLICY "Authenticated can insert teams"
  ON public.intramural_teams FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update teams"
  ON public.intramural_teams FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete teams"
  ON public.intramural_teams FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));