CREATE TABLE public.capacity_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_capacity_reminders_active
  ON public.capacity_reminders (created_at DESC)
  WHERE resolved_at IS NULL;

ALTER TABLE public.capacity_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reminders"
  ON public.capacity_reminders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create reminders"
  ON public.capacity_reminders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can resolve reminders"
  ON public.capacity_reminders FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.capacity_reminders;
ALTER TABLE public.capacity_reminders REPLICA IDENTITY FULL;