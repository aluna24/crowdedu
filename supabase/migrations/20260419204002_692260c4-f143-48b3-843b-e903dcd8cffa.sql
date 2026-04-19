CREATE OR REPLACE FUNCTION public.cancel_reservation(p_user_id text, p_reservation_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reservation class_reservations%ROWTYPE;
  v_class fitness_classes%ROWTYPE;
  v_pass fitness_passes%ROWTYPE;
BEGIN
  -- Lock the reservation
  SELECT * INTO v_reservation FROM class_reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Reservation not found');
  END IF;

  -- Verify ownership
  IF v_reservation.user_id <> p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Lock the class
  SELECT * INTO v_class FROM fitness_classes WHERE id = v_reservation.class_id FOR UPDATE;
  IF FOUND THEN
    UPDATE fitness_classes
    SET current_enrolled = GREATEST(current_enrolled - 1, 0)
    WHERE id = v_reservation.class_id;
  END IF;

  -- Lock the pass and refund (skip semester / null)
  SELECT * INTO v_pass FROM fitness_passes WHERE id = v_reservation.pass_id FOR UPDATE;
  IF FOUND AND v_pass.classes_remaining IS NOT NULL THEN
    UPDATE fitness_passes
    SET classes_remaining = classes_remaining + 1,
        status = 'active'
    WHERE id = v_reservation.pass_id;
  END IF;

  -- Delete the reservation
  DELETE FROM class_reservations WHERE id = p_reservation_id;

  RETURN json_build_object('success', true);
END;
$function$;