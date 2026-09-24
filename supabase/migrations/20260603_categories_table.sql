-- Migration : Table categories dynamiques
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  parent_slug text REFERENCES public.categories(slug) ON DELETE CASCADE,
  image_url text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "Categories viewable by all"
ON public.categories FOR SELECT TO anon, authenticated USING (true);

-- Écriture réservée aux admins
CREATE POLICY "Admins manage categories"
ON public.categories FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket storage pour les images de catégories
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read category images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'category-images');

CREATE POLICY "Admins upload category images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'category-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete category images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'category-images' AND public.has_role(auth.uid(), 'admin'));

-- Seed : insérer les catégories existantes
INSERT INTO public.categories (slug, label, parent_slug, position) VALUES
  ('drones', 'Drones', NULL, 1),
  ('drone-debutant', 'Drone débutant', 'drones', 1),
  ('drone-amateur', 'Drone amateur', 'drones', 2),
  ('drone-semi-pro', 'Drone semi-pro', 'drones', 3),
  ('drone-professionnel', 'Drone professionnel', 'drones', 4),
  ('accessoires-drone', 'Accessoires drone', NULL, 2),
  ('drone-moteurs', 'Moteurs', 'accessoires-drone', 1),
  ('drone-helices', 'Hélices', 'accessoires-drone', 2),
  ('drone-batteries', 'Batteries & chargeurs', 'accessoires-drone', 3),
  ('drone-telecommandes', 'Télécommandes & récepteurs', 'accessoires-drone', 4),
  ('drone-cameras', 'Caméras & nacelles', 'accessoires-drone', 5),
  ('electronique', 'Électronique', NULL, 3),
  ('gadgets', 'Gadgets', NULL, 4)
ON CONFLICT (slug) DO NOTHING;
