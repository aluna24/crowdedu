## Goal
Make the homepage show real data for today's classes instead of hardcoded values.

## Changes (single file: `src/pages/Home.tsx`)

1. **Fetch classes from Supabase on mount**
   - Add `useEffect` that queries `fitness_classes` (selecting `id`, `name`, `time`, `day`) once.
   - Store in local state `todaysClasses`.
   - Filter where `day === today's weekday name` (e.g. "Tuesday").
   - Sort ascending by parsed time using a small `parseClassTime` helper (same logic as `GroupFitness.tsx`: parses "7:00 PM" → minutes).

2. **Quick Stats — "Classes Today"**
   - Replace hardcoded `8` with `todaysClasses.length` (will show 5 on Tuesdays, 3 on weekends, etc.).

3. **Feature card badge — "Group Fitness"**
   - Replace static `"8 Today"` badge with `` `${todaysClasses.length} Today` ``.

4. **"Today's Classes" section**
   - Remove the hardcoded `todaysClasses` array.
   - Render the fetched list (name + time). If empty, show a friendly "No classes scheduled today" empty state.
   - Keep current row styling; "Reserve" link still points to `/group-fitness`.
   - Optional: limit display to first 5–6 entries with "View all" already linking to full schedule.

## Notes
- No DB changes needed (RLS already allows anon SELECT on `fitness_classes`).
- No new dependencies; reuses existing `supabase` client and date logic.
