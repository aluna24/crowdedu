## Show Capacity Reminder Alert on Staff Home Page

Surface the existing `CapacityReminderAlert` banner on the Home page (`/`) for Employee and Admin users so they see student nudges without navigating to their dashboard.

### Change

**`src/pages/Home.tsx`**
- Import `CapacityReminderAlert` and `useAuth`.
- Read `user?.role` from `useAuth()`.
- If role is `employee` or `admin`, render `<CapacityReminderAlert />` near the top of the container (just above the existing amber announcement banner) so it's the first thing staff see.
- Students will not see the banner on Home (they already have the reminder button on the Capacity page).

The alert auto-hides when there's no active reminder and auto-clears when staff submit a new headcount, since it reads from `GymContext.activeReminder` (already wired with realtime).

### Files
- Edit: `src/pages/Home.tsx`

No DB or context changes needed — all reminder state and realtime sync already exist.
