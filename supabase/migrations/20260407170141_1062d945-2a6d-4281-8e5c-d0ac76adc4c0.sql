-- Enable RLS on facility_count
ALTER TABLE public.facility_count ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) read access
CREATE POLICY "Allow public read access"
ON public.facility_count
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert"
ON public.facility_count
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE facility_count;