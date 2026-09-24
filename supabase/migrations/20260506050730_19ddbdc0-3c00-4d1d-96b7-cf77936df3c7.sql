CREATE OR REPLACE FUNCTION public.track_order(_reference text, _phone text)
RETURNS TABLE (
  reference text,
  status text,
  total_xaf integer,
  city text,
  delivery_zone text,
  payment_method text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.reference, o.status, o.total_xaf, o.city, o.delivery_zone, o.payment_method, o.created_at
  FROM public.orders o
  WHERE o.reference = _reference
    AND regexp_replace(o.phone, '\D', '', 'g') = regexp_replace(_phone, '\D', '', 'g')
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.track_order(text, text) TO anon, authenticated;