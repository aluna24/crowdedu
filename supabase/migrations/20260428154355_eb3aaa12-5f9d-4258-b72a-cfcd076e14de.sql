-- 1. Add status to fitness_classes
ALTER TABLE public.fitness_classes
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- 2. Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  date_label text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'event',
  priority integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert events"
  ON public.events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update events"
  ON public.events FOR UPDATE
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete events"
  ON public.events FOR DELETE
  USING (true);

CREATE TRIGGER events_set_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed initial events
INSERT INTO public.events (title, date_label, description, type, priority) VALUES
  ('Spring Fitness Challenge', 'Apr 7 – Apr 21', 'Compete in weekly fitness challenges for prizes. Sign up at the front desk or online.', 'event', 10),
  ('Pool Maintenance Closure', 'Mar 29 – Mar 31', 'The pool area will be closed for scheduled maintenance. All other areas remain open.', 'closure', 20),
  ('New Climbing Wall Hours', 'Starting Apr 1', 'The climbing wall will now be open until 9 PM on weekdays due to popular demand.', 'news', 30),
  ('Intramural Basketball Finals', 'Apr 18', 'Come watch the championship game at the 4th Floor Courts at 7 PM. Free admission.', 'event', 40),
  ('Summer Membership Registration', 'Opens May 1', 'Summer memberships for non-students will be available starting May 1.', 'news', 50);
