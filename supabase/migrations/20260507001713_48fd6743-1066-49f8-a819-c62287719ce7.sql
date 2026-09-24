
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS geo_address text,
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Allow placing orders to also store user_id when authenticated
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  customer_name IS NOT NULL
  AND phone IS NOT NULL
  AND city IS NOT NULL
  AND address IS NOT NULL
  AND items IS NOT NULL
  AND subtotal_xaf >= 0
  AND total_xaf >= 0
  AND status = 'pending'
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- Allow signed-in users to see their own orders
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
CREATE POLICY "Users view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
