
The user wants two new capabilities on the Group Fitness page:
1. **Cancel a reservation** — refund the class to the pass and decrement enrollment
2. **Calendar/weekly browsing** — pick a date from a month-view calendar; schedule shows that day's classes

Current schema stores classes as recurring weekly slots (`day` = "Monday"), no dates. So selecting a date = filter classes by that date's weekday. Semester runs Jan 19 – May 8, 2026, so dates outside that range should be disabled in the calendar.

Cancellation needs an atomic backend op (mirror of `reserve_class`): lock pass + class, delete reservation, decrement `current_enrolled`, increment `classes_remaining` (or reactivate if exhausted), skip refund for semester passes. Need a new `cancel_reservation` RPC + DELETE RLS policy on `class_reservations` + UPDATE policy on `fitness_classes` (currently locked down — RPC runs SECURITY DEFINER so it bypasses RLS, so actually no policy change needed for the table itself, but the RPC must exist).

# Plan: Cancel reservations + calendar-based browsing

## 1. Backend — `cancel_reservation` RPC (migration)
New PL/pgSQL function `cancel_reservation(p_user_id text, p_reservation_id uuid)`:
- Lock reservation row, verify it belongs to the user
- Lock the linked class and pass rows
- Decrement `fitness_classes.current_enrolled`
- If pass `classes_remaining` is not null: increment by 1, set status back to `active`
- Delete the reservation
- Return `{ success, error? }`
- `SECURITY DEFINER` so it bypasses RLS like `reserve_class` does

## 2. Frontend — `src/pages/GroupFitness.tsx`

**Calendar picker (month view)**
- Add a shadcn `Calendar` (Popover-triggered button showing selected date) at the top of the schedule section
- Default selection: today (clamped to the Jan 19 – May 8, 2026 range; falls back to Jan 19 if outside)
- Disable dates outside the semester range
- Selecting a date sets the day filter to that date's weekday and shows that day's classes
- Keep the existing day-of-week pill buttons as a quick filter; selecting a pill clears the specific date and shows all classes for that weekday across the semester
- Add a small header above the class list: "Classes for Monday, Feb 2" when a specific date is picked, or "All [Day] classes" when using the pill filter

**Cancel button on reserved classes**
- For classes the user has reserved, replace the disabled "Reserved" badge with a "Reserved ✓" label + a small "Cancel" button (outline/destructive)
- Click → confirm via `AlertDialog` → call `cancel_reservation` RPC
- On success: remove from `reservedClassIds`, decrement local `current_enrolled`, refresh passes, toast confirmation

## 3. Files
- **New migration**: `cancel_reservation` function
- **Modified**: `src/pages/GroupFitness.tsx` — add Calendar popover, date-aware filtering, Cancel button + confirm dialog, wire `cancel_reservation` RPC

## Notes
- No schema changes — only a new function
- Calendar uses existing `@/components/ui/calendar` + `popover` + `alert-dialog` shadcn components (all present)
- Semester window enforced both in calendar `disabled` prop and as a constant at the top of the file
