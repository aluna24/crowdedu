

## Fix selection highlighting + prevent duplicate league registrations

### 1. Pill highlighting (Division / Day / Time)

The `has-[:checked]` Tailwind variant isn't reliably applying with the `sr-only` radio inputs. Switch all three pill groups (division, day, time) — both in the **Register** dialog and the staff **Manage team** dialog — to a controlled approach: compute `isSelected` from React state and apply the highlighted classes directly.

Selected style (clear, high‑contrast):
- `border-primary bg-primary text-primary-foreground ring-2 ring-primary/30 shadow-sm`

Unselected: current `PILL_BASE` (card background, hover accent).

This guarantees the pill turns navy/white the instant it's clicked, regardless of the hidden radio's checked propagation.

### 2. One‑team‑per‑league validation

Rule: a person (captain or member) may not appear on more than one team within the **same sport + same division**. Day/time don't matter. Different divisions of the same sport are fine; different sports are fine.

**Where the check runs** — inside `handleRegister` in `src/pages/Intramurals.tsx`, after Zod parsing and before the insert:

1. Build the set of emails being registered: captain email + every member email (lowercased, trimmed).
2. Query existing teams in the same sport + division:
   ```ts
   supabase
     .from("intramural_teams")
     .select("id, team_name, captain_email, intramural_team_members(member_email, status)")
     .eq("sport_id", selectedSport);
   ```
   Filter client‑side to teams whose parsed `division === chosenDivision` (division lives inside `team_name`, so we can't filter in SQL without a schema change).
3. For each existing team in that league, collect: `captain_email` + every `member_email` whose status is `pending` or `accepted` (declined invites don't block).
4. If any email in our new‑registration set matches any email in the existing‑league set, abort with a toast:
   > "Already registered in this league"
   > "{email} is already on team '{existingTeamName}' in the {division} {sportName} league. A person can only be on one team per league."

5. Same check on the **member side**: if a captain tries to invite someone who's already on another team in that league, block with the same toast naming the conflicting member.

**Also block duplicates within the new team itself** (already partially done for emails — extend to also block the captain's own email appearing in the members list).

### 3. Same validation for staff "Edit slot"

When an employee/admin changes a team's **division** in the Manage Team dialog, run the same check against the team's roster (captain + accepted/pending members) vs. other teams in the new target division. If any conflict, block the save with a clear toast naming the conflicting person and team. Day/time changes (same division) skip the check.

### Files modified
- **`src/pages/Intramurals.tsx`** only.
  - Replace `has-[:checked]` pill styling with controlled `isSelected` className in three radio groups in the Register dialog and three in the Manage Team dialog.
  - Add `checkLeagueConflicts(sportId, division, emails, excludeTeamId?)` helper.
  - Call it in `handleRegister` (excludeTeamId omitted) and in `saveManageSlot` when division changes (excludeTeamId = current team).

### Not changing
- Database schema, RLS, edge functions, routes, invite flow, or any other page.

