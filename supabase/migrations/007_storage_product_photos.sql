-- ============================================================
-- MINISTORE — Storage : photos des produits (multi-photos)
-- Migration 007
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-photos',
  'product-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "product_photos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-photos');

CREATE POLICY "product_photos_owner_write"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM profiles WHERE id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "product_photos_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM profiles WHERE id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "product_photos_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM profiles WHERE id = auth.uid() AND role = 'owner'
  )
);
