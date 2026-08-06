-- Purge des boutiques brouillon créées pendant /start puis jamais rattachées à un compte
-- (parcours abandonné avant l'écran 9). Suit le même pattern que expire_pending_orders /
-- cleanup_pin_resets : fonction SQL appelée depuis un cron Vercel, pas pg_cron.

CREATE OR REPLACE FUNCTION purge_draft_shops()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH orphan_drafts AS (
    SELECT s.id
    FROM shops s
    LEFT JOIN profiles p ON p.shop_id = s.id
    WHERE s.status = 'draft'
      AND s.created_at < now() - INTERVAL '7 days'
      AND p.id IS NULL
  )
  DELETE FROM shops WHERE id IN (SELECT id FROM orphan_drafts);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
