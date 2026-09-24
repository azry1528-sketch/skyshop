-- Paiement par carte cadeau / crypto uniquement : on stocke le code carte
-- cadeau ou le hash de transaction crypto associé à la commande.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_reference text;
