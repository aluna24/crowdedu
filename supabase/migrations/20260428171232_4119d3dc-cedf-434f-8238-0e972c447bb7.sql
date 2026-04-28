-- 1. Drop permissive policies on intramural_team_members
DROP POLICY IF EXISTS "Anyone can view team members"   ON public.intramural_team_members;
DROP POLICY IF EXISTS "Anyone can insert team members" ON public.intramural_team_members;
DROP POLICY IF EXISTS "Anyone can update team members" ON public.intramural_team_members;
DROP POLICY IF EXISTS "Anyone can delete team members" ON public.intramural_team_members;
-- RLS remains enabled; with no policies, all direct table access is blocked.

-- 2. Token-scoped invite lookup (used by the accept page)
CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token uuid)
RETURNS TABLE (
  id uuid,
  member_name text,
  member_email text,
  status text,
  team_name text,
  sport_id text,
  captain_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.member_name, m.member_email, m.status,
         t.team_name, t.sport_id, t.captain_name
  FROM public.intramural_team_members m
  JOIN public.intramural_teams t ON t.id = m.team_id
  WHERE m.invite_token = p_token
$$;

-- 3. Captain-scoped roster read
CREATE OR REPLACE FUNCTION public.get_team_roster(
  p_team_id uuid,
  p_captain_user_id text
)
RETURNS TABLE (
  id uuid,
  member_name text,
  member_email text,
  status text,
  invite_token uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.intramural_teams
    WHERE id = p_team_id AND captain_user_id = p_captain_user_id
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
    SELECT m.id, m.member_name, m.member_email, m.status, m.invite_token, m.created_at
    FROM public.intramural_team_members m
    WHERE m.team_id = p_team_id
    ORDER BY m.created_at ASC;
END;
$$;

-- 4. Captain-scoped: add a team member
CREATE OR REPLACE FUNCTION public.add_team_member(
  p_team_id uuid,
  p_captain_user_id text,
  p_member_name text,
  p_member_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_token uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.intramural_teams
    WHERE id = p_team_id AND captain_user_id = p_captain_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  IF p_member_name IS NULL OR length(trim(p_member_name)) = 0
     OR p_member_email IS NULL OR length(trim(p_member_email)) = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Name and email required');
  END IF;

  INSERT INTO public.intramural_team_members (team_id, member_name, member_email)
  VALUES (p_team_id, p_member_name, p_member_email)
  RETURNING id, invite_token INTO v_id, v_token;

  RETURN json_build_object('success', true, 'id', v_id, 'invite_token', v_token);
END;
$$;

-- 5. Captain-scoped: remove a team member
CREATE OR REPLACE FUNCTION public.remove_team_member(
  p_member_id uuid,
  p_captain_user_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
BEGIN
  SELECT team_id INTO v_team_id FROM public.intramural_team_members WHERE id = p_member_id;
  IF v_team_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Member not found');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.intramural_teams
    WHERE id = v_team_id AND captain_user_id = p_captain_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  DELETE FROM public.intramural_team_members WHERE id = p_member_id;
  RETURN json_build_object('success', true);
END;
$$;

-- 6. Captain-scoped: delete entire team (and its members)
CREATE OR REPLACE FUNCTION public.delete_team_with_members(
  p_team_id uuid,
  p_captain_user_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.intramural_teams
    WHERE id = p_team_id AND captain_user_id = p_captain_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  DELETE FROM public.intramural_team_members WHERE team_id = p_team_id;
  DELETE FROM public.intramural_teams WHERE id = p_team_id;
  RETURN json_build_object('success', true);
END;
$$;

-- 7. Admin-scoped: return all teams + their rosters for the admin dashboard
CREATE OR REPLACE FUNCTION public.get_all_rosters_admin(p_user_id uuid)
RETURNS TABLE (
  team_id uuid,
  member_id uuid,
  member_name text,
  member_email text,
  status text,
  invite_token uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(p_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
    SELECT m.team_id, m.id, m.member_name, m.member_email, m.status, m.invite_token, m.created_at
    FROM public.intramural_team_members m
    ORDER BY m.team_id, m.created_at ASC;
END;
$$;

-- 8. Caller's own memberships by email (used by the upcoming-games widget)
CREATE OR REPLACE FUNCTION public.get_my_memberships(p_email text)
RETURNS TABLE (
  team_id uuid,
  sport_id text,
  team_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.sport_id, t.team_name
  FROM public.intramural_team_members m
  JOIN public.intramural_teams t ON t.id = m.team_id
  WHERE m.member_email = p_email
    AND m.status = 'accepted'
$$;

-- 9. Grants (PUBLIC already implicitly has EXECUTE on functions, but be explicit)
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(uuid)             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_roster(uuid, text)           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_team_member(uuid, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_team_member(uuid, text)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_team_with_members(uuid, text)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_rosters_admin(uuid)           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_memberships(text)              TO anon, authenticated;