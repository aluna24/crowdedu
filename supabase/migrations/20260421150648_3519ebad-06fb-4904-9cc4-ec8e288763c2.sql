CREATE TABLE public.equipment_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name TEXT NOT NULL,
  report_date DATE NOT NULL,
  equipment_name TEXT NOT NULL,
  equipment_number TEXT NOT NULL,
  reported_status TEXT NOT NULL,
  note TEXT,
  review_status TEXT NOT NULL DEFAULT 'needs_attention',
  resolution_status TEXT,
  admin_notes TEXT,
  submitted_by_user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view equipment tickets"
ON public.equipment_tickets FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert equipment tickets"
ON public.equipment_tickets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update equipment tickets"
ON public.equipment_tickets FOR UPDATE
USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER equipment_tickets_updated_at
BEFORE UPDATE ON public.equipment_tickets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();