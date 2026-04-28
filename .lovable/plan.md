## Goal

Make all intramural team **edits** admin-only. Employees keep read-only staff visibility (browse all teams, view rosters, see approval status) but cannot approve teams, edit playing slots, or remove members.

## Changes

### 1. Frontend — `src/pages/Intramurals.tsx`

- Add a derived flag `isAdmin = user?.role === "admin"` (keep existing `isStaff` for read-only staff visibility).
- Replace every edit-action gate currently using `isStaff` with `isAdmin`:
  - Manage (gear) button next to each team in staff list (~line 1034).
  - Remove-member trash button in roster collapsibles (~line 1051).
  - Approve / Revoke approval row in the Manage dialog (~line 1097).
  - Edit playing slot section and any save/update buttons inside the Manage dialog.
- Keep all browsing/read-only staff features (`isStaff`) intact: viewing all teams, seeing rosters, badges, summaries.
- Update the staff page subtitle (~line 596): employees see "Browse and review all intramural teams." while admins see "Review, approve, and manage all intramural teams."

### 2. Database — RLS hardening on `intramural_teams`

The table currently allows `UPDATE` / `DELETE` by anyone (`USING (true)`). Tighten to:

- **SELECT**: keep public (unchanged) so the read-only staff view and signup UI work.
- **INSERT**: any authenticated user (captains creating teams).
- **UPDATE**: only admins (via `has_role(auth.uid(), 'admin')`).
- **DELETE**: only admins.

This enforces "staff can't edit" at the database layer, not just in the UI. Captains editing their own team is out of scope here — current product flow has admins managing teams post-creation.

```sql
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
```

## Out of scope

- Captain-driven team edits (would require a separate captain-owned policy if reintroduced later).
- Other unrelated permissive RLS warnings on different tables.
