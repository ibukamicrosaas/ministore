-- Bucket public pour les photos de prestations
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-photos',
  'service-photos',
  true,
  5242880, -- 5 Mo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique
CREATE POLICY "service_photos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-photos');

-- Upload uniquement par le propriétaire du salon
CREATE POLICY "service_photos_owner_write"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT salon_id::text
    FROM profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "service_photos_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT salon_id::text
    FROM profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "service_photos_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT salon_id::text
    FROM profiles
    WHERE id = auth.uid() AND role = 'owner'
  )
);
