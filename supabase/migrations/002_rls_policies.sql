-- ============================================================
-- BEAUTYDESK — Row Level Security Policies
-- Migration 002
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Fonction helper : récupère le salon_id de l'utilisateur connecté
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_salon_id()
RETURNS UUID AS $$
  SELECT salon_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Fonction helper : récupère le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- SALONS
-- ============================================================

-- Lecture publique des salons actifs (nécessaire pour la PWA)
CREATE POLICY "salons_public_read" ON salons
  FOR SELECT USING (is_active = true);

-- Owner : accès complet à son salon
CREATE POLICY "salons_owner_update" ON salons
  FOR UPDATE USING (id = get_my_salon_id() AND get_my_role() = 'owner');

-- ============================================================
-- PROFILES
-- ============================================================

-- Lecture : chaque utilisateur voit son propre profil
CREATE POLICY "profiles_self_read" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Owner : voit tous les profils de son salon
CREATE POLICY "profiles_owner_read" ON profiles
  FOR SELECT USING (
    salon_id = get_my_salon_id() AND get_my_role() = 'owner'
  );

-- Chaque utilisateur met à jour son propre profil
CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Insertion : gérée via trigger post-signup (service role)
-- La policy INSERT est donc pour le service role uniquement (pas de policy client)

-- ============================================================
-- STAFF
-- ============================================================

-- Lecture publique des employées actives (affichage dans la PWA client)
CREATE POLICY "staff_public_read" ON staff
  FOR SELECT USING (is_active = true);

-- Owner : CRUD complet sur les employées de son salon
CREATE POLICY "staff_owner_all" ON staff
  FOR ALL USING (
    salon_id = get_my_salon_id() AND get_my_role() = 'owner'
  );

-- Staff : voit sa propre fiche
CREATE POLICY "staff_self_read" ON staff
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- SERVICES
-- ============================================================

-- Lecture publique des services actifs (PWA client)
CREATE POLICY "services_public_read" ON services
  FOR SELECT USING (is_active = true);

-- Owner : CRUD complet sur les services de son salon
CREATE POLICY "services_owner_all" ON services
  FOR ALL USING (
    salon_id = get_my_salon_id() AND get_my_role() = 'owner'
  );

-- ============================================================
-- CLIENTS
-- ============================================================

-- Owner : accès complet aux clients de son salon
CREATE POLICY "clients_owner_all" ON clients
  FOR ALL USING (
    salon_id = get_my_salon_id() AND get_my_role() = 'owner'
  );

-- Insertion publique (création cliente lors d'une réservation)
-- Gérée uniquement via service role dans les webhooks

-- ============================================================
-- BOOKINGS
-- ============================================================

-- Insertion publique : une cliente peut créer une réservation
CREATE POLICY "bookings_public_insert" ON bookings
  FOR INSERT WITH CHECK (true);

-- Lecture publique limitée : accès via client_token (pour l'espace client)
CREATE POLICY "bookings_token_read" ON bookings
  FOR SELECT USING (
    client_token IS NOT NULL
  );

-- Owner : accès complet aux réservations de son salon
CREATE POLICY "bookings_owner_all" ON bookings
  FOR ALL USING (
    salon_id = get_my_salon_id() AND get_my_role() = 'owner'
  );

-- Staff : voit les réservations qui lui sont assignées
CREATE POLICY "bookings_staff_read" ON bookings
  FOR SELECT USING (
    staff_id IN (
      SELECT id FROM staff WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- PAYMENTS
-- ============================================================

-- Owner : lecture des paiements de son salon
CREATE POLICY "payments_owner_read" ON payments
  FOR SELECT USING (
    salon_id = get_my_salon_id() AND get_my_role() = 'owner'
  );

-- Insertion/mise à jour : service role uniquement (webhooks)

-- ============================================================
-- COMMISSIONS
-- ============================================================

-- Owner : accès complet aux commissions de son salon
CREATE POLICY "commissions_owner_all" ON commissions
  FOR ALL USING (
    salon_id = get_my_salon_id() AND get_my_role() = 'owner'
  );

-- Staff : voit ses propres commissions
CREATE POLICY "commissions_staff_read" ON commissions
  FOR SELECT USING (
    staff_id IN (
      SELECT id FROM staff WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- BLOCKED SLOTS
-- ============================================================

-- Lecture publique (nécessaire pour le calcul des disponibilités)
CREATE POLICY "blocked_slots_public_read" ON blocked_slots
  FOR SELECT USING (true);

-- Owner : CRUD complet
CREATE POLICY "blocked_slots_owner_all" ON blocked_slots
  FOR ALL USING (
    salon_id = get_my_salon_id() AND get_my_role() = 'owner'
  );

-- ============================================================
-- NOTIFICATION LOGS
-- ============================================================

-- Owner : lecture des logs de son salon
CREATE POLICY "notification_logs_owner_read" ON notification_logs
  FOR SELECT USING (
    salon_id = get_my_salon_id() AND get_my_role() = 'owner'
  );

-- Insertion : service role uniquement
