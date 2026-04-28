# Fix: Member emails & invite tokens publicly exposed

## The problem

`intramural_team_members` currently has wide-open RLS (`USING true`, `WITH CHECK true`) for SELECT/INSERT/UPDATE/DELETE. That means any anonymous visitor can:

- list every member's `member_email`,
- read every `invite_token` (and accept invites on someone else's behalf),
- delete or rewrite any team's roster.

## Constraint that shapes the fix

This project uses **mock authentication** (per project memory). User IDs are stored as `text` (e.g. `captain_user_id text`) and `auth.uid()` is `NULL` in the database. That means we can't write the "textbook" `auth.uid() = captain_user_id` policies — they'd just block everyone, including legitimate captains.

The fix therefore needs to:

1. Block bulk anonymous reads of the member table.
2. Keep the single-invite "accept page" working for unauthenticated invitees (they only have a token).
3. Keep captains' roster management working from the client.

## Plan

### 1. Tighten RLS on `intramural_team_members`

Drop the four "Anyone can …" policies and replace with:

- **SELECT**: deny direct selects from `anon`/`authenticated`. (Reads will go through joins from `intramural_teams` only when needed, and through a new RPC for the accept page — see step 2.)
  - Practically: simply do not create a SELECT policy. With RLS enabled and no policy, all direct selects are blocked.
- **INSERT / UPDATE / DELETE**: also no broad policies. All writes go through `SECURITY DEFINER` RPCs (step 3), which bypass RLS safely.

Effect: `select * from intramural_team_members` from the browser returns 0 rows for everyone. Emails and tokens are no longer harvestable.

### 2. New RPC: `get_invite_by_token(p_token uuid)`

Lets the accept page (`src/pages/IntramuralAccept.tsx`) fetch exactly one invite when the user already holds the token, without exposing the rest of the table.

Returns only the fields the page actually renders:
`id, member_name, member_email, status, team_name, sport_id, captain_name`.

Marked `SECURITY DEFINER`, `STABLE`, `search_path = public`. Granted EXECUTE to `anon, authenticated`.

### 3. New RPCs for captain-side roster management

Replace the direct `.from("intramural_team_members").insert/delete()` calls in `src/pages/Intramurals.tsx` with RPCs that take the mock `captain_user_id` and verify it matches the team's captain before mutating:

- `add_team_member(p_team_id uuid, p_captain_user_id text, p_member_name text, p_member_email text)` → inserts a pending member, returns the new row + invite token to the captain.
- `remove_team_member(p_member_id uuid, p_captain_user_id text)` → deletes one member if the caller is that team's captain.
- `delete_team_with_members(p_team_id uuid, p_captain_user_id text)` → deletes the team and its members in one transaction (used by the existing "delete team" flow which currently does two separate deletes).

Each RPC checks `intramural_teams.captain_user_id = p_captain_user_id` and raises if not. `SECURITY DEFINER`, `search_path = public`.

The existing `respond_to_invite(p_token, p_response)` RPC already follows this pattern and stays unchanged.

### 4. Keep the roster visible to the captain in the UI

The current code reads members via a join from `intramural_teams`:
```
.from("intramural_teams").select("…, intramural_team_members(id, member_name, member_email, status)")
```
With RLS blocking direct selects on `intramural_team_members`, this join also returns no nested rows. To keep captains' "Manage Team" view working, add one more RPC:

- `get_team_roster(p_team_id uuid, p_captain_user_id text)` → returns the team's members only if the caller is the captain.

The two places that currently render rosters (the captain's "My Teams" list and the admin "All Teams" list) will call this RPC per team they own / manage.

For the admin view that shows every team's roster, add a parallel `get_all_rosters_admin(p_user_id text)` that checks the caller has the `admin` role via `has_role()` before returning everything. (Admin status is already tracked in `user_roles` and the mock-auth user's UUID is stored there.)

### 5. Update the frontend

Files that need edits:

- `src/pages/IntramuralAccept.tsx` — replace the direct select with `supabase.rpc("get_invite_by_token", { p_token: token })`.
- `src/pages/Intramurals.tsx` — replace direct inserts/deletes on `intramural_team_members` with the new RPCs; replace the nested-select roster reads with `get_team_roster` / `get_all_rosters_admin`.
- `src/components/UpcomingGames.tsx` — this reads the caller's own accepted memberships by `member_email`. Add a small RPC `get_my_memberships(p_email text)` and call it instead of selecting directly. (Or expand the existing logic to use a captain/email-scoped RPC.)

No schema column changes are required — only policies, new functions, and client call sites.

## Technical details

```sql
-- Drop permissive policies
DROP POLICY "Anyone can view team members"   ON public.intramural_team_members;
DROP POLICY "Anyone can insert team members" ON public.intramural_team_members;
DROP POLICY "Anyone can update team members" ON public.intramural_team_members;
DROP POLICY "Anyone can delete team members" ON public.intramural_team_members;
-- RLS stays ENABLED. No replacement policies → all direct table access blocked.

-- Example new RPC
CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token uuid)
RETURNS TABLE (
  id uuid, member_name text, member_email text, status text,
  team_name text, sport_id text, captain_name text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.member_name, m.member_email, m.status,
         t.team_name, t.sport_id, t.captain_name
  FROM intramural_team_members m
  JOIN intramural_teams t ON t.id = m.team_id
  WHERE m.invite_token = p_token
$$;
```

Plus the captain-scoped RPCs described in steps 3 and 4, each guarded by:
```sql
IF NOT EXISTS (
  SELECT 1 FROM intramural_teams
  WHERE id = p_team_id AND captain_user_id = p_captain_user_id
) THEN
  RAISE EXCEPTION 'Not authorized';
END IF;
```

## Result

- Anonymous bulk reads of member emails and invite tokens → blocked.
- Invite-accept page → still works (token-scoped RPC).
- Captains → still manage their own rosters (captain-scoped RPCs).
- Admins → still see everything (role-checked RPC).
- The security finding `intramural_team_members_public_email_exposure` will be resolved.
