# Capacity Update Reminder Button

Add a student-facing "Remind staff to update capacity" button on the Capacity page that's globally shared (one press disables it for everyone) and surfaces a notification to staff/admin until they submit a new headcount.

## Behavior

**Button states (student view, Capacity page):**
- **Hidden** if the latest `facility_count` row was inserted within the past hour.
- **Enabled** if no update in the past hour AND no active reminder.
- **Disabled (with countdown)** if a reminder was sent in the last 10 minutes — shows "Staff notified · resets in X:XX".
- After 10 minutes with no staff update, button becomes pressable again so students can re-nudge.
- When staff submit a new headcount, any active reminder is cleared and the button hides again until the next hour-stale window.

**Staff/Admin view:**
- A dismissible alert banner appears at the top of the Employee dashboard and Admin panel when an active reminder exists: "Students are requesting a capacity update — please submit a new headcount." with a CTA scrolling to / linking to the Headcount form.
- Banner auto-clears once a new `facility_count` row is inserted (detected via the existing realtime subscription).

## Data Model

New table `capacity_reminders` (single active row pattern):
```
id            uuid pk default gen_random_uuid()
created_at    timestamptz default now()
created_by    text  -- user id or 'anonymous'
resolved_at   timestamptz nullable  -- set when staff submits headcount or 10min passes
```

RLS:
- SELECT: anon + authenticated (everyone needs to see active reminder state).
- INSERT: anon + authenticated (any signed-in student can press).
- UPDATE: anon + authenticated (so staff submission flow can mark resolved).

Realtime: enable on `capacity_reminders` so all clients sync instantly when one student presses.

"Active reminder" query: `select * from capacity_reminders where resolved_at is null and created_at > now() - interval '10 minutes' order by created_at desc limit 1`.

## Frontend Changes

**`src/context/GymContext.tsx`**
- Track `activeReminder: { id, created_at } | null` via initial fetch + realtime subscription on `capacity_reminders`.
- Expose `createReminder()` helper (inserts a row).
- In existing `facility_count` realtime INSERT handler: also UPDATE any unresolved reminder rows to set `resolved_at = now()`.

**New `src/components/CapacityReminderButton.tsx`**
- Reads `lastUpdated` and `activeReminder` from context.
- Computes: `staleMinutes = (now - lastUpdated)/60000`, `reminderAgeSec`.
- Renders nothing if `staleMinutes < 60` AND no active reminder.
- Renders enabled button (Bell icon, "Remind staff to update capacity") if stale and no active reminder.
- Renders disabled chip with live countdown (ticks every 1s) if active reminder exists.
- On click: calls `createReminder()`, optimistic toast "Staff have been notified".

**`src/pages/Capacity.tsx`**
- Mount `<CapacityReminderButton />` directly under `<LastUpdated />` (only for student role — gate with `useAuth()` role check; staff/admin don't see it).

**`src/pages/Employee.tsx` and `src/pages/Admin.tsx`**
- Add a `<CapacityReminderAlert />` banner at the top: yellow/amber alert with Bell icon, message, dismiss is implicit (auto-clears on headcount submission).
- New shared component `src/components/CapacityReminderAlert.tsx` reading `activeReminder` from context.

## Files

- New migration: `capacity_reminders` table + RLS + realtime publication.
- New: `src/components/CapacityReminderButton.tsx`
- New: `src/components/CapacityReminderAlert.tsx`
- Edit: `src/context/GymContext.tsx` (track reminder, auto-resolve on headcount insert, expose createReminder)
- Edit: `src/pages/Capacity.tsx` (mount button for students)
- Edit: `src/pages/Employee.tsx` (mount alert)
- Edit: `src/pages/Admin.tsx` (mount alert)
