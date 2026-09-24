DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);