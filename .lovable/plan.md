## Prevent past-class reservations & set all locations to Multipurpose Room

Three small changes to `src/pages/GroupFitness.tsx` plus a one-time DB update.

### 1. Block past dates in the calendar
Update the `disabled` prop of the `<Calendar />` (line ~283):
```ts
disabled={(date) => date < SEMESTER_START || date > SEMESTER_END || date < startOfToday()}
```
Use `startOfToday` from `date-fns`.

### 2. Block reservations for class times that already passed
- Add a helper that, given the currently `selectedDate` + a class's `time` (e.g. `"7:00 PM"`), returns whether that combined datetime is in the past.
- When `effectiveDay === WEEKDAY_NAMES[selectedDate.getDay()]` AND `selectedDate` is today, treat any class whose time is before `now` as "Past — can't reserve" (replace the Reserve button with a disabled `Past` state, similar to the `Full` state).
- If no specific date is selected (filter is a weekday like "Monday" with no date), don't block based on time — only block when we have a concrete date in context.
- Already-reserved classes still show "Reserved" + Cancel as today (cancellation isn't restricted).

### 3. Set every class location to "Multipurpose Room"
- DB migration: `UPDATE public.fitness_classes SET location = 'Multipurpose Room';`
- Frontend already renders `cls.location`, so the cards will reflect it after the update — no UI code change needed.

### Files touched
- `src/pages/GroupFitness.tsx` — add `startOfToday` import, update calendar `disabled`, add past-time check, render disabled "Past" button when applicable.
- One database migration to update `fitness_classes.location`.

### Note
This is a client-side guard for UX. The reservation RPC (`reserve_class`) doesn't currently validate time, but since classes already happened can't be selected from the UI, this is sufficient for the MVP.