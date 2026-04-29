
-- Set search_path on remaining functions
ALTER FUNCTION public.generate_short_code() SET search_path = public;
ALTER FUNCTION public.set_order_short_code() SET search_path = public;
ALTER FUNCTION public.touch_updated_at() SET search_path = public;

-- Revoke public EXECUTE from internal trigger/helper functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_order_short_code() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_short_code() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, public;
-- has_role and get_user_role kept callable by authenticated for RLS use; no public.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
