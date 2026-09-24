
-- Products catalog
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_xaf integer NOT NULL,
  old_price_xaf integer,
  category text NOT NULL,
  image_url text NOT NULL,
  stock integer NOT NULL DEFAULT 50,
  is_trending boolean NOT NULL DEFAULT false,
  is_promo boolean NOT NULL DEFAULT false,
  rating numeric(2,1) NOT NULL DEFAULT 4.5,
  reviews_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products readable by everyone"
  ON public.products FOR SELECT
  USING (true);

-- Orders (guest checkout, public insert)
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('JNG-' || upper(substring(replace(gen_random_uuid()::text,'-',''),1,8))),
  customer_name text NOT NULL,
  phone text NOT NULL,
  email text,
  city text NOT NULL,
  address text NOT NULL,
  delivery_zone text NOT NULL,
  delivery_fee_xaf integer NOT NULL DEFAULT 0,
  payment_method text NOT NULL,
  items jsonb NOT NULL,
  subtotal_xaf integer NOT NULL,
  total_xaf integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can place an order"
  ON public.orders FOR INSERT
  WITH CHECK (true);
