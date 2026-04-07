

## Problem

Two issues block headcount submissions from the Employee page:

1. **`Entry_num` has no default value** — The column is `NOT NULL` with no default. The Employee form doesn't set it, so every INSERT fails with a NOT NULL constraint violation.

2. **RLS blocks anonymous inserts** — The INSERT policy only allows `authenticated` users, but the app uses mock authentication (not real Supabase Auth). All requests go through with the `anon` role, which is rejected by RLS.

## Plan

### 1. Add auto-increment default to `Entry_num`

Create a migration to add a default value so new rows automatically get the next number:

```sql
-- Create a sequence starting after the current max
CREATE SEQUENCE facility_count_entry_num_seq;
SELECT setval('facility_count_entry_num_seq', (SELECT COALESCE(MAX("Entry_num"), 0) FROM facility_count));
ALTER TABLE facility_count ALTER COLUMN "Entry_num" SET DEFAULT nextval('facility_count_entry_num_seq');
```

### 2. Allow anonymous inserts (temporary for MVP)

Since the app uses mock auth (no real Supabase Auth), update the INSERT RLS policy to also allow the `anon` role:

```sql
DROP POLICY "Allow authenticated insert" ON facility_count;
CREATE POLICY "Allow insert access"
ON facility_count FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

This is appropriate for the MVP since the Employee page is already behind mock role-based routing. When real Supabase Auth is implemented later, this can be tightened back to `authenticated` only.

### Files changed
- **1 new migration** (SQL only, no app code changes needed)

