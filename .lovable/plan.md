
## Intramurals — Keep current UI, add league details + roster viewing

The Intramurals page already lists sports as cards with the registration dialog and "My Teams" section. This adds two enhancements without changing that visual layout:

### 1. League details view
- Each sport card gets a **"View league"** button alongside the existing Register / Registered button.
- Clicking opens a dialog (matching current dialog style) showing:
  - Sport name, season, type (League/Tournament), registration deadline
  - Teams registered count
  - **All registered teams in this league** — fetched from `intramural_teams` filtered by `sport_id`, listed with team name, captain name, and member count
  - Click a team in the list to expand and see its **roster** (member name + accepted/pending/declined status badge)

### 2. Roster viewing in "My Teams"
- The current "My Teams" cards already list members with status badges — keep as-is.
- Add a small **member count summary** ("8 members · 5 accepted · 3 pending") at the top of each team card for quick scanning.

### Data
No schema changes. RLS already allows public SELECT on `intramural_teams` and `intramural_team_members`, so the league dialog can fetch all teams + rosters for a chosen sport.

### Files modified
- **`src/pages/Intramurals.tsx`** — add `View league` button per card, new league-details dialog with team list and expandable rosters, member count summary on My Teams cards.

No changes to: registration flow, invite emails, acceptance page, database, or routing.
