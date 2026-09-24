-- Précommande : colonnes produit
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_preorder boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS preorder_label varchar DEFAULT 'Prévente exclusive',
  ADD COLUMN IF NOT EXISTS preorder_date date DEFAULT null,
  ADD COLUMN IF NOT EXISTS preorder_deadline timestamptz DEFAULT null,
  ADD COLUMN IF NOT EXISTS preorder_max_units int DEFAULT null,
  ADD COLUMN IF NOT EXISTS preorder_deposit_pct int DEFAULT 30,
  ADD COLUMN IF NOT EXISTS preorder_bonus text DEFAULT null;

-- Précommande : colonnes commande
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS is_preorder boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_amount_xaf int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining_amount_xaf int DEFAULT 0;
