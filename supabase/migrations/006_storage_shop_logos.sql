-- ============================================================
-- MINISTORE — Storage : logos des boutiques
-- Migration 006
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-logos',
  'shop-logos',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "shop_logos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-logos');

CREATE POLICY "shop_logos_owner_write"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM profiles WHERE id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "shop_logos_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shop-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM profiles WHERE id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "shop_logos_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shop-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM profiles WHERE id = auth.uid() AND role = 'owner'
  )
);
