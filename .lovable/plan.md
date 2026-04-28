## Reservations Page (Read-only Calendar Grid)

A new student-facing page at `/reservations` that displays all gym spaces in a calendar grid (rows = spaces, columns = hourly time slots), styled like the reference screenshot.

### What students will see
- Page header "Facility Scheduling" with date navigation (prev day, today, next day) and a date picker.
- A grid:
  - **Rows**: every space from `FLOOR_DB_MAP` plus extra spaces shown in the screenshot (Basketball Courts #1–#4, Squash Courts #1–#6, 3M Squash Court, Racquetball Court, Varsity Place, Lobby, MVC Field, Smith Center Aux Gym, Smith Center Pool, Personal Training Room, Conference Room).
  - **Columns**: hourly slots from 6 AM to 10 PM.
  - **Bookings**: colored blocks (e.g., red = varsity, green = club practice, pink = group fitness, blue = training, orange = academic, teal = community) spanning the booked time range with the event/team name.
- View toggle in top-right: Day / Week / Month / Space (Day will be the functional default; others can show "Coming soon" for MVP).
- Closed/unavailable cells render with an "X" pattern (matching the screenshot's Pool/closed rows).

### Data
For MVP, reservations are stored client-side as a static seed list (mock data) covering today so the page matches the look of the screenshot. This keeps scope tight and avoids building a booking management system. A follow-up plan can introduce a `facility_reservations` table + staff CRUD UI.

Seed shape:
```ts
{ id, space, title, startMin, endMin, color, day }
```

### Files to create
- `src/pages/Reservations.tsx` — page + grid layout
- `src/components/ReservationsGrid.tsx` — grid rendering (rows/columns, blocks positioned by time)
- `src/data/reservationsSeed.ts` — mock reservation entries + space list + color map

### Files to edit
- `src/App.tsx` — add `<Route path="/reservations" element={<Reservations />} />`
- `src/components/Header.tsx` — add a "Reservations" link (CalendarDays icon) to `publicLinks`

### Layout/technical notes
- Grid implemented with CSS grid: a sticky left column for space names, a horizontally scrollable area for the time columns.
- Each reservation block is absolutely positioned within its row using `left = (startMin - 360)/(16*60) * 100%` and `width = (end-start)/(16*60) * 100%`.
- Mobile: horizontal scroll on the time area; space-name column stays sticky.
- Colors via Tailwind utility classes mapped from a `color` key (red/green/blue/pink/orange/teal/yellow/black).
- Date navigation updates a local `selectedDate` state; seed data is filtered by weekday for now.

### Out of scope (can be follow-ups)
- Creating/editing reservations from the UI
- Real-time sync from a `facility_reservations` Supabase table
- Week/Month/Space alternate views (placeholders only)
