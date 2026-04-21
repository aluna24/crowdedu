

## Intramurals — League × Time Slots, Season Schedule, My Teams on top

Keep the current layout intact. Make schedules richer (per-day, per-time slot), let users pick a specific time when registering, surface the user's teams at the top of the page, and add a season timeline (weekly play → playoffs after week 3).

### 1. Per-sport league × day × time slot schedule

Rebuild `mockSports[].schedules` so every league sport offers all three divisions, each with the requested days and per-hour time slots. Each slot is independently selectable at registration. Example shape:

```ts
schedules: [
  { division: "Women's", day: "Sunday",    times: ["5:00 PM", "6:00 PM"] },
  { division: "Men's",   day: "Monday",    times: ["6:00 PM","7:00 PM","8:00 PM","9:00 PM"] },
  { division: "Men's",   day: "Wednesday", times: ["6:00 PM","7:00 PM","8:00 PM","9:00 PM"] },
  { division: "Men's",   day: "Thursday",  times: ["6:00 PM","7:00 PM","8:00 PM","9:00 PM"] },
  { division: "Co-ed",   day: "Sunday",    times: ["7:00 PM"] },
  { division: "Co-ed",   day: "Tuesday",   times: ["6:00 PM","7:00 PM","8:00 PM","9:00 PM"] },
]
```

Apply to each league sport (Basketball, Volleyball, Indoor Soccer). Tournaments (Badminton, Dodgeball) keep their single co-ed slot.

### 2. Season timeline (weekly + playoffs)

Add a `seasonStart` date per sport. Derive in code:

- **Regular season**: weekly on the chosen day/time, starting `seasonStart`
- **Playoffs**: starts `seasonStart + 21 days` (3 weeks later)

Show this in the View League dialog as a small "Season" card:

```
Season starts: Apr 6 · Regular season: weekly · Playoffs: Apr 27
```

### 3. Registration: pick league + day + time

Replace the current Division radio with a 3-step picker inside the existing dialog (no new dialog, no layout shift):

1. **League** — radio: Men's / Women's / Co-ed (filtered to those offered for the sport)
2. **Day** — radio chips, only days the chosen league plays
3. **Time slot** — radio chips, only times offered for that league+day

The selected `division`, `day`, `time` get prefixed onto `team_name` as `[Men's · Mon 7:00 PM] The Dunkers` so it persists without a schema change. `parseTeamName` is updated to extract all three back out.

### 4. My Teams moved to top

Move the existing `My Teams` section so it renders **above** the sports grid (right under the page header, before the login banner / sport cards). Keep its current card layout, roster list, and status badges exactly as-is. Each team card now also shows its slot:

```
[Men's]  Mondays · 7:00 PM  · weekly
```

### 5. View League dialog updates

- Schedule list shows every `division → day → time` row (one per slot).
- Filters expand: **League**, **Day**, plus a new **Time** filter (auto-populated from the selected day).
- Team rows show the parsed division **and** their slot (`Mon 7:00 PM`) as small badges next to the team name.
- Filtering by day/time now correctly matches teams to their stored slot.

### Files modified

- **`src/pages/Intramurals.tsx`** — only file touched. Schedule data, registration dialog picker, `parseTeamName` extended, My Teams section moved to top, league dialog filters + per-team slot display, season timeline card.

### Not changing

- Database schema, RLS, edge functions, routes, invite/accept flow, visual style of any existing card or dialog.

