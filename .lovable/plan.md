

## Intramurals — Filter placement, selection styling, staff management view, member notifications

### 1. Registration dialog polish
- **Day** and **Time slot** option pills get a clearly highlighted "selected" state: filled primary background, white text, primary border, plus a subtle ring. Hover stays subtle; selected stays bold. (Today they only get a light tint that's hard to see.)
- League division pills get the same stronger selected styling for consistency.

### 2. League dialog — filters above schedule
Reorder the league dialog content top‑to‑bottom:
1. Season/format/deadline/capacity summary
2. Season timeline strip
3. **Filters (League / Day / Time)** ← moved up
4. Schedule list (already filtered)
5. Registered teams list (already filtered)

### 3. Role‑based intramural page (student vs employee/admin)

Reuse the existing `useAuth().user.role` (`student` / `employee` / `admin`).

**Students** — unchanged: see "My Teams" + sport cards with **Register** + **View league**.

**Employees & admins** — same page, but a **Manage mode**:
- The page header subtitle becomes "Manage teams, rosters, and schedules."
- The "My Teams" section is replaced by a **Manage Teams** section listing **all** teams across all sports (loaded from `intramural_teams`), grouped by sport. Each team row shows division/day/time badges + member count.
- Sport cards **hide** the Register button entirely. Only **View league** remains.
- A new **Manage team** dialog opens from each team row with these controls:
  - **Approval**: toggle a team's approval status (Pending → Approved). Approved status displayed as a badge; pending teams highlighted.
  - **Edit slot**: change division / day / time using the same 3‑pill picker. On save, re‑encode `team_name` and notify all members (see §4).
  - **Remove member**: trash icon next to each roster row.
  - **Delete team**: destructive button at the bottom, removes the team and all its members.
- The View League dialog also gets inline "Remove team" buttons when the viewer is staff.

**Database changes** (one migration):
- Add `approval_status text not null default 'pending'` to `intramural_teams` (values: `pending`, `approved`).
- Add UPDATE and DELETE RLS policies on `intramural_teams` and `intramural_team_members` (permissive, matching existing project pattern — auth gating happens client‑side via role until proper auth is wired).

### 4. Schedule‑change notifications to members
When staff edits a team's day/time (or division), after the DB update the page calls `send-transactional-email` once per member (any status) with a new template `intramural-schedule-update`:
- Subject: "Schedule updated for {teamName}"
- Body: old slot → new slot, sport name, captain name.
- Idempotency key includes the new slot string so re‑saves don't dedupe to the original send.
- A new edge function template file is added under `supabase/functions/send-transactional-email/` template registry (or whichever pattern the existing `intramural-invite` template uses — the same mechanism is reused).

### 5. Home page game reminders for signed‑up users
Add a **Upcoming Intramural Games** card at the top of `src/pages/Home.tsx` (between the hero and the feature grid), shown only when the logged‑in user is on at least one team with an upcoming game.

**How "upcoming" is computed (client‑side, no schema changes):**
- Fetch teams where the user is captain (`captain_user_id = user.id`) **or** a member (`member_email = user.email` with `status = 'accepted'`).
- For each team, parse division/day/time from `team_name` and combine with the sport's `seasonStart` to project the next weekly occurrence whose end time (start + 60 min, configurable) is at least **30 minutes in the past** before being hidden. So a 7:00 PM Monday game stays on the home page until 7:30 PM that Monday, then the next week's instance takes over.
- Stop showing the reminder entirely once the season's playoff window ends (>3 weeks past `seasonStart`, treated as no scheduled regular‑season game; tournaments use their single date).

**Reminder card content** (one row per upcoming game, sorted by soonest):
- Sport name + team name
- Day, date, and time (e.g., "Monday, Apr 27 · 7:00 PM")
- A countdown chip: "Today · in 2h 15m", "Tomorrow", "In 3 days"
- A "View team" link that scrolls to `/intramurals` and opens the team's league dialog
- A subtle highlight (primary tint) when the game is within 24h

The card auto‑refreshes every 60 seconds so the countdown stays accurate and games disappear at the +30 min mark without a page reload.

### Files modified

- **`src/pages/Intramurals.tsx`** — selection styling, filter reorder, role‑gated UI (hide Register for staff, render Manage Teams + Manage Team dialog), schedule‑update email trigger.
- **`src/pages/Home.tsx`** — new Upcoming Games card with 60s refresh and +30 min cutoff logic.
- **`supabase/functions/send-transactional-email/`** — register a new `intramural-schedule-update` template alongside the existing `intramural-invite` one.
- **DB migration** — `approval_status` column on `intramural_teams`; UPDATE/DELETE RLS policies on `intramural_teams` and `intramural_team_members`.

### Not changing
- Auth model, routing, capacity/fitness features, existing invite flow, visual style of unrelated cards.

