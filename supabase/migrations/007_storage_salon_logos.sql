-- Bucket public pour les logos de salons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'salon-logos',
  'salon-logos',
  true,
  2097152, -- 2 Mo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique
CREATE POLICY "salon_logos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'salon-logos');

-- Upload/update uniquement par le propriétaire du salon
CREATE POLICY "salon_logos_owner_write"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'salon-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT salon_id::text
    FROM profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "salon_logos_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'salon-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT salon_id::text
    FROM profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "salon_logos_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'salon-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT salon_id::text
    FROM profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
);
