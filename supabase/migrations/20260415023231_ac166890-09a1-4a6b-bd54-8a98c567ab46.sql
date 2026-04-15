
-- Fitness classes table
CREATE TABLE public.fitness_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  instructor TEXT NOT NULL,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  current_enrolled INTEGER NOT NULL DEFAULT 0,
  max_spots INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fitness_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view classes" ON public.fitness_classes FOR SELECT TO anon, authenticated USING (true);

-- Seed initial class data
INSERT INTO public.fitness_classes (name, instructor, day, time, location, category, max_spots) VALUES
  ('Power Yoga', 'Sarah M.', 'Monday', '6:00 AM', '3rd Floor Studio', 'Yoga', 25),
  ('Spin Cycle', 'Chris D.', 'Monday', '12:00 PM', 'P3 Cycling Room', 'Cardio', 20),
  ('HIIT Express', 'Jordan K.', 'Tuesday', '5:30 PM', 'Fitness Center', 'HIIT', 30),
  ('Pilates Core', 'Mia L.', 'Wednesday', '7:00 AM', '3rd Floor Studio', 'Pilates', 20),
  ('Aqua Fit', 'Pat R.', 'Wednesday', '10:00 AM', 'Pool', 'Aqua', 15),
  ('Zumba', 'Alex T.', 'Thursday', '6:00 PM', '3M', 'Dance', 35),
  ('Barbell Strength', 'Sam W.', 'Friday', '4:00 PM', 'Fitness Center', 'Strength', 15);

-- Fitness passes table
CREATE TABLE public.fitness_passes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  pass_type TEXT NOT NULL CHECK (pass_type IN ('single', '3-pack', '5-pack', '10-pack', 'semester')),
  classes_remaining INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fitness_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view passes" ON public.fitness_passes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert passes" ON public.fitness_passes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update passes" ON public.fitness_passes FOR UPDATE TO anon, authenticated USING (true);

-- Class reservations table
CREATE TABLE public.class_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.fitness_classes(id) ON DELETE CASCADE,
  pass_id UUID NOT NULL REFERENCES public.fitness_passes(id) ON DELETE CASCADE,
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, class_id)
);

ALTER TABLE public.class_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reservations" ON public.class_reservations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert reservations" ON public.class_reservations FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Atomic reservation function to prevent overbooking
CREATE OR REPLACE FUNCTION public.reserve_class(
  p_user_id TEXT,
  p_class_id UUID,
  p_pass_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class fitness_classes%ROWTYPE;
  v_pass fitness_passes%ROWTYPE;
  v_existing class_reservations%ROWTYPE;
  v_reservation_id UUID;
BEGIN
  -- Lock the class row to prevent race conditions
  SELECT * INTO v_class FROM fitness_classes WHERE id = p_class_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Class not found');
  END IF;

  -- Check capacity
  IF v_class.current_enrolled >= v_class.max_spots THEN
    RETURN json_build_object('success', false, 'error', 'Class is full');
  END IF;

  -- Check for duplicate reservation
  SELECT * INTO v_existing FROM class_reservations WHERE user_id = p_user_id AND class_id = p_class_id;
  IF FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Already reserved');
  END IF;

  -- Lock and validate the pass
  SELECT * INTO v_pass FROM fitness_passes WHERE id = p_pass_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Pass not found');
  END IF;

  IF v_pass.status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Pass is not active');
  END IF;

  -- Decrement pass (skip for semester passes which have NULL classes_remaining)
  IF v_pass.classes_remaining IS NOT NULL THEN
    IF v_pass.classes_remaining <= 0 THEN
      RETURN json_build_object('success', false, 'error', 'No classes remaining on pass');
    END IF;

    UPDATE fitness_passes
    SET classes_remaining = classes_remaining - 1,
        status = CASE WHEN classes_remaining - 1 <= 0 THEN 'exhausted' ELSE 'active' END
    WHERE id = p_pass_id;
  END IF;

  -- Increment class enrollment
  UPDATE fitness_classes SET current_enrolled = current_enrolled + 1 WHERE id = p_class_id;

  -- Create reservation
  INSERT INTO class_reservations (user_id, class_id, pass_id)
  VALUES (p_user_id, p_class_id, p_pass_id)
  RETURNING id INTO v_reservation_id;

  RETURN json_build_object('success', true, 'reservation_id', v_reservation_id);
END;
$$;
