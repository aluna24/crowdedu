-- Drop the sequence created by the failed partial migration
DROP SEQUENCE IF EXISTS facility_count_entry_num_seq;

-- Allow anon inserts for MVP (mock auth)
DROP POLICY IF EXISTS "Allow authenticated insert" ON facility_count;
CREATE POLICY "Allow insert access"
ON facility_count FOR INSERT
TO anon, authenticated
WITH CHECK (true);