-- ============================================================
-- BEAUTYDESK — Fonctions utilitaires PostgreSQL
-- Migration 003
-- ============================================================

-- ============================================================
-- Trigger : création automatique du profil après signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Calcul des créneaux disponibles pour un service/date/salon
-- ============================================================
CREATE OR REPLACE FUNCTION get_available_slots(
  p_salon_id UUID,
  p_service_id UUID,
  p_date DATE
)
RETURNS TABLE(
  slot_time TIME,
  is_available BOOLEAN,
  available_staff_count INTEGER
) AS $$
DECLARE
  v_salon salons%ROWTYPE;
  v_service services%ROWTYPE;
  v_day_name TEXT;
  v_opening JSONB;
  v_open_time TIME;
  v_close_time TIME;
  v_is_closed BOOLEAN;
  v_current_slot TIME;
  v_slot_end TIME;
  v_conflict_count INTEGER;
  v_blocked_count INTEGER;
  v_total_staff INTEGER;
BEGIN
  -- Récupérer les infos du salon
  SELECT * INTO v_salon FROM salons WHERE id = p_salon_id AND is_active = true;
  IF NOT FOUND THEN RETURN; END IF;

  -- Récupérer les infos du service
  SELECT * INTO v_service FROM services WHERE id = p_service_id AND salon_id = p_salon_id AND is_active = true;
  IF NOT FOUND THEN RETURN; END IF;

  -- Récupérer le nom du jour en anglais (format JSONB)
  v_day_name := LOWER(TO_CHAR(p_date, 'day'));
  v_day_name := TRIM(v_day_name);

  -- Extraire les horaires du jour
  v_opening := v_salon.opening_hours -> v_day_name;
  IF v_opening IS NULL OR (v_opening->>'closed')::BOOLEAN = true THEN
    RETURN; -- Salon fermé ce jour
  END IF;

  v_open_time := (v_opening->>'open')::TIME;
  v_close_time := (v_opening->>'close')::TIME;

  -- Compter le nombre d'employées pouvant effectuer ce service
  IF array_length(v_service.staff_ids, 1) IS NULL OR array_length(v_service.staff_ids, 1) = 0 THEN
    SELECT COUNT(*) INTO v_total_staff FROM staff
    WHERE salon_id = p_salon_id AND is_active = true;
  ELSE
    SELECT COUNT(*) INTO v_total_staff FROM staff
    WHERE id = ANY(v_service.staff_ids) AND salon_id = p_salon_id AND is_active = true;
  END IF;

  IF v_total_staff = 0 THEN
    v_total_staff := 1; -- Salon sans employées enregistrées
  END IF;

  -- Générer les créneaux par tranches de 30 minutes
  v_current_slot := v_open_time;
  WHILE v_current_slot + (v_service.duration_minutes * INTERVAL '1 minute') <= v_close_time LOOP
    v_slot_end := v_current_slot + (v_service.duration_minutes * INTERVAL '1 minute');

    -- Compter les réservations actives qui chevauchent ce créneau
    SELECT COUNT(*) INTO v_conflict_count
    FROM bookings
    WHERE salon_id = p_salon_id
      AND booking_date = p_date
      AND status IN ('confirmed', 'present')
      AND booking_time < v_slot_end
      AND (booking_time + (duration_minutes * INTERVAL '1 minute')) > v_current_slot;

    -- Compter les créneaux bloqués qui chevauchent
    SELECT COUNT(*) INTO v_blocked_count
    FROM blocked_slots
    WHERE salon_id = p_salon_id
      AND (staff_id IS NULL) -- bloqué pour tout le salon
      AND blocked_date = p_date
      AND start_time < v_slot_end
      AND end_time > v_current_slot;

    slot_time := v_current_slot;
    is_available := (v_blocked_count = 0) AND (v_conflict_count < v_total_staff);
    available_staff_count := GREATEST(0, v_total_staff - v_conflict_count);

    RETURN NEXT;

    v_current_slot := v_current_slot + INTERVAL '30 minutes';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Calcul et insertion des commissions pour une réservation
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_and_insert_commission(
  p_booking_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_staff staff%ROWTYPE;
  v_commission_amount INTEGER;
  v_week_number INTEGER;
  v_year INTEGER;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND OR v_booking.staff_id IS NULL THEN RETURN; END IF;
  IF v_booking.status != 'completed' THEN RETURN; END IF;

  SELECT * INTO v_staff FROM staff WHERE id = v_booking.staff_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF v_staff.remuneration_type != 'commission' THEN RETURN; END IF;
  IF v_staff.commission_rate IS NULL THEN RETURN; END IF;

  -- Calcul : floor(total_price * commission_rate / 100)
  v_commission_amount := FLOOR(v_booking.total_price * v_staff.commission_rate / 100);

  -- Semaine ISO (lundi-dimanche)
  v_week_number := EXTRACT(WEEK FROM v_booking.booking_date);
  v_year := EXTRACT(YEAR FROM v_booking.booking_date);

  INSERT INTO commissions (
    salon_id, staff_id, booking_id,
    service_price, commission_rate, commission_amount,
    week_number, year
  )
  VALUES (
    v_booking.salon_id, v_staff.id, p_booking_id,
    v_booking.total_price, v_staff.commission_rate, v_commission_amount,
    v_week_number, v_year
  )
  ON CONFLICT (booking_id, staff_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Expirer les réservations pending de plus de 30 minutes
-- ============================================================
CREATE OR REPLACE FUNCTION expire_pending_bookings()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE bookings
  SET
    status = 'cancelled',
    cancellation_reason = 'expired',
    updated_at = NOW()
  WHERE
    status = 'pending'
    AND deposit_paid = false
    AND created_at < NOW() - INTERVAL '30 minutes';

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Upsert client lors d'une réservation confirmée
-- ============================================================
CREATE OR REPLACE FUNCTION upsert_client_from_booking(
  p_salon_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone TEXT,
  p_whatsapp TEXT,
  p_email TEXT
)
RETURNS UUID AS $$
DECLARE
  v_client_id UUID;
BEGIN
  INSERT INTO clients (salon_id, first_name, last_name, phone, whatsapp, email)
  VALUES (p_salon_id, p_first_name, p_last_name, p_phone, p_whatsapp, p_email)
  ON CONFLICT (salon_id, phone) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = COALESCE(EXCLUDED.last_name, clients.last_name),
    whatsapp = COALESCE(EXCLUDED.whatsapp, clients.whatsapp),
    email = COALESCE(EXCLUDED.email, clients.email),
    total_visits = clients.total_visits + 1,
    last_visit_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_client_id;

  RETURN v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
