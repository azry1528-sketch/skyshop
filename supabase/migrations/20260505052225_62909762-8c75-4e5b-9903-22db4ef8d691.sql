-- Grant EXECUTE on has_role to anon and authenticated so RLS policies referencing it don't fail
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;