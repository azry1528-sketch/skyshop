-- Colonne utilisée par l'admin (Products.tsx) et la fiche produit (ProductDetail.tsx)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS benefit_images text[] NOT NULL DEFAULT '{}';

-- Recharge le cache de schéma de PostgREST (corrige « schema cache »)
NOTIFY pgrst, 'reload schema';
