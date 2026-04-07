

## Problem

The capacity data is entirely managed in **local React state** (`GymContext`). The `facility_count` table in Supabase has real data (196 entries), but the app never reads from it. The Employee form also only updates local state — it never writes to Supabase. So:

1. The Capacity page always starts at 0 for all areas
2. Employee submissions don't persist
3. Multiple users/tabs don't stay in sync

## Plan

### 1. Fetch latest counts from Supabase on load

Update `GymContext` to query the `facility_count` table on mount, fetching the most recent row (highest `Entry_num`) and using those values to initialize floor counts.

### 2. Subscribe to real-time updates

- Enable realtime on the `facility_count` table (SQL migration: `ALTER PUBLICATION supabase_realtime ADD TABLE facility_count`)
- Add a Supabase realtime subscription in `GymContext` that listens for `INSERT` events and updates floor counts automatically when new rows arrive

### 3. Write to Supabase on Employee form submit

Update the `Employee` page's `handleSubmit` to insert a new row into `facility_count` with all current floor values (keeping unchanged floors at their current counts, updating only the selected floor). This replaces the local-only `updateFloorCount` call.

### 4. Add RLS policy for public read access

The `facility_count` table has no RLS policies. Add a policy allowing anonymous/public `SELECT` so the capacity page works for all visitors without login.

### 5. Map Supabase columns to app floor IDs

Create a mapping between the app's floor IDs (e.g. `"fc"`) and the Supabase column names (e.g. `"Fitness Center"`) to correctly read/write data.

### Technical details

- **Migration SQL**: Enable realtime + add RLS select policy
- **Files modified**: `GymContext.tsx` (fetch + subscribe), `Employee.tsx` (insert row on submit)
- **New mapping**: A constant object mapping floor IDs to DB column names, placed in `GymContext.tsx`

