-- Add delivery fields to profiles so returning users don't re-enter them
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS delivery_zone text DEFAULT 'yaounde',
  ADD COLUMN IF NOT EXISTS full_name text;
