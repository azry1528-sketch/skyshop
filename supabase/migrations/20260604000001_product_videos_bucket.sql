-- Bucket for product videos uploaded from admin
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-videos',
  'product-videos',
  true,
  524288000,  -- 500 MB max
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read
CREATE POLICY "Public read product videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-videos');

-- Allow admin upload
CREATE POLICY "Admin upload product videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-videos');

CREATE POLICY "Admin update product videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-videos');

CREATE POLICY "Admin delete product videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-videos');
