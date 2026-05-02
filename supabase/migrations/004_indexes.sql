-- ============================================================
-- BEAUTYDESK — Index de performance
-- Migration 004
-- ============================================================

-- Salons : lookup par slug (très fréquent — PWA)
CREATE INDEX IF NOT EXISTS idx_salons_slug ON salons(slug);
CREATE INDEX IF NOT EXISTS idx_salons_is_active ON salons(is_active);

-- Profiles : lookup par user + salon
CREATE INDEX IF NOT EXISTS idx_profiles_salon_id ON profiles(salon_id);

-- Staff : lookup par salon
CREATE INDEX IF NOT EXISTS idx_staff_salon_id ON staff(salon_id);
CREATE INDEX IF NOT EXISTS idx_staff_salon_active ON staff(salon_id, is_active);

-- Services : lookup par salon + actif
CREATE INDEX IF NOT EXISTS idx_services_salon_id ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_salon_active ON services(salon_id, is_active);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(salon_id, display_order);

-- Clients : lookup par salon + phone
CREATE INDEX IF NOT EXISTS idx_clients_salon_id ON clients(salon_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(salon_id, phone);

-- Bookings : les plus critiques (requêtes de disponibilité + dashboard)
CREATE INDEX IF NOT EXISTS idx_bookings_salon_date ON bookings(salon_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_salon_status ON bookings(salon_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_staff_date ON bookings(staff_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_client_token ON bookings(client_token);
CREATE INDEX IF NOT EXISTS idx_bookings_pending_created ON bookings(status, created_at) WHERE status = 'pending';

-- Payments : lookup par booking
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_salon_id ON payments(salon_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments(provider_payment_id);

-- Commissions : lookup par staff + semaine
CREATE INDEX IF NOT EXISTS idx_commissions_staff_week ON commissions(staff_id, year, week_number);
CREATE INDEX IF NOT EXISTS idx_commissions_salon_week ON commissions(salon_id, year, week_number);
CREATE INDEX IF NOT EXISTS idx_commissions_unpaid ON commissions(salon_id, is_paid) WHERE is_paid = false;

-- Blocked slots : lookup par salon + date
CREATE INDEX IF NOT EXISTS idx_blocked_slots_salon_date ON blocked_slots(salon_id, blocked_date);

-- Notification logs : lookup par réservation
CREATE INDEX IF NOT EXISTS idx_notification_logs_booking ON notification_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_salon ON notification_logs(salon_id);
