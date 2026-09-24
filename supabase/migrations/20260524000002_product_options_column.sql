-- Options/bundles produit (ex: pack solo, pack duo, pack pro)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS options jsonb DEFAULT '[]'::jsonb;

-- long_description si pas encore appliqué
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS long_description text;
