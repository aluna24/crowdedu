
CREATE TABLE public.intramural_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id text NOT NULL,
  team_name text NOT NULL,
  captain_user_id text NOT NULL,
  captain_name text NOT NULL,
  captain_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.intramural_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teams" ON public.intramural_teams FOR SELECT USING (true);
CREATE POLICY "Anyone can insert teams" ON public.intramural_teams FOR INSERT WITH CHECK (true);

CREATE TABLE public.intramural_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.intramural_teams(id) ON DELETE CASCADE,
  member_name text NOT NULL,
  member_email text NOT NULL,
  invite_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_members_team_id ON public.intramural_team_members(team_id);
CREATE INDEX idx_team_members_token ON public.intramural_team_members(invite_token);

ALTER TABLE public.intramural_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team members" ON public.intramural_team_members FOR SELECT USING (true);
CREATE POLICY "Anyone can insert team members" ON public.intramural_team_members FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.respond_to_invite(p_token uuid, p_response text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member intramural_team_members%ROWTYPE;
BEGIN
  IF p_response NOT IN ('accepted', 'declined') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid response');
  END IF;

  SELECT * INTO v_member FROM intramural_team_members WHERE invite_token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invitation not found');
  END IF;

  IF v_member.status <> 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Already responded', 'status', v_member.status);
  END IF;

  UPDATE intramural_team_members
  SET status = p_response, responded_at = now()
  WHERE invite_token = p_token;

  RETURN json_build_object('success', true, 'status', p_response);
END;
$$;
