-- Plan Business : Storage pour les images de couverture
-- Migration 028

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-covers',
  'shop-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "shop_covers_public_read" ON storage.objects;
CREATE POLICY "shop_covers_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-covers');

DROP POLICY IF EXISTS "shop_covers_owner_write" ON storage.objects;
CREATE POLICY "shop_covers_owner_write"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-covers'
  AND (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM profiles WHERE id = auth.uid() AND role = 'owner'
  )
);

DROP POLICY IF EXISTS "shop_covers_owner_update" ON storage.objects;
CREATE POLICY "shop_covers_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shop-covers'
  AND (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM profiles WHERE id = auth.uid() AND role = 'owner'
  )
);

DROP POLICY IF EXISTS "shop_covers_owner_delete" ON storage.objects;
CREATE POLICY "shop_covers_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shop-covers'
  AND (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM profiles WHERE id = auth.uid() AND role = 'owner'
  )
);
