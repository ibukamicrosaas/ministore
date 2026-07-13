-- Migration 055 : corriger la politique RLS pour les boutiques inactives
--
-- Problème : shops_public_read n'autorisait la lecture que des boutiques
-- avec is_active = true. Quand un abonnement expirait, la boutique devenait
-- illisible par le rôle anon → le layout retournait notFound() → 404.
--
-- Fix : autoriser la lecture publique des boutiques actives OU des boutiques
-- payantes inactives (abonnement expiré). Les boutiques en essai gratuit
-- non activées restent masquées (plan = 'trial' ET is_active = false).

DROP POLICY IF EXISTS "shops_public_read" ON shops;

CREATE POLICY "shops_public_read" ON shops
  FOR SELECT USING (
    is_active = true
    OR plan <> 'trial'
  );
